<?php

namespace App\Http\Resources;

use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Product payload for the storefront. Stock quantities are deliberately not exposed —
 * only the derived availability flag — so competitors cannot read inventory levels.
 */
class ProductResource extends JsonResource
{
    public function __construct($resource, private readonly bool $detailed = false)
    {
        parent::__construct($resource);
    }

    public static function detailed($resource): self
    {
        return new self($resource, true);
    }

    public function toArray(Request $request): array
    {
        $base = [
            'id' => $this->id,
            'sku' => $this->sku,
            'slug' => $this->slug,
            'name' => $this->name,
            'tagline' => $this->tagline,
            'product_label' => $this->product_label,
            'category' => $this->category,
            'short_description' => $this->short_description,
            // Stored as disk paths; the public URL is derived on the way out.
            'images' => Media::urls($this->images),
            'price' => (float) $this->sell_price,
            'in_stock' => $this->quantity > 0,
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
        ];

        if (! $this->detailed) {
            return $base;
        }

        return $base + [
            'facility_label' => $this->facility_label,
            'description' => $this->description,
            'long_description' => $this->long_description,
            'gallery_images' => Media::urls($this->gallery_images),
            'pack_options' => $this->pack_options ?? [],
            'ingredients' => $this->ingredients ?? [],
            'nutrition' => $this->nutrition ?? [],
            'benefits_section' => $this->benefits_section,
            'trust_section' => $this->trust_section,
            'suitability' => $this->suitability,
            'certificates' => Media::urls($this->certificates),
            'faqs' => $this->faqs ?? [],
            'delivery_info' => $this->delivery_info,
            'terms_conditions' => $this->terms_conditions,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
        ];
    }
}
