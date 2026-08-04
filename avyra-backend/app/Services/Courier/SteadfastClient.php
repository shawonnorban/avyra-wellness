<?php

namespace App\Services\Courier;

use App\Models\Setting;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Thin HTTP client for the Steadfast (Packzy) merchant API.
 * Credentials live in the `courier_steadfast` setting and never leave the server.
 */
class SteadfastClient
{
    private array $config;

    public function __construct()
    {
        $this->config = array_merge([
            'enabled' => false,
            'base_url' => 'https://portal.packzy.com/api/v1',
            'api_key' => '',
            'secret_key' => '',
        ], Setting::get('courier_steadfast', []) ?: []);
    }

    public function isConfigured(): bool
    {
        return $this->config['api_key'] !== '' && $this->config['secret_key'] !== '';
    }

    /**
     * @param  array{invoice:string, recipient_name:string, recipient_phone:string, recipient_address:string, cod_amount:float, note:?string}  $payload
     */
    public function createOrder(array $payload): array
    {
        return $this->request()->post('/create_order', [
            'invoice' => $payload['invoice'],
            'recipient_name' => $payload['recipient_name'],
            'recipient_phone' => $payload['recipient_phone'],
            'recipient_address' => $payload['recipient_address'],
            'cod_amount' => $payload['cod_amount'],
            'note' => $payload['note'] ?? '',
        ])->throw()->json();
    }

    public function trackByConsignmentId(string $consignmentId): array
    {
        return $this->request()->get("/status_by_cid/{$consignmentId}")->throw()->json();
    }

    public function trackByInvoice(string $invoice): array
    {
        return $this->request()->get("/status_by_invoice/{$invoice}")->throw()->json();
    }

    public function balance(): array
    {
        return $this->request()->get('/get_balance')->throw()->json();
    }

    public function createReturn(string $consignmentId, string $reason): array
    {
        return $this->request()->post('/create_return_request', [
            'consignment_id' => $consignmentId,
            'reason' => $reason,
        ])->throw()->json();
    }

    private function request(): PendingRequest
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Steadfast credentials are not configured. Add them under Settings → Courier.');
        }

        return Http::baseUrl(rtrim((string) $this->config['base_url'], '/'))
            ->timeout(30)
            ->acceptJson()
            ->withHeaders([
                'Api-Key' => $this->config['api_key'],
                'Secret-Key' => $this->config['secret_key'],
            ]);
    }
}
