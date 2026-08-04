<?php

namespace App\Services\Sms;

use App\Models\Setting;

/**
 * Resolves the configured gateway. Adding a provider means implementing
 * SmsGateway and adding one match arm here.
 */
class SmsManager
{
    public function gateway(): SmsGateway
    {
        $config = Setting::get('sms', []) ?: [];
        $apiKey = (string) ($config['api_key'] ?? '');

        // Without credentials, fall back to the log gateway rather than failing
        // checkout — OTP is optional and must not take the storefront down.
        if ($apiKey === '') {
            return new LogGateway();
        }

        return match ($config['provider'] ?? 'bulksmsbd') {
            'bulksmsbd' => new BulkSmsBdGateway($apiKey, (string) ($config['sender_id'] ?? '')),
            default => new LogGateway(),
        };
    }
}
