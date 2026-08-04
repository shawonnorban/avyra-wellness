<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BlockedIp extends Model
{
    use HasUuids;

    protected $table = 'blocked_ips';

    protected $fillable = ['ip_address', 'reason', 'is_active', 'blocked_by'];

    protected $casts = ['is_active' => 'boolean'];
}
