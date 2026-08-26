<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Order;
use Illuminate\Database\Eloquent\Builder;

/**
 * The customer lists used to seed Meta Lookalike Audiences.
 *
 * Derived from orders rather than kept in their own table: a stored list drifts
 * the moment a status changes or a return comes back, and there is nothing here
 * a query cannot answer. The cost is a scan per export, which for a list pulled
 * a few times a month is not worth denormalising.
 *
 * Keyed on phone, because that is what Meta matches on for this market and what
 * every order carries — a guest checkout has no account.
 */
class CustomerSegmentService
{
    /** Segment key => human label, in the order the brief lists them. */
    public const SEGMENTS = [
        'delivered' => 'Delivered customers',
        'repeat' => 'Repeat customers',
        'confirmed_not_delivered' => 'Confirmed, not yet delivered',
        'cancelled' => 'Cancelled customers',
        'returned' => 'Returned customers',
        'fake' => 'Invalid / fake submissions',
    ];

    /**
     * A customer counts as repeat at this many delivered orders. Delivered
     * rather than placed: two orders that both failed to deliver is not the
     * signal a Lookalike should be built on.
     */
    private const REPEAT_THRESHOLD = 2;

    public function query(string $segment): Builder
    {
        $base = Order::query()->whereNotNull('phone');

        return match ($segment) {
            'delivered' => $base->where('status', OrderStatus::Delivered),

            'repeat' => $base->where('status', OrderStatus::Delivered)
                ->whereIn('phone', function ($q) {
                    $q->from('orders')
                        ->select('phone')
                        ->where('status', OrderStatus::Delivered->value)
                        ->whereNotNull('phone')
                        ->groupBy('phone')
                        ->havingRaw('COUNT(*) >= ?', [self::REPEAT_THRESHOLD]);
                }),

            'confirmed_not_delivered' => $base->where('status', OrderStatus::Confirm),
            'cancelled' => $base->where('status', OrderStatus::Cancel),
            'fake' => $base->where('status', OrderStatus::Fake),

            // Both records of the same thing. A courier return writes a
            // `courier_returns` row *and* settles the order as `return`, so
            // either alone would usually do — but goods brought back to the
            // counter have no consignment, and a parcel returned before the
            // order status was reflected has no `return` on the order yet.
            'returned' => $base->where(fn ($q) => $q
                ->where('status', OrderStatus::Return->value)
                ->orWhereIn('id', fn ($sub) => $sub->from('courier_returns')
                    ->select('order_id')
                    ->whereNotNull('order_id'))),

            default => $base->whereRaw('1 = 0'),
        };
    }

    /**
     * One row per customer, newest order first.
     *
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    public function rows(string $segment)
    {
        return $this->query($segment)
            ->selectRaw('phone, MAX(customer_name) as name, COUNT(*) as orders, SUM(total) as value, MAX(order_date) as last_order')
            ->groupBy('phone')
            ->orderByDesc('last_order')
            ->get()
            ->map(fn ($row) => [
                'phone' => $row->phone,
                'name' => $row->name,
                'orders' => (int) $row->orders,
                'value' => (float) $row->value,
                'last_order' => $row->last_order,
            ]);
    }

    /** @return array<string, int> */
    public function counts(): array
    {
        $counts = [];

        foreach (array_keys(self::SEGMENTS) as $segment) {
            $counts[$segment] = $this->query($segment)->distinct('phone')->count('phone');
        }

        return $counts;
    }
}
