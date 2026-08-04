<?php

namespace App\Services\Facebook;

use App\Models\Order;

/**
 * Guards against sending the same conversion twice.
 *
 * An order routinely revisits a status — a courier sync re-applying `confirm`,
 * an admin correcting a mistake, a retry after a timeout. Facebook's own
 * `event_id` deduplication is a second net, but it only spans a short window,
 * so the durable flag lives on the order.
 *
 * The flag is written *after* Facebook accepts the call, never before, so a
 * failure leaves the event still owed rather than silently swallowed.
 */
class FacebookEventDeduper
{
    public function shouldSend(Order $order, string $key): bool
    {
        return empty($order->fb_events_sent[$key]);
    }

    public function markSent(Order $order, string $key): void
    {
        $sent = $order->fb_events_sent ?? [];
        $sent[$key] = true;

        // Written straight to the column rather than through a full save, so a
        // stale in-memory copy of the order elsewhere cannot clobber it.
        $order->forceFill(['fb_events_sent' => $sent])->saveQuietly();
    }
}
