<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\PermissionModule;
use App\Enums\Role;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'phone', 'password', 'avatar_path', 'is_active'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function roles(): HasMany
    {
        return $this->hasMany(UserRole::class);
    }

    /**
     * The user's effective role — the highest one assigned, defaulting to `user`.
     */
    public function role(): Role
    {
        return $this->roles
            ->map(fn (UserRole $r) => $r->role)
            ->sortByDesc(fn (Role $r) => $r->level())
            ->first() ?? Role::User;
    }

    public function hasRole(Role $required): bool
    {
        return $this->role()->atLeast($required);
    }

    /**
     * Module-level check against the permission matrix, e.g. can('sales', 'edit').
     * Admins bypass the matrix entirely.
     */
    public function canModule(PermissionModule $module, string $ability = 'view'): bool
    {
        if ($this->role() === Role::Admin) {
            return true;
        }

        if (! in_array($ability, ['view', 'create', 'edit', 'delete', 'approve'], true)) {
            return false;
        }

        // Read through the model so the boolean cast applies — the raw column is a
        // tinyint and comes back as "1"/"0" from the driver.
        $permission = RolePermission::where('role', $this->role())
            ->where('module', $module)
            ->first();

        return (bool) $permission?->{'can_' . $ability};
    }
}
