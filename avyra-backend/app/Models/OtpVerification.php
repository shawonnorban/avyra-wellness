<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class OtpVerification extends Model
{
    use HasUuids;

    protected $fillable = [
        'phone', 'code_hash', 'attempts', 'verified', 'expires_at', 'verified_at',
    ];

    protected $hidden = ['code_hash'];

    protected $casts = [
        'verified' => 'boolean',
        'expires_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }
}
