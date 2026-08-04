<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariant extends Model
{
    use HasUuids;

    protected $fillable = [
        'product_id', 'size', 'color', 'sku_suffix', 'image_path', 'quantity',
        'compare_at_price',
        'cost_price', 'sell_price', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'cost_price' => 'decimal:2',
        'compare_at_price' => 'decimal:2',
        'sell_price' => 'decimal:2',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function getFullSkuAttribute(): string
    {
        return $this->product->sku . '-' . $this->sku_suffix;
    }
}
