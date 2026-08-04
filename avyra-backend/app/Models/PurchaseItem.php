<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'purchase_id', 'product_id', 'variant_id', 'product_name',
        'quantity', 'received_qty', 'rejected_qty', 'unit',
        'unit_price', 'total_cost', 'batch_number',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'received_qty' => 'decimal:2',
        'rejected_qty' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'total_cost' => 'decimal:2',
    ];

    /** Quantity still outstanding on this line. */
    public function pendingQty(): float
    {
        return max(0, (float) $this->quantity - (float) $this->received_qty - (float) $this->rejected_qty);
    }

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
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
