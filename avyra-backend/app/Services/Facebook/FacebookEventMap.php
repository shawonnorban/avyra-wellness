<?php

namespace App\Services\Facebook;

use App\Enums\OrderStatus;

/**
 * The single source of truth for which order status produces which Facebook
 * event. Three statuses do; the other three send nothing at all.
 *
 * The mapping sits one stage earlier than Facebook's own funnel naming, to suit
 * cash on delivery: a submitted order is a `Lead`, and the `Purchase` fires when
 * an admin confirms it on the phone rather than when the parcel arrives. That
 * trades accuracy for speed — money is reported for orders that may still fail
 * to deliver — in exchange for a signal the algorithm gets in hours, not days.
 *
 * `Cancel` is **not** a Facebook standard event; it goes as a custom event. It
 * will not sit alongside the standard events in Events Manager and cannot drive
 * standard-event optimisation until a Custom Conversion is built on it. Nor
 * does it retract the `Purchase` already sent at `confirm`: that needs Meta's
 * value-adjustment API, which stays out of scope.
 *
 * The array keys double as the dedup keys stored in `orders.fb_events_sent`.
 */
final class FacebookEventMap
{
    public const LEAD = 'lead';
    public const PURCHASE = 'purchase';
    public const CANCEL = 'cancel';

    /** dedup key => Facebook event name */
    public const EVENT_NAMES = [
        self::LEAD => 'Lead',
        self::PURCHASE => 'Purchase',
        self::CANCEL => 'Cancel',
    ];

    /**
     * The dedup key a status should fire, or null when the status is internal.
     *
     * `delivered` sends nothing: the Purchase already went at `confirm`, and a
     * second one would count the same order's money twice.
     */
    public static function keyFor(OrderStatus $status): ?string
    {
        return match ($status) {
            OrderStatus::Pending => self::LEAD,
            OrderStatus::Confirm => self::PURCHASE,
            OrderStatus::Cancel => self::CANCEL,
            OrderStatus::Hold, OrderStatus::Fake, OrderStatus::Delivered => null,
        };
    }

    /** Only Purchase reports money; Lead and Cancel are signals. */
    public static function carriesValue(string $key): bool
    {
        return $key === self::PURCHASE;
    }
}
