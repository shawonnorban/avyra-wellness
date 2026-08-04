<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderRiskScore extends Model
{
    use HasUuids;

    protected $fillable = [
        'order_id', 'phone', 'ip_address', 'device_fingerprint',
        'risk_score', 'risk_level', 'signals', 'action_taken',
        'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        'signals' => 'array',
        'reviewed_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function scopeBlocked($query)
    {
        return $query->where('action_taken', 'blocked');
    }
}
