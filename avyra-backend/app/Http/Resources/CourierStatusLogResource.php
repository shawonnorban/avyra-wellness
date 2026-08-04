<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourierStatusLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'raw_status' => $this->raw_status,
            'source' => $this->source,
            'note' => $this->note,
            'logged_at' => $this->logged_at?->toIso8601String(),
        ];
    }
}
