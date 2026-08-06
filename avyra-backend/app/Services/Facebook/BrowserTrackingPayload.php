<?php

namespace App\Services\Facebook;

use App\Models\Order;

/**
 * Builds what the browser pushes onto the GTM dataLayer.
 *
 * The browser and the server each send their own copy of a conversion, and Meta
 * only collapses the two when the `event_id` and `event_name` match exactly.
 * Since the browser tag is configured inside GTM by a media buyer, the id cannot
 * be a formula both sides are trusted to reproduce — the server generates it,
 * stores it on the order, and hands it over here.
 *
 * Only `Lead` is produced: `Purchase` and `DeliveredPurchase` fire hours later
 * when an admin changes a status, with no browser in the picture, so those are
 * server-only by nature.
 */
class BrowserTrackingPayload
{
    public function __construct(private readonly FacebookCapiService $capi) {}

    /** @return array<string, mixed> */
    public function leadPayload(Order $order): array
    {
        $items = $order->relationLoaded('items') ? $order->items : $order->items()->get();

        return [
            'event_name' => FacebookEventMap::EVENT_NAMES[FacebookEventMap::LEAD],
            'event_id' => $this->capi->eventIdFor($order, FacebookEventMap::LEAD),
            'order_id' => $order->order_number,
            'currency' => config('services.facebook.currency', 'BDT'),
            // No `value`: only the money events report one, and the browser copy
            // must not claim revenue the server copy does not.
            'content_type' => 'product',
            'content_ids' => $items->pluck('product_id')->filter()->values()->all(),
            'content_name' => $items->pluck('product_name')->filter()->join(', '),
            'num_items' => (int) $items->sum('quantity'),
        ];
    }
}
