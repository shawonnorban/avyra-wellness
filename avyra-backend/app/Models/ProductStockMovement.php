<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductStockMovement extends Model
{
    use HasUuids;

    const UPDATED_AT = null; // ledger table, no updates after creation

    protected $fillable = [
        'product_id', 'product_name', 'change_qty', 'movement_type',
        'reference_type', 'reference_id', 'warehouse_id', 'warehouse_name',
        'batch_number', 'unit_cost_at_time', 'notes', 'changed_by',
    ];

    protected $casts = [
        'change_qty' => 'decimal:2',
        'unit_cost_at_time' => 'decimal:2',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
