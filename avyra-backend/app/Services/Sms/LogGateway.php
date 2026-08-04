<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Log;

/**
 * Development fallback: writes the message to the log instead of sending it.
 * Used automatically whenever no real gateway is configured.
 */
class LogGateway implements SmsGateway
{
    public function name(): string
    {
        return 'log';
    }

    public function send(string $phone, string $message): SmsResult
    {
        Log::info("[SMS→{$phone}] {$message}");

        return SmsResult::ok('logged', 'Written to the application log; no SMS was sent.');
    }
}
