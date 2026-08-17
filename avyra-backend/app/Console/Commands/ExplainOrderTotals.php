<?php

namespace App\Console\Commands;

use App\Models\LandingPage;
use App\Models\Order;
use App\Models\Setting;
use Illuminate\Console\Command;

/**
 * Explains what each recent order was charged for delivery, and why.
 *
 * `CheckoutService::deliveryCharge()` is unconditional — it applies the same
 * rule to every order — so a total that differs between two orders is a
 * difference in *input*, not in logic. There are only three inputs that move it:
 * the delivery zone, a landing page overriding the store-wide charges, and the
 * free-delivery threshold. This lays all three out beside the stored charge so
 * the odd one out is obvious.
 *
 * Read-only.
 */
class ExplainOrderTotals extends Command
{
    protected $signature = 'orders:explain-totals {--orders=15 : How many recent orders to inspect}';

    protected $description = 'Show why each recent order was charged the delivery it was';

    public function handle(): int
    {
        $config = array_merge(
            ['inside_dhaka_charge' => 70, 'outside_dhaka_charge' => 130, 'free_delivery_above' => null],
            Setting::get('delivery', []) ?: [],
        );

        $discountOn = ! empty($config['delivery_discount_enabled']);
        $discount = (float) ($config['delivery_discount'] ?? 0);

        $this->newLine();
        $this->line('<options=bold>Store-wide delivery settings</>');
        $this->line('  inside Dhaka   : ' . $this->money($config['inside_dhaka_charge']));
        $this->line('  outside Dhaka  : ' . $this->money($config['outside_dhaka_charge']));
        $this->line('  discount       : ' . ($discountOn
            ? $this->money($discount) . ' off, whichever zone'
            : '<fg=yellow>switched off</>'));
        $this->line('  free above     : ' . ($config['free_delivery_above'] !== null
            ? $this->money($config['free_delivery_above'])
            : '(no threshold)'));

        if ($discountOn) {
            $inside = max(0.0, (float) $config['inside_dhaka_charge'] - $discount);
            $outside = max(0.0, (float) $config['outside_dhaka_charge'] - $discount);

            $this->newLine();
            $this->line('  A buyer therefore pays <options=bold>' . $this->money($inside) . '</> inside Dhaka and '
                . '<options=bold>' . $this->money($outside) . '</> outside.');

            if ($outside > 0) {
                $this->newLine();
                $this->error('  Delivery is NOT free outside Dhaka.');
                $this->line('  The discount is a flat amount off the charge, not a waiver, so it only');
                $this->line('  covers the whole charge where the charge is no larger than it. To make');
                $this->line('  delivery free everywhere, either raise the discount to '
                    . $this->money((float) $config['outside_dhaka_charge']) . ' or set both');
                $this->line('  zone charges to 0.');
            }
        }

        // Landing pages override the store-wide charges for their own traffic,
        // which is the other way two orders placed minutes apart can differ.
        $overrides = LandingPage::query()
            ->where(fn ($q) => $q->whereNotNull('delivery_charge_inside')->orWhereNotNull('delivery_charge_outside'))
            ->get(['slug', 'title', 'delivery_charge_inside', 'delivery_charge_outside']);

        if ($overrides->isNotEmpty()) {
            $this->newLine();
            $this->line('<options=bold>Landing pages with their own charges</>');
            $this->line('  An order placed through one of these ignores the store-wide figures above.');
            $this->newLine();

            foreach ($overrides as $page) {
                $this->line(sprintf(
                    '  /lp/%-24s inside %s · outside %s',
                    $page->slug,
                    $page->delivery_charge_inside !== null ? $this->money($page->delivery_charge_inside) : '(store)',
                    $page->delivery_charge_outside !== null ? $this->money($page->delivery_charge_outside) : '(store)',
                ));
            }
        }

        $orders = Order::query()
            ->latest('created_at')
            ->limit((int) $this->option('orders'))
            ->get(['order_number', 'order_source', 'delivery_zone', 'subtotal', 'discount', 'delivery_charge', 'total']);

        $this->newLine();
        $this->line('<options=bold>Recent orders</>');
        $this->newLine();

        $this->table(
            ['Order', 'Source', 'Zone', 'Subtotal', 'Coupon', 'Delivery', 'Total'],
            $orders->map(fn (Order $order) => [
                $order->order_number,
                $order->order_source ?? '—',
                // The single most likely reason two totals differ.
                $order->delivery_zone === 'outside_dhaka'
                    ? '<fg=yellow>outside</>'
                    : ($order->delivery_zone === 'inside_dhaka' ? 'inside' : '—'),
                $this->money($order->subtotal),
                (float) $order->discount > 0 ? $this->money($order->discount) : '—',
                (float) $order->delivery_charge > 0
                    ? '<fg=yellow>' . $this->money($order->delivery_charge) . '</>'
                    : 'free',
                $this->money($order->total),
            ])->all(),
        );

        $this->line('  A yellow Delivery is an order that paid for it. Check its Zone first:');
        $this->line('  outside Dhaka costs more, so the same flat discount leaves a remainder.');
        $this->newLine();

        return self::SUCCESS;
    }

    private function money(float|string|null $amount): string
    {
        return 'Tk ' . number_format((float) $amount, 0);
    }
}
