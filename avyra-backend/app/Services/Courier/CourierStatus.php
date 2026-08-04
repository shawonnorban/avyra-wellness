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
            // A parcel that comes back or is called off leaves the order
            // cancelled. The distinction between the two is not lost — it stays
            // on the consignment, which is also what drives stock restoration.
            self::RETURNED, self::CANCELLED => OrderStatus::Cancel,
            // In flight. The order stays `confirm`; where the parcel actually is
            // belongs to the consignment, not the order.
            self::PICKED, self::IN_TRANSIT => null,
            default => null,
        };
    }
}
