<?php

namespace App\Services\Facebook;

use App\Enums\OrderStatus;

/**
 * The single source of truth for which order status produces which Facebook
 * event. Three statuses do; the other three are internal flags and must send
 * nothing at all — an order marked `hold`, `fake` or `cancel` has not converted.
 *
 * The array keys double as the dedup keys stored in `orders.fb_events_sent`.
 */
final class FacebookEventMap
{
    public const INITIATE_CHECKOUT = 'initiateCheckout';
    public const LEAD = 'lead';
    public const PURCHASE = 'purchase';

    /** dedup key => Facebook standard event name */
    public const EVENT_NAMES = [
        self::INITIATE_CHECKOUT => 'InitiateCheckout',
        self::LEAD => 'Lead',
        self::PURCHASE => 'Purchase',
    ];

    /**
     * The dedup key a status should fire, or null when the status is internal.
     */
    public static function keyFor(OrderStatus $status): ?string
    {
        return match ($status) {
            OrderStatus::Pending => self::INITIATE_CHECKOUT,
            OrderStatus::Confirm => self::LEAD,
            OrderStatus::Delivered => self::PURCHASE,
            OrderStatus::Hold, OrderStatus::Fake, OrderStatus::Cancel => null,
        };
    }

    /** Only Purchase carries the order value; the others are signals. */
    public static function carriesValue(string $key): bool
    {
        return $key === self::PURCHASE;
    }
}
