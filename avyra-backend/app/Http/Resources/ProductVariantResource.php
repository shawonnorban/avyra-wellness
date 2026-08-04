<?php

namespace App\Http\Resources;

use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'size' => $this->size,
            'color' => $this->color,
            'sku_suffix' => $this->sku_suffix,
            'image' => Media::url($this->image_path),
            'price' => (float) $this->sell_price,
            // Display-only "was" price; null when there is no saving to show.
            'compare_at_price' => $this->compare_at_price !== null ? (float) $this->compare_at_price : null,
            'in_stock' => $this->quantity > 0,
        ];
    }
}
