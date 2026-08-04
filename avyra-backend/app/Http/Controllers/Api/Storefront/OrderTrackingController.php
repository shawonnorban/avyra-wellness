<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderTrackingController extends Controller
{
    /**
     * Public order lookup. Requires the order number *and* the phone it was placed
     * with, so knowing a sequential order number alone reveals nothing. The response
     * is deliberately minimal — no address, no attribution, no internal ids.
     */
    public function show(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_number' => ['required', 'string', 'max:64'],
            'phone' => ['required', 'string', 'max:32'],
        ]);

        $order = Order::with(['items', 'consignments'])
            ->where('order_number', $validated['order_number'])
            ->where('phone', preg_replace('/\D/', '', $validated['phone']))
            ->first();

        if (! $order) {
            return response()->json([
                'message' => 'No order found for that order number and phone number.',
            ], 404);
        }

        return response()->json([
            'data' => [
                'order_number' => $order->order_number,
                'status' => $order->status->value,
                'timeline' => $this->timeline($order),
                'order_date' => $order->order_date?->toDateString(),
                'total' => (float) $order->total,
                'delivery_charge' => (float) $order->delivery_charge,
                'items' => $order->items->map(fn ($item) => [
                    'product_name' => $item->product_name,
                    'variant_label' => $item->variant_label,
                    'quantity' => $item->quantity,
                    'unit_price' => (float) $item->unit_price,
                ]),
            ],
        ]);
    }

    /**
     * The four steps a customer sees.
     *
     * "Shipped" is not an order status any more — it is read from the
     * consignment, which is where dispatch detail now lives. Without one, a
     * confirmed order simply has not shipped yet.
     */
    private function timeline(Order $order): array
    {
        $shipped = $order->consignments->isNotEmpty();

        $reached = match ($order->status) {
            OrderStatus::Pending, OrderStatus::Fake => 1,
            OrderStatus::Hold, OrderStatus::Confirm => $shipped ? 3 : 2,
            OrderStatus::Delivered => 4,
            OrderStatus::Cancel => 0,
        };

        $steps = ['Received', 'Confirmed', 'Shipped', 'Delivered'];

        return [
            'cancelled' => $reached === 0,
            'steps' => collect($steps)->map(fn ($label, $i) => [
                'label' => $label,
                'done' => $reached > $i,
            ])->all(),
        ];
    }
}
