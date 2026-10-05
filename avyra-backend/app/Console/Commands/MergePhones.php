<?php

namespace App\Console\Commands;

use App\Enums\OrderStatus;
use App\Models\CustomerRiskProfile;
use App\Support\Phone;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Brings existing rows onto the canonical phone form, merges the duplicates that the
 * old digit-only matching created, and backfills the re-order snapshot.
 *
 * Dry-run by default. Everything runs inside one transaction and is rolled back unless
 * `--apply` is given, so the printed report is exactly what `--apply` would do.
 *
 * Writes use the query builder on purpose: Eloquent saves would fire OrderObserver and
 * send a Facebook conversion for every order touched. A cleanup must never report sales.
 *
 * Limitation of the backfill: status history is not stored, so historical snapshots
 * judge each earlier order by its status *today*. An order confirmed and later cancelled
 * is therefore not counted. This affects only rows written before the snapshot existed.
 */
class MergePhones extends Command
{
    protected $signature = 'customers:merge-phones {--apply : Write the changes. Without it, this is a dry run.}';

    protected $description = 'Canonicalise phone numbers, merge duplicate customers, and backfill re-order flags';

    /** Thrown to roll back a dry run once its report has been collected. */
    private const DRY_RUN_ROLLBACK = 'dry-run';

    public function handle(): int
    {
        $apply = (bool) $this->option('apply');
        $report = [];

        $this->line($apply
            ? '<options=bold;fg=red>APPLYING changes.</>'
            : '<options=bold;fg=yellow>DRY RUN</> — nothing is written. Re-run with --apply to commit.');

        try {
            DB::transaction(function () use (&$report) {
                $report['phones_canonicalised'] = $this->canonicaliseOrders()
                    + $this->canonicaliseBlockedPhones();

                [$report['customers_merged'], $report['customers_touched']] = $this->mergeCustomers();
                $report['risk_profiles_merged'] = $this->mergeRiskProfiles();
                $report['orders_snapshot_changed'] = $this->backfillRepeatSnapshot();

                if (! $this->option('apply')) {
                    throw new \RuntimeException(self::DRY_RUN_ROLLBACK);
                }
            });
        } catch (\RuntimeException $e) {
            if ($e->getMessage() !== self::DRY_RUN_ROLLBACK) {
                throw $e;
            }
        }

        $this->newLine();
        $this->table(['Change', 'Rows'], [
            ['Phone numbers rewritten to canonical form', $report['phones_canonicalised']],
            ['Duplicate customer rows merged away', $report['customers_merged']],
            ['Customers whose stats were refreshed', $report['customers_touched']],
            ['Risk profiles merged away', $report['risk_profiles_merged']],
            ['Orders whose re-order snapshot changed', $report['orders_snapshot_changed']],
        ]);

        if (! $apply) {
            $this->warn('No changes written. Take a database dump before running with --apply.');
        }

        return self::SUCCESS;
    }

    /** Orders keep the phone they were placed with; rewrite it to the canonical form. */
    private function canonicaliseOrders(): int
    {
        $changed = 0;

        DB::table('orders')
            ->whereNotNull('phone')
            ->distinct()
            ->pluck('phone')
            ->each(function (string $raw) use (&$changed) {
                $canonical = Phone::canonical($raw);

                if ($canonical !== $raw) {
                    $changed += DB::table('orders')->where('phone', $raw)->update(['phone' => $canonical]);
                }
            });

        return $changed;
    }

    /**
     * `blocked_phones.phone` is unique. If the canonical form is already blocked, the
     * variant is redundant and removed; otherwise it is rewritten. The block itself is
     * never dropped — a variant that was blocked stays blocked under its canonical form.
     */
    private function canonicaliseBlockedPhones(): int
    {
        $changed = 0;

        DB::table('blocked_phones')->get(['id', 'phone'])->each(function ($row) use (&$changed) {
            $canonical = Phone::canonical($row->phone);

            if ($canonical === $row->phone) {
                return;
            }

            $existing = DB::table('blocked_phones')->where('phone', $canonical)->exists();

            if ($existing) {
                DB::table('blocked_phones')->where('id', $row->id)->delete();
            } else {
                DB::table('blocked_phones')->where('id', $row->id)->update(['phone' => $canonical]);
            }

            $changed++;
        });

        return $changed;
    }

    /**
     * Customers are not unique on phone, so duplicates are common. The oldest row is kept;
     * the rest are removed after their orders are re-pointed to it. A blank name or email
     * on the kept row is filled from a duplicate, never the other way round.
     *
     * @return array{0: int, 1: int} [rows merged away, customers refreshed]
     */
    private function mergeCustomers(): array
    {
        $merged = 0;
        $touched = 0;

        // Group every customer by canonical phone in one pass. Matching a single raw
        // spelling would miss the other spelling's row, which is the very duplicate
        // this exists to remove.
        $groups = DB::table('customers')
            ->whereNotNull('phone')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get(['id', 'phone', 'name', 'email', 'created_at'])
            ->groupBy(fn ($row) => Phone::canonical($row->phone));

        foreach ($groups as $canonical => $rows) {
            $keep = $rows->first();
            $duplicates = $rows->slice(1);

            foreach ($duplicates as $dup) {
                DB::table('orders')->where('customer_id', $dup->id)->update(['customer_id' => $keep->id]);

                $fill = array_filter([
                    'email' => blank($keep->email) ? $dup->email : null,
                    'name' => blank($keep->name) ? $dup->name : null,
                ]);

                if ($fill) {
                    DB::table('customers')->where('id', $keep->id)->update($fill);
                    $keep = (object) array_merge((array) $keep, $fill);
                }

                DB::table('customers')->where('id', $dup->id)->delete();
                $merged++;
            }

            DB::table('customers')->where('id', $keep->id)->update(['phone' => $canonical]);

            // Recount from the orders now attached, not from the stored counters.
            $customer = \App\Models\Customer::find($keep->id);
            $customer?->refreshOrderStats();
            $touched++;
        }

        return [$merged, $touched];
    }

    /**
     * `customer_risk_profiles.phone` is unique, so a variant pair cannot coexist. The
     * canonical row is kept and a whitelist on any variant carries over to it. The
     * profile is then rebuilt from orders, so its counts are right under the new key.
     */
    private function mergeRiskProfiles(): int
    {
        $merged = 0;

        DB::table('customer_risk_profiles')->get(['id', 'phone', 'is_whitelisted'])
            ->groupBy(fn ($row) => Phone::canonical($row->phone))
            ->each(function ($group, string $canonical) use (&$merged) {
                $rows = $group->sortBy(fn ($r) => $r->phone === $canonical ? 0 : 1);
                $keep = $rows->first();

                $whitelisted = $rows->contains(fn ($r) => (bool) $r->is_whitelisted);

                foreach ($rows->slice(1) as $dup) {
                    DB::table('customer_risk_profiles')->where('id', $dup->id)->delete();
                    $merged++;
                }

                DB::table('customer_risk_profiles')->where('id', $keep->id)->update([
                    'phone' => $canonical,
                    'is_whitelisted' => $whitelisted,
                ]);

                CustomerRiskProfile::recomputeFor($canonical);
            });

        return $merged;
    }

    /**
     * Walks every order in the order it was placed and records how many confirmed orders
     * from the same number came before it. Writes only rows whose snapshot is wrong.
     */
    private function backfillRepeatSnapshot(): int
    {
        $confirmed = array_map(fn (OrderStatus $s) => $s->value, [OrderStatus::Confirm, OrderStatus::Delivered]);
        $running = [];
        $changed = 0;

        DB::table('orders')
            ->whereNotNull('phone')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get(['id', 'phone', 'status', 'is_repeat', 'prior_confirmed_orders'])
            ->each(function ($order) use (&$running, &$changed, $confirmed) {
                $canonical = Phone::canonical($order->phone);
                $prior = $running[$canonical] ?? 0;

                $wantRepeat = $prior > 0;

                if ((bool) $order->is_repeat !== $wantRepeat || (int) $order->prior_confirmed_orders !== $prior) {
                    DB::table('orders')->where('id', $order->id)->update([
                        'is_repeat' => $wantRepeat,
                        'prior_confirmed_orders' => $prior,
                    ]);
                    $changed++;
                }

                if (in_array($order->status, $confirmed, true)) {
                    $running[$canonical] = $prior + 1;
                }
            });

        return $changed;
    }
}
