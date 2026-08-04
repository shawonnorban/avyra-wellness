<?php

namespace App\Services\Facebook;

use App\Models\FbEventLog;
use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Sends order conversions to Facebook's Conversions API.
 *
 * Server-side rather than browser-side on purpose: the events that matter most
 * (Lead, Purchase) happen when an admin changes a status hours later, with no
 * browser involved. The browser pixel still fires PageView and its own
 * InitiateCheckout; both sides send the same `event_id`, so Facebook
 * deduplicates the pair instead of counting it twice.
 */
class FacebookCapiService
{
    public function __construct(private readonly FacebookEventDeduper $deduper)
    {
    }

    /** Credentials missing means tracking is simply off, not broken. */
    public function isConfigured(): bool
    {
        return filled(config('services.facebook.pixel_id'))
            && filled(config('services.facebook.access_token'));
    }

    /**
     * Sends the event for `$key` if the order has not already had it, and
     * records the flag only once Facebook has accepted it.
     *
     * Never throws: a tracking failure must not roll back the order change that
     * triggered it.
     */
    public function sendForOrder(Order $order, string $key): bool
    {
        if (! $this->isConfigured() || ! $this->deduper->shouldSend($order, $key)) {
            return false;
        }

        $payload = $this->buildPayload($order, $key);

        try {
            $result = $this->post($payload);
        } catch (Throwable $e) {
            // A thrown exception is the same outcome as a rejected call: log it
            // for retry rather than letting it escape into the order update.
            $result = ['ok' => false, 'error' => $e->getMessage()];
        }

        if ($result['ok']) {
            $this->deduper->markSent($order, $key);

            return true;
        }

        $this->logFailure($order, $key, $payload, $result['error']);

        return false;
    }

    /**
     * Replays a previously failed call. Used by `fb:retry-events`, which owns
     * the attempt bookkeeping, so this only reports the outcome.
     *
     * @return array{ok: bool, error: string|null}
     */
    public function resend(array $payload): array
    {
        if (! $this->isConfigured()) {
            return ['ok' => false, 'error' => 'Facebook credentials are not configured.'];
        }

        try {
            return $this->post($payload);
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * The event id is derived from the order and event name rather than being
     * random, so a retry — and the browser pixel firing the same conversion —
     * resolve to one event on Facebook's side instead of several.
     */
    public function buildPayload(Order $order, string $key): array
    {
        $eventName = FacebookEventMap::EVENT_NAMES[$key];

        $customData = [
            'currency' => config('services.facebook.currency', 'BDT'),
            'content_type' => 'product',
        ];

        // Only Purchase reports money. Sending a value on Lead would inflate
        // reported revenue by counting the same order at two stages.
        if (FacebookEventMap::carriesValue($key)) {
            $customData['value'] = (float) $order->total;
        }

        $items = $order->relationLoaded('items') ? $order->items : $order->items()->get();

        if ($items->isNotEmpty()) {
            $customData['content_ids'] = $items->pluck('product_id')->filter()->values()->all();
            $customData['content_name'] = $items->pluck('product_name')->filter()->join(', ');
            $customData['num_items'] = (int) $items->sum('quantity');
        }

        $payload = [
            'data' => [
                [
                    'event_name' => $eventName,
                    'event_time' => $this->eventTime($order),
                    // Built from the order number, not the uuid: the browser has
                    // to derive the identical id to be deduplicated against, and
                    // the order number is the only one it is given.
                    'event_id' => "{$order->order_number}-{$eventName}",
                    'action_source' => 'website',
                    'event_source_url' => $order->landing_url ?: null,
                    'user_data' => array_filter([
                        // Nullable on the table: a staff-entered order may have
                        // no phone, and Facebook would reject an empty hash.
                        'ph' => filled($order->phone)
                            ? [$this->hash($this->normalisePhone($order->phone))]
                            : null,
                        // Orders carry no email of their own; it lives on the
                        // customer record the checkout matched or created.
                        'em' => filled($email = $order->customer?->email)
                            ? [$this->hash($email)]
                            : null,
                        'fbc' => $order->fbc ?: null,
                        'fbp' => $order->fbp ?: null,
                        'client_ip_address' => $order->ip_address ?: null,
                        'client_user_agent' => $order->user_agent ?: null,
                        'external_id' => [$this->hash($order->id)],
                    ], fn ($value) => $value !== null),
                    'custom_data' => $customData,
                ],
            ],
        ];

        if (filled($code = config('services.facebook.test_event_code'))) {
            $payload['test_event_code'] = $code;
        }

        return $payload;
    }

    /**
     * Facebook rejects events older than seven days. A Purchase for an order
     * placed a fortnight ago is real, so it is stamped now rather than dropped;
     * anything inside the window keeps its true order time.
     */
    private function eventTime(Order $order): int
    {
        $placed = $order->created_at?->timestamp ?? now()->timestamp;
        $cutoff = now()->subDays(6)->timestamp;

        return max($placed, $cutoff);
    }

    /** @return array{ok: bool, error: string|null} */
    private function post(array $payload): array
    {
        $version = config('services.facebook.api_version', 'v20.0');
        $pixelId = config('services.facebook.pixel_id');

        $response = Http::asJson()
            ->timeout(10)
            ->post("https://graph.facebook.com/{$version}/{$pixelId}/events", $payload + [
                'access_token' => config('services.facebook.access_token'),
            ]);

        if ($response->successful()) {
            return ['ok' => true, 'error' => null];
        }

        return ['ok' => false, 'error' => $response->body()];
    }

    private function logFailure(Order $order, string $key, array $payload, ?string $error): void
    {
        Log::warning('[FB CAPI] event failed', [
            'order' => $order->order_number,
            'event' => FacebookEventMap::EVENT_NAMES[$key],
            'error' => $error,
        ]);

        FbEventLog::create([
            'order_id' => $order->id,
            'event_name' => FacebookEventMap::EVENT_NAMES[$key],
            'status' => FbEventLog::STATUS_FAILED,
            // The token is appended at send time, so nothing secret is stored.
            'payload' => $payload,
            'error_message' => $error,
            'attempt_count' => 1,
            'last_attempt_at' => now(),
        ]);
    }

    /**
     * Facebook matches on E.164 without the leading `+`. Bangladeshi numbers are
     * entered as `01XXXXXXXXX`, which has to become `8801XXXXXXXXX` or it will
     * not match anything.
     */
    private function normalisePhone(string $phone): string
    {
        $digits = preg_replace('/\D/', '', $phone) ?? '';

        if (str_starts_with($digits, '880')) {
            return $digits;
        }

        return '880' . ltrim($digits, '0');
    }

    /** Facebook requires SHA-256 of the trimmed, lower-cased value. */
    private function hash(string $value): string
    {
        return hash('sha256', mb_strtolower(trim($value)));
    }
}
