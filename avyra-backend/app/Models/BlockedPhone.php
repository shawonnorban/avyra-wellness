<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BlockedPhone extends Model
{
    use HasUuids;

    protected $fillable = ['phone', 'reason', 'is_active', 'blocked_by'];

    protected $casts = ['is_active' => 'boolean'];
}
