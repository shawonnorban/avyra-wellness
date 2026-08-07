<?php

namespace App\Models;

use App\Support\Clock;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Purchase extends Model
{
    use HasUuids;

    protected $fillable = [
        'purchase_number', 'supplier_id', 'supplier_name', 'warehouse_id', 'status',
        'order_date', 'expected_delivery', 'received_date', 'items_count',
        'subtotal', 'shipping_cost', 'other_cost', 'total', 'paid_amount',
        'notes', 'created_by',
    ];

    protected $casts = [
        'order_date' => 'date',
        'expected_delivery' => 'date',
        'received_date' => 'date',
        'subtotal' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'other_cost' => 'decimal:2',
        'total' => 'decimal:2',
        'paid_amount' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::creating(function (Purchase $purchase) {
            $purchase->purchase_number ??= static::nextPurchaseNumber();
            $purchase->order_date ??= Clock::today();
        });
    }

    /** Yearly sequence, e.g. PO-2026-0001. */
    public static function nextPurchaseNumber(): string
    {
        $prefix = 'PO-' . Clock::now()->format('Y');

        $last = static::where('purchase_number', 'like', $prefix . '-%')
            ->orderByDesc('purchase_number')
            ->value('purchase_number');

        return sprintf('%s-%04d', $prefix, $last ? ((int) substr($last, -4)) + 1 : 1);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SupplierPayment::class);
    }
}
