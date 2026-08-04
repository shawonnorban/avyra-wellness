<?php

namespace App\Http\Middleware;

use App\Enums\PermissionModule;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Route guard against the permission matrix, e.g. ->middleware('module:sales,create').
 * The ability defaults to `view` when not given.
 */
class EnsureModulePermission
{
    public function handle(Request $request, Closure $next, string $module, string $ability = 'view'): Response
    {
        $target = PermissionModule::tryFrom($module);

        if (! $target) {
            abort(500, "Unknown module [{$module}] in route definition.");
        }

        $user = $request->user();

        if (! $user || ! $user->canModule($target, $ability)) {
            abort(403, "You do not have [{$ability}] permission on [{$module}].");
        }

        return $next($request);
    }
}
