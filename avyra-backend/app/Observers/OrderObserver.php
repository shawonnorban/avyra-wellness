<?php

namespace App\Observers;

use App\Models\Order;
use App\Services\Facebook\FacebookCapiService;
use App\Services\Facebook\FacebookEventMap;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * The one place Facebook conversions are triggered.
 *
 * The spec asks for a single trigger point, and there is more than one way an
 * order's status changes: the admin panel, the Steadfast webhook, and the
 * `courier:sync` command. Hooking the admin controller would have missed the
 * other two and hooking all three would have risked double sends, so the model
 * itself is the hook — every path goes through it exactly once.
 *
 * Tracking never affects the write that triggered it: everything here is
 * wrapped so a Facebook outage cannot fail an order update.
 */
class OrderObserver
{
    public function __construct(private readonly FacebookCapiService $facebook)
    {
    }

    public function created(Order $order): void
    {
        // A checkout lands as `pending`, which is a Lead. An order an admin
        // creates already `confirm` is a Purchase — keyFor() covers both.
        $this->dispatchFor($order);
    }

    public function updated(Order $order): void
    {
        if (! $order->wasChanged('status')) {
            return;
        }

        $this->dispatchFor($order);
    }

    private function dispatchFor(Order $order): void
    {
        $key = FacebookEventMap::keyFor($order->status);

        // hold, fake and cancel deliberately send nothing — they are internal
        // judgements, not conversions. delivered does send, as DeliveredPurchase.
        if ($key === null) {
            return;
        }

        try {
            $this->facebook->sendForOrder($order, $key);
        } catch (Throwable $e) {
            Log::error('[FB CAPI] tracking failed; the order change still stands', [
                'order' => $order->order_number,
                'message' => $e->getMessage(),
            ]);
        }
    }
}
