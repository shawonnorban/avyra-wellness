<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class OtpLog extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'phone', 'provider', 'success', 'response_code', 'error_reason', 'detail', 'created_at',
    ];

    protected $casts = [
        'success' => 'boolean',
        'created_at' => 'datetime',
    ];
}
