<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    /**
     * Order lines that picked this variant. Lines keep a `variant_label`
     * snapshot as well, so a renamed variant does not rewrite past invoices —
     * this relation is for counting units sold, not for reading history.
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class, 'variant_id');
    }

    public function getFullSkuAttribute(): string
    {
        return $this->product->sku . '-' . $this->sku_suffix;
    }
}
