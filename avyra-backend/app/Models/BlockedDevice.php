<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BlockedDevice extends Model
{
    use HasUuids;

    protected $fillable = ['device_fingerprint', 'device_info', 'reason', 'is_active', 'blocked_by'];

    protected $casts = ['is_active' => 'boolean'];
}
