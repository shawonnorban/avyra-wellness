<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CustomerRiskProfile extends Model
{
    use HasUuids;

    protected $fillable = [
        'phone', 'total_orders', 'delivered', 'failed',
        'failure_rate', 'risk_flag', 'is_whitelisted',
    ];

    protected $casts = [
        'failure_rate' => 'decimal:2',
        'is_whitelisted' => 'boolean',
    ];

    /**
     * Recomputes the profile from the order history for this phone number.
     * Called when an order reaches a terminal status.
     */
    public static function recomputeFor(string $phone): self
    {
        $statuses = Order::where('phone', $phone)
            ->pluck('status')
            ->map(fn ($s) => $s instanceof OrderStatus ? $s : OrderStatus::tryFrom((string) $s))
            ->filter();

        $total = $statuses->count();
        $delivered = $statuses->filter(fn (OrderStatus $s) => $s->isSuccessful())->count();
        $failed = $statuses->filter(fn (OrderStatus $s) => $s->isFailed())->count();
        $settled = $delivered + $failed;
        $failureRate = $settled > 0 ? round($failed / $settled * 100, 2) : 0.0;

        $profile = static::firstOrNew(['phone' => $phone]);

        // Only flag once there is enough history for the rate to mean anything.
        $profile->fill([
            'total_orders' => $total,
            'delivered' => $delivered,
            'failed' => $failed,
            'failure_rate' => $failureRate,
            'risk_flag' => match (true) {
                $settled < 3 => 'Low',
                $failureRate >= 60 => 'High',
                $failureRate >= 30 => 'Medium',
                default => 'Low',
            },
        ])->save();

        return $profile;
    }
}
