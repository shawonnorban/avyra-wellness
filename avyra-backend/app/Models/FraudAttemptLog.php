<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class FraudAttemptLog extends Model
{
    use HasUuids;

    protected $table = 'fraud_attempt_log';

    public $timestamps = false;

    protected $fillable = ['phone', 'ip_address', 'device_fingerprint', 'created_at'];

    protected $casts = ['created_at' => 'datetime'];
}
