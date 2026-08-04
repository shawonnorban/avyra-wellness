<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    use HasUuids;

    protected $fillable = [
        'code', 'discount_type', 'discount_value', 'min_order_total', 'max_discount',
        'max_usage', 'current_usage', 'starts_at', 'expires_at', 'is_active',
    ];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'min_order_total' => 'decimal:2',
        'max_discount' => 'decimal:2',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function isRedeemable(float $orderTotal): bool
    {
        return $this->is_active
            && $orderTotal >= (float) $this->min_order_total
            && (is_null($this->starts_at) || $this->starts_at->isPast())
            && (is_null($this->expires_at) || $this->expires_at->isFuture())
            && (is_null($this->max_usage) || $this->current_usage < $this->max_usage);
    }

    /**
     * Discount in taka for the given subtotal. Never exceeds the subtotal itself.
     */
    public function discountFor(float $orderTotal): float
    {
        $discount = $this->discount_type === 'percent'
            ? $orderTotal * ((float) $this->discount_value / 100)
            : (float) $this->discount_value;

        if ($this->max_discount !== null) {
            $discount = min($discount, (float) $this->max_discount);
        }

        return round(min($discount, $orderTotal), 2);
    }
}
