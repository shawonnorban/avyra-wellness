<?php

namespace App\Http\Resources;

use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Full order payload for the admin. Never return this from a public endpoint —
 * it carries the customer's address, phone and attribution data.
 */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status->value,
            'status_reason' => $this->status_reason,
            // Full timestamp so the list can show the time under the date.
            'order_date' => $this->order_date?->toIso8601String(),
            'order_source' => $this->order_source,
            'branch' => $this->branch,
            // First product image, for the thumbnail in the orders table.
            'thumbnail' => Media::url($this->whenLoaded('items', fn () => $this->items->first()?->product?->images[0] ?? null)),

            'customer' => [
                'id' => $this->customer_id,
                'name' => $this->customer_name,
                'phone' => $this->phone,
                'address' => $this->address,
            ],

            'items_count' => $this->items_count,
            'subtotal' => (float) $this->subtotal,
            'discount' => (float) $this->discount,
            'delivery_charge' => (float) $this->delivery_charge,
            'delivery_zone' => $this->delivery_zone,
            'coupon_code' => $this->coupon_code,
            'total' => (float) $this->total,

            'payment' => [
                'method' => $this->payment_method,
                'sender_number' => $this->payment_sender_number,
                'txn_ref' => $this->payment_txn_ref,
            ],

            'notes' => $this->notes,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'consignments' => CourierConsignmentResource::collection($this->whenLoaded('consignments')),

            'attribution' => $this->when($request->user()?->hasRole(\App\Enums\Role::Manager), fn () => [
                'utm_source' => $this->utm_source,
                'utm_medium' => $this->utm_medium,
                'utm_campaign' => $this->utm_campaign,
                'landing_url' => $this->landing_url,
                'referrer' => $this->referrer,
                'ip_address' => $this->ip_address,
                'device_fingerprint' => $this->device_fingerprint,
            ]),

            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
