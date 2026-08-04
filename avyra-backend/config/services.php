<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
     * Facebook Conversions API. The access token is server-side only and must
     * never gain a NEXT_PUBLIC_ twin — the pixel id is the only half of this
     * pair the browser is allowed to see.
     *
     * Leaving `pixel_id` or `access_token` empty disables sending entirely, so
     * a machine without credentials runs the rest of the app normally.
     */
    'facebook' => [
        'pixel_id' => env('FB_PIXEL_ID'),
        'access_token' => env('FB_ACCESS_TOKEN'),
        'api_version' => env('FB_API_VERSION', 'v20.0'),

        // Set only in development, so test traffic lands in Events Manager's
        // Test Events tab instead of production reporting.
        'test_event_code' => env('FB_TEST_EVENT_CODE'),

        'currency' => env('FB_CURRENCY', 'BDT'),
    ],

];
