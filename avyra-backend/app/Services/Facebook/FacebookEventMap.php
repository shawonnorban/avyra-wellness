<?php

namespace App\Services\Facebook;

use App\Enums\OrderStatus;

/**
 * The single source of truth for which order status produces which Meta event.
 *
 * The funnel is shifted one stage earlier than Meta's own naming, to suit cash on
 * delivery: a submitted order is a `Lead`, and `Purchase` fires when an admin
 * confirms it on the phone rather than when the parcel arrives. That reports
 * money for orders that may still fail to deliver, in exchange for a signal the
 * algorithm gets in hours instead of days. `DeliveredPurchase` closes the loop
 * once the money is actually collected.
 *
 * `hold`, `fake` and `cancel` send **nothing**. They are internal judgements, not
 * conversions; a cancelled order that had already reported a `Purchase` is not
 * retracted here either — that needs Meta's value-adjustment API, which is out
 * of scope. Those orders are still tagged in the database and appear in the
 * customer segments.
 *
 * Two more events exist that no order status produces, because they happen
 * before an order does — `ViewContent` and `InitiateCheckout` are browser-only,
 * fired through GTM.
 *
 * The array keys double as the dedup keys stored in `orders.fb_events_sent` and
 * as the keys of `orders.fb_event_ids`.
 */
final class FacebookEventMap
{
    public const LEAD = 'lead';
    public const PURCHASE = 'purchase';
    public const DELIVERED_PURCHASE = 'deliveredPurchase';

    /** dedup key => Meta event name */
    public const EVENT_NAMES = [
        self::LEAD => 'Lead',
        self::PURCHASE => 'Purchase',
        // Custom, not a Meta standard event: it needs a Custom Conversion in Ads
        // Manager before it can drive optimisation.
        self::DELIVERED_PURCHASE => 'DeliveredPurchase',
    ];

    /**
     * The dedup key a status should fire, or null when the status is internal.
     */
    public static function keyFor(OrderStatus $status): ?string
    {
        return match ($status) {
            OrderStatus::Pending => self::LEAD,
            OrderStatus::Confirm => self::PURCHASE,
            OrderStatus::Delivered => self::DELIVERED_PURCHASE,
            OrderStatus::Hold, OrderStatus::Fake, OrderStatus::Cancel => null,
        };
    }

    /**
     * Which events report money.
     *
     * `Lead` deliberately does not: the same order would otherwise be counted at
     * two stages and inflate reported revenue.
     */
    /**
     * Every event reports the order total.
     *
     * Lead used to be excluded, on the reasoning that money belongs only to the
     * events that settle it. The shop asked for it: with delivery discounted to
     * nothing, the Lead value *is* the variant's sell price, and a media buyer
     * optimising on Lead needs a number to optimise against.
     *
     * The cost is that the same order's money appears at two funnel stages, so
     * Lead value and Purchase value must never be added together — they are the
     * same taka reported twice, once on submission and once on confirmation.
     */
    public static function carriesValue(string $key): bool
    {
        return in_array($key, [self::LEAD, self::PURCHASE, self::DELIVERED_PURCHASE], true);
    }
}
