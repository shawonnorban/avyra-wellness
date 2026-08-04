<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourierReturn extends Model
{
    use HasUuids;

    protected $fillable = [
        'consignment_id', 'order_id', 'return_date', 'return_reason',
        'stock_restored', 'notes',
    ];

    protected $casts = [
        'return_date' => 'date',
        'stock_restored' => 'boolean',
    ];

    public function consignment(): BelongsTo
    {
        return $this->belongsTo(CourierConsignment::class, 'consignment_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
