<?php

namespace App\Http\Middleware;

use App\Enums\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Route guard for a minimum role level, e.g. ->middleware('role:employee').
 * Because roles are hierarchical, a manager passes an `employee` requirement.
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $required = Role::tryFrom($role);

        if (! $required) {
            abort(500, "Unknown role [{$role}] in route definition.");
        }

        $user = $request->user();

        if (! $user || ! $user->hasRole($required)) {
            abort(403, 'You do not have permission to access this resource.');
        }

        return $next($request);
    }
}
