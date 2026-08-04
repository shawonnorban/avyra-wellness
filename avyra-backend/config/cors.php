<?php

/*
|--------------------------------------------------------------------------
| Cross-Origin Resource Sharing
|--------------------------------------------------------------------------
|
| The storefront and admin are a separate origin from this API, so every
| browser request is a CORS request. `supports_credentials` is what lets the
| Sanctum session cookie ride along — and it forbids a wildcard origin, so the
| allowed list has to name each front end exactly.
|
| Driven by CORS_ALLOWED_ORIGINS (comma separated), falling back to
| FRONTEND_URL and then the dev server. A production origin missing from this
| list fails as a blocked login rather than an obvious error, so keep it in
| step with SANCTUM_STATEFUL_DOMAINS.
|
|   CORS_ALLOWED_ORIGINS=https://avyrabd.com,https://www.avyrabd.com
|
*/

$origins = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', env('FRONTEND_URL', 'http://localhost:3000'))),
)));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => $origins,
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
