<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Sanctum SPA auth: the Next.js app authenticates with the session cookie, so
        // /api requests from a stateful origin get the web session + CSRF applied.
        $middleware->statefulApi();

        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureRole::class,
            'module' => \App\Http\Middleware\EnsureModulePermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        // "The POST data is too large." says nothing an admin can act on, so the
        // actual server limit is named instead.
        $exceptions->render(function (PostTooLargeException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'message' => 'That upload was larger than this server accepts ('
                    . ini_get('post_max_size') . ' per request). Upload fewer or smaller images, '
                    . 'or raise post_max_size and upload_max_filesize in php.ini.',
            ], 413);
        });
    })->create();
