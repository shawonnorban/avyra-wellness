<?php

namespace App\Services\Facebook;

use App\Models\Order;

/**
 * Guards against sending the same conversion twice, per pixel.
 *
 * An order routinely revisits a status — a courier sync re-applying `confirm`,
 * an admin correcting a mistake, a retry after a timeout. Facebook's own
 * `event_id` deduplication is a second net, but it only spans 48 hours, so the
 * durable flag lives on the order.
 *
 * The flag is keyed by pixel because a send can succeed for one destination and
 * fail for another. A single shared flag would mark the whole conversion done
 * the moment the first pixel accepted it, and the second would lose that sale
 * for good.
 *
 * The flag is written *after* Facebook accepts the call, never before, so a
 * failure leaves the event still owed rather than silently swallowed.
 */
class FacebookEventDeduper
{
    public function shouldSend(Order $order, string $key, string $pixelId): bool
    {
        $sent = $order->fb_events_sent[$key] ?? null;

        // Rows written when there was one destination stored a bare `true`.
        // Those count as done for every pixel: the alternative is replaying
        // months of history into a newly added one, which Facebook rejects past
        // seven days and which would restamp old sales with today's date if it
        // did not. A new pixel starts from the orders that come after it.
        if ($sent === true) {
            return false;
        }

        return empty($sent[$pixelId]);
    }

    public function markSent(Order $order, string $key, string $pixelId): void
    {
        $sent = $order->fb_events_sent ?? [];
        $forKey = $sent[$key] ?? [];

        // Legacy `true` widens into the per-pixel map rather than being kept, so
        // the shape converges as orders are touched.
        $sent[$key] = is_array($forKey)
            ? $forKey + [$pixelId => true]
            : [$pixelId => true];

        // Written straight to the column rather than through a full save, so a
        // stale in-memory copy of the order elsewhere cannot clobber it.
        $order->forceFill(['fb_events_sent' => $sent])->saveQuietly();
    }
}
