<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use HasUuids;

    const UPDATED_AT = null;

    protected $fillable = [
        'order_id', 'product_id', 'variant_id', 'product_name', 'variant_label',
        'quantity', 'unit_price',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
    ];

    // Mirrors the generated "total_price" column from the old schema
    protected $appends = ['total_price'];

    public function getTotalPriceAttribute(): float
    {
        return round($this->quantity * $this->unit_price, 2);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }
}
