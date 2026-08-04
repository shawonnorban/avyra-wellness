<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CourierConsignment extends Model
{
    use HasUuids;

    protected $fillable = [
        'order_id', 'courier', 'consignment_id', 'tracking_code', 'invoice',
        'status', 'cod_amount', 'courier_charge', 'weight',
        'recipient_name', 'recipient_phone', 'recipient_address',
        'recipient_city', 'recipient_zone', 'note', 'is_external',
        'delivered_at', 'returned_at', 'last_synced_at',
    ];

    protected $casts = [
        'cod_amount' => 'decimal:2',
        'courier_charge' => 'decimal:2',
        'weight' => 'decimal:2',
        'is_external' => 'boolean',
        'delivered_at' => 'datetime',
        'returned_at' => 'datetime',
        'last_synced_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(CourierStatusLog::class, 'consignment_id');
    }

    public function returns(): HasMany
    {
        return $this->hasMany(CourierReturn::class, 'consignment_id');
    }

    /**
     * Consignments that are still moving and therefore worth polling.
     */
    public function scopeTrackable($query)
    {
        return $query->whereNotIn('status', ['Delivered', 'Returned', 'Cancelled']);
    }
}
