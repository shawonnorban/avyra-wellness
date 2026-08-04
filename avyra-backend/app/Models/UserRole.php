<?php

namespace App\Models;

use App\Enums\Role;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserRole extends Model
{
    use HasUuids;

    protected $fillable = ['user_id', 'role'];

    protected $casts = ['role' => Role::class];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
