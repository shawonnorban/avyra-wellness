<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourierConsignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'courier' => $this->courier,
            'consignment_id' => $this->consignment_id,
            'tracking_code' => $this->tracking_code,
            'invoice' => $this->invoice,
            'status' => $this->status,
            'cod_amount' => (float) $this->cod_amount,
            'courier_charge' => (float) $this->courier_charge,
            'recipient' => [
                'name' => $this->recipient_name,
                'phone' => $this->recipient_phone,
                'address' => $this->recipient_address,
            ],
            'delivered_at' => $this->delivered_at?->toIso8601String(),
            'returned_at' => $this->returned_at?->toIso8601String(),
            'last_synced_at' => $this->last_synced_at?->toIso8601String(),
            'status_logs' => CourierStatusLogResource::collection($this->whenLoaded('statusLogs')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
