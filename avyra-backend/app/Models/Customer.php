<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasUuids;

    protected $fillable = [
        'code', 'name', 'type', 'phone', 'email', 'address',
        'total_orders', 'total_spent', 'last_order_date',
    ];

    protected $casts = [
        'total_spent' => 'decimal:2',
        'last_order_date' => 'date',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    // Call after an order is placed/paid to keep aggregate stats in sync
    public function refreshOrderStats(): void
    {
        $this->update([
            'total_orders' => $this->orders()->count(),
            // Only money actually collected. Cash on delivery means an order
            // counts once it is delivered, not when it is placed.
            'total_spent' => $this->orders()
                ->where('status', OrderStatus::Delivered->value)
                ->sum('total'),
            'last_order_date' => $this->orders()->latest('order_date')->value('order_date'),
        ]);
    }
}
