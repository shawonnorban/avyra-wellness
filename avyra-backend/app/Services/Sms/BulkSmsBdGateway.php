<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Http;
use Throwable;

class BulkSmsBdGateway implements SmsGateway
{
    public function __construct(
        private readonly string $apiKey,
        private readonly string $senderId,
        private readonly string $baseUrl = 'http://bulksmsbd.net/api/smsapi',
    ) {}

    public function name(): string
    {
        return 'bulksmsbd';
    }

    public function send(string $phone, string $message): SmsResult
    {
        if ($this->apiKey === '') {
            return SmsResult::fail('SMS gateway is not configured.');
        }

        try {
            $response = Http::timeout(15)->get($this->baseUrl, [
                'api_key' => $this->apiKey,
                'type' => 'text',
                'number' => $this->formatNumber($phone),
                'senderid' => $this->senderId,
                'message' => $message,
            ]);

            $body = $response->body();
            // The API answers with JSON on success but can return bare text on error.
            $code = (string) (json_decode($body, true)['response_code'] ?? '');

            // 202 is BulkSMSBD's "accepted for delivery".
            if ($code === '202') {
                return SmsResult::ok($code, $body);
            }

            return SmsResult::fail('Gateway rejected the message.', $code ?: null, $body);
        } catch (Throwable $e) {
            return SmsResult::fail($e->getMessage());
        }
    }

    /**
     * BulkSMSBD wants Bangladeshi numbers as 880XXXXXXXXXX with no leading zero.
     */
    private function formatNumber(string $phone): string
    {
        $digits = preg_replace('/\D/', '', $phone) ?? '';

        if (str_starts_with($digits, '880')) {
            return $digits;
        }

        if (str_starts_with($digits, '0')) {
            return '88' . $digits;
        }

        if (str_starts_with($digits, '1')) {
            return '880' . $digits;
        }

        return $digits;
    }
}
