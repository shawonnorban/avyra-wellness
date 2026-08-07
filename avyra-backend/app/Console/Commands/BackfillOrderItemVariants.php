<?php

namespace App\Console\Commands;

use App\Models\OrderItem;
use App\Models\ProductVariant;
use Illuminate\Console\Command;

/**
 * Reconnects old order lines to the variant they were sold as.
 *
 * Order items gained `variant_id` and `variant_label` in the same migration, but
 * lines written before the checkout was taught to pass the id kept only the
 * label. They still show the right thing on an invoice — the label is a snapshot
 * — but they count against no variant, so per-variant "sold" reads zero.
 *
 * Matching is on the exact label a variant would produce today. Anything that
 * does not match exactly is reported and left alone: guessing which variant an
 * old order meant would quietly rewrite sales history.
 *
 * Reports by default; only `--apply` writes.
 */
class BackfillOrderItemVariants extends Command
{
    protected $signature = 'orders:backfill-variants {--apply : Write the changes instead of reporting them}';

    protected $description = 'Link old order items to their variant using the stored label';

    public function handle(): int
    {
        $orphans = OrderItem::query()
            ->whereNull('variant_id')
            ->whereNotNull('variant_label')
            ->with('order:id,order_number')
            ->get();

        if ($orphans->isEmpty()) {
            $this->info('Nothing to backfill — every order line with a label already has a variant.');

            return self::SUCCESS;
        }

        $apply = (bool) $this->option('apply');
        $matched = 0;
        $skipped = [];

        foreach ($orphans as $item) {
            $variant = ProductVariant::where('product_id', $item->product_id)
                ->get()
                ->first(fn (ProductVariant $v) => $this->labelFor($v) === $item->variant_label);

            if (! $variant) {
                $skipped[] = $item;

                continue;
            }

            $this->line(sprintf(
                '  %s  %-10s → %s',
                $item->order?->order_number ?? $item->order_id,
                $item->variant_label,
                $variant->sku_suffix,
            ));

            if ($apply) {
                $item->forceFill(['variant_id' => $variant->id])->saveQuietly();
            }

            $matched++;
        }

        foreach ($skipped as $item) {
            $this->warn(sprintf(
                '  %s  %-10s → no exact match, left alone',
                $item->order?->order_number ?? $item->order_id,
                $item->variant_label,
            ));
        }

        $this->newLine();
        $this->info(sprintf(
            '%s %d of %d line(s); %d need a human.',
            $apply ? 'Linked' : 'Would link',
            $matched,
            $orphans->count(),
            count($skipped),
        ));

        if (! $apply && $matched > 0) {
            $this->comment('Re-run with --apply to write these.');
        }

        return self::SUCCESS;
    }

    /** The label the checkout would write for this variant today. */
    private function labelFor(ProductVariant $variant): ?string
    {
        return trim(implode(' / ', array_filter([$variant->size, $variant->color]))) ?: null;
    }
}
