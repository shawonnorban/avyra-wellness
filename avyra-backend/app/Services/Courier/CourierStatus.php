<?php

namespace App\Services\Courier;

use App\Enums\OrderStatus;

/**
 * Maps the courier's own status vocabulary onto the states we track.
 *
 * This is where shipping detail lives. `OrderStatus` was reduced to six
 * business states, so an order no longer records "In Courier" or "Shipped" —
 * the consignment does, at full fidelity, and only settlement (delivered or
 * cancelled) is reflected back onto the order.
 */
final class CourierStatus
{
    public const PENDING = 'Pending';
    public const PICKED = 'Picked';
    public const IN_TRANSIT = 'In Transit';
    public const DELIVERED = 'Delivered';
    public const RETURNED = 'Returned';
    public const CANCELLED = 'Cancelled';

    public static function fromSteadfast(?string $raw): string
    {
        return match (strtolower(trim((string) $raw))) {
            'delivered', 'partial_delivered' => self::DELIVERED,
            'cancelled', 'cancelled_approval_pending' => self::CANCELLED,
            'returned', 'delivery_failed', 'unknown_return' => self::RETURNED,
            'in_review', 'pending' => self::PENDING,
            'hold' => self::IN_TRANSIT,
            default => self::IN_TRANSIT,
        };
    }

    /**
     * The order status a courier update should drive, or null to leave it alone.
     */
    public static function toOrderStatus(string $courierStatus): ?OrderStatus
    {
        return match ($courierStatus) {
            self::DELIVERED => OrderStatus::Delivered,
            // A parcel that came back settles the order as `return`, not
            // `cancel`: the goods went out and came home, which is a different
            // outcome from an order called off before it shipped, and the shop
            // reports on the two separately. It also keeps this status and the
            // `courier_returns` row telling the same story about one parcel.
            self::RETURNED => OrderStatus::Return,
            self::CANCELLED => OrderStatus::Cancel,
            // In flight. The order stays `confirm`; where the parcel actually is
            // belongs to the consignment, not the order.
            self::PICKED, self::IN_TRANSIT => null,
            default => null,
        };
    }
}
