<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\PermissionModule;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\RolePermission;
use App\Models\User;
use App\Models\UserRole;
use App\Rules\StoredImagePath;
use App\Support\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::with('roles')
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%' . $request->string('search') . '%';
                $q->where(fn ($sub) => $sub->where('name', 'like', $term)->orWhere('email', 'like', $term));
            })
            ->orderBy('name')
            ->paginate($request->integer('per_page', 25));

        $users->getCollection()->transform(fn (User $user) => $this->present($user));

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:32'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(Role::values())],
            'avatar_path' => ['nullable', new StoredImagePath()],
        ]);

        $user = DB::transaction(function () use ($validated, $request) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'password' => Hash::make($validated['password']),
                'avatar_path' => $validated['avatar_path'] ?? null,
                'email_verified_at' => now(),
            ]);

            UserRole::create([
                'user_id' => $user->id,
                'role' => $this->assignableRole($validated['role'], $request->user()),
            ]);

            return $user;
        });

        return response()->json(['data' => $this->present($user->load('roles'))], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', "unique:users,email,{$user->id}"],
            'phone' => ['nullable', 'string', 'max:32'],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['sometimes', Rule::in(Role::values())],
            'avatar_path' => ['nullable', new StoredImagePath()],
            'is_active' => ['boolean'],
        ]);

        DB::transaction(function () use ($validated, $user, $request) {
            $user->fill(collect($validated)->except(['password', 'role'])->all());

            if (filled($validated['password'] ?? null)) {
                $user->password = Hash::make($validated['password']);
            }

            $user->save();

            if (isset($validated['role'])) {
                $role = $this->assignableRole($validated['role'], $request->user());

                $user->roles()->delete();
                UserRole::create(['user_id' => $user->id, 'role' => $role]);
            }
        });

        return response()->json(['data' => $this->present($user->fresh()->load('roles'))]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot deactivate your own account.'], 422);
        }

        // Orders and stock movements reference the user, so deactivate rather than delete.
        $user->update(['is_active' => false]);

        return response()->json(['message' => 'User deactivated.']);
    }

    /* ---------- Permission matrix ---------- */

    public function permissions(): JsonResponse
    {
        $rows = RolePermission::get()->keyBy(fn (RolePermission $p) => "{$p->role->value}.{$p->module->value}");

        $matrix = [];

        foreach (Role::cases() as $role) {
            foreach (PermissionModule::cases() as $module) {
                $row = $rows->get("{$role->value}.{$module->value}");

                $matrix[$role->value][$module->value] = [
                    // Admin bypasses the matrix in code, so it is always shown as full access.
                    'view' => $role === Role::Admin || (bool) $row?->can_view,
                    'create' => $role === Role::Admin || (bool) $row?->can_create,
                    'edit' => $role === Role::Admin || (bool) $row?->can_edit,
                    'delete' => $role === Role::Admin || (bool) $row?->can_delete,
                    'approve' => $role === Role::Admin || (bool) $row?->can_approve,
                ];
            }
        }

        return response()->json([
            'data' => [
                'matrix' => $matrix,
                'roles' => Role::values(),
                'modules' => PermissionModule::values(),
            ],
        ]);
    }

    public function updatePermissions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', Rule::in(Role::values())],
            'module' => ['required', Rule::in(PermissionModule::values())],
            'can_view' => ['required', 'boolean'],
            'can_create' => ['required', 'boolean'],
            'can_edit' => ['required', 'boolean'],
            'can_delete' => ['required', 'boolean'],
            'can_approve' => ['required', 'boolean'],
        ]);

        if ($validated['role'] === Role::Admin->value) {
            return response()->json([
                'message' => 'Admin permissions are fixed and cannot be edited.',
            ], 422);
        }

        $permission = RolePermission::updateOrCreate(
            ['role' => $validated['role'], 'module' => $validated['module']],
            collect($validated)->except(['role', 'module'])->all(),
        );

        return response()->json(['data' => $permission]);
    }

    /**
     * Only an admin may grant the admin role; a manager creating staff is capped
     * at manager, so nobody can escalate beyond their own level.
     */
    private function assignableRole(string $requested, User $actor): Role
    {
        $role = Role::from($requested);

        return $actor->hasRole(Role::Admin) || $role->level() < Role::Admin->level()
            ? $role
            : Role::Manager;
    }

    private function present(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar_path' => $user->avatar_path,
            'avatar_url' => Media::url($user->avatar_path),
            'is_active' => $user->is_active,
            'role' => $user->role()->value,
            'created_at' => $user->created_at?->toIso8601String(),
        ];
    }
}
