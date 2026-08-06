<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasUuids;

    protected $fillable = [
        'order_number', 'customer_id', 'customer_name', 'phone', 'address',
        'items_count', 'subtotal', 'discount', 'delivery_charge', 'coupon_code',
        'delivery_zone', 'total', 'status', 'status_reason', 'order_date',
        'order_source', 'branch', 'warehouse_id', 'payment_method',
        'payment_sender_number', 'payment_txn_ref', 'notes',
        'fbclid', 'fbc', 'fbp', 'utm_source', 'utm_medium', 'utm_campaign',
        'utm_term', 'utm_content', 'utm_id', 'landing_url', 'referrer',
        'ip_address', 'user_agent', 'device_fingerprint', 'lazychat_order_id',
        'created_by', 'fb_events_sent', 'fb_event_ids',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'delivery_charge' => 'decimal:2',
        'total' => 'decimal:2',
        'order_date' => 'date',
        'status' => OrderStatus::class,
        'fb_events_sent' => 'array',
        'fb_event_ids' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (Order $order) {
            $order->order_number ??= static::nextOrderNumber();
            $order->order_date ??= now()->toDateString();
        });
    }

    /**
     * Sequential per day: AVY-20260728-0001. Readable on an invoice and, unlike a
     * random id, tells staff at a glance when the order came in.
     */
    public static function nextOrderNumber(): string
    {
        $prefix = 'AVY-' . now()->format('Ymd');

        $last = static::withoutGlobalScopes()
            ->where('order_number', 'like', $prefix . '-%')
            ->orderByDesc('order_number')
            ->value('order_number');

        $sequence = $last ? ((int) substr($last, -4)) + 1 : 1;

        return sprintf('%s-%04d', $prefix, $sequence);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function consignments(): HasMany
    {
        return $this->hasMany(CourierConsignment::class);
    }

    public function riskScores(): HasMany
    {
        return $this->hasMany(OrderRiskScore::class);
    }

    public function isStatus(OrderStatus $status): bool
    {
        return $this->status === $status;
    }

    public function scopeStatus($query, OrderStatus|string $status)
    {
        return $query->where('status', $status instanceof OrderStatus ? $status->value : $status);
    }
}
