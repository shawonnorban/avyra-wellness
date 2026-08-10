<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A Conversions API call that did not get through.
 *
 * Without this a network blip loses a conversion permanently: the order moves
 * on, the dedup flag is never set, and nothing remembers that anything was
 * owed. The stored payload is what `fb:retry-events` replays.
 */
class FbEventLog extends Model
{
    use HasUuids;

    public const STATUS_FAILED = 'failed';
    public const STATUS_SUCCESS = 'success';

    /** Give up after this many tries rather than retrying a permanent error forever. */
    public const MAX_ATTEMPTS = 5;

    protected $fillable = [
        'order_id', 'event_name', 'pixel_id', 'status', 'payload',
        'error_message', 'attempt_count', 'last_attempt_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'last_attempt_at' => 'datetime',
        'attempt_count' => 'integer',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
