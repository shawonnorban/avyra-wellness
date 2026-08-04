<?php

namespace App\Models;

use App\Enums\PermissionModule;
use App\Enums\Role;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class RolePermission extends Model
{
    use HasUuids;

    protected $fillable = [
        'role', 'module', 'can_view', 'can_create', 'can_edit', 'can_delete', 'can_approve',
    ];

    protected $casts = [
        'role' => Role::class,
        'module' => PermissionModule::class,
        'can_view' => 'boolean',
        'can_create' => 'boolean',
        'can_edit' => 'boolean',
        'can_delete' => 'boolean',
        'can_approve' => 'boolean',
    ];
}
