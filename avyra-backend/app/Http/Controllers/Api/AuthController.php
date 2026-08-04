<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Session (cookie) login for the Next.js admin. The client must first hit
     * /sanctum/csrf-cookie so the XSRF token is present.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        if (! $request->user()->is_active) {
            Auth::guard('web')->logout();

            throw ValidationException::withMessages([
                'email' => ['This account has been deactivated.'],
            ]);
        }

        $request->session()->regenerate();

        return response()->json(['user' => $this->profile($request->user())]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->profile($request->user())]);
    }

    /**
     * Shape the admin UI needs: identity plus the resolved permission matrix, so it
     * can hide modules without a round trip per screen.
     */
    private function profile(User $user): array
    {
        $user->loadMissing('roles');

        $permissions = [];
        foreach (\App\Enums\PermissionModule::cases() as $module) {
            $permissions[$module->value] = [
                'view' => $user->canModule($module, 'view'),
                'create' => $user->canModule($module, 'create'),
                'edit' => $user->canModule($module, 'edit'),
                'delete' => $user->canModule($module, 'delete'),
                'approve' => $user->canModule($module, 'approve'),
            ];
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar_url' => $user->avatar_url,
            'role' => $user->role()->value,
            'permissions' => $permissions,
        ];
    }
}
