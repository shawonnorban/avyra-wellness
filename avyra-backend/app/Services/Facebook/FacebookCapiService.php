<?php

namespace App\Services\Facebook;

use App\Models\FbEventLog;
use App\Models\Order;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/**
 * Sends order conversions to Facebook's Conversions API.
 *
 * Server-side rather than browser-side on purpose: the event that matters most
 * (Purchase) fires when an admin confirms the order by phone hours later, with
 * no browser involved. The browser half — ViewContent, InitiateCheckout and its
 * own copy of Lead — runs through GTM; both sides send the same `event_id`, so
 * Meta deduplicates the pair instead of counting it twice.
 */
class FacebookCapiService
{
    public function __construct(private readonly FacebookEventDeduper $deduper)
    {
    }

    /**
     * Where the credentials come from.
     *
     * Settings → Meta CAPI wins when it is switched on *and* filled in, so staff
     * can rotate a token without a deploy. Anything else falls back to the `.env`,
     * which keeps a deployment that never opened the panel working — and is still
     * the safer home for a token, since it never reaches the database.
     *
     * @return array{pixel_id: ?string, access_token: ?string, test_event_code: ?string}
     */
    private function credentials(): array
    {
        $stored = Setting::get('meta_capi', []) ?: [];

        $panelReady = ! empty($stored['enabled'])
            && filled($stored['pixel_id'] ?? null)
            && filled($stored['access_token'] ?? null);

        if ($panelReady) {
            return [
                'pixel_id' => $stored['pixel_id'],
                'access_token' => $stored['access_token'],
                'test_event_code' => $stored['test_event_code'] ?: null,
            ];
        }

        return [
            'pixel_id' => config('services.facebook.pixel_id'),
            'access_token' => config('services.facebook.access_token'),
            'test_event_code' => config('services.facebook.test_event_code'),
        ];
    }

    /** Credentials missing means tracking is simply off, not broken. */
    public function isConfigured(): bool
    {
        $credentials = $this->credentials();

        return filled($credentials['pixel_id']) && filled($credentials['access_token']);
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
     * Returns the stored event id for this conversion, generating and saving one
     * the first time it is asked for.
     *
     * Stored rather than recomputed because the browser half is fired by a GTM
     * tag a media buyer configures by hand: the id has to be handed over as a
     * value, not as a formula both sides are trusted to reproduce. A retry then
     * reuses the same id and Meta still collapses the pair into one conversion.
     */
    public function eventIdFor(Order $order, string $key): string
    {
        if ($existing = $order->fb_event_ids[$key] ?? null) {
            return $existing;
        }

        $eventId = FacebookEventMap::EVENT_NAMES[$key] . '.' . $order->order_number . '.' . Str::random(8);

        $ids = $order->fb_event_ids ?? [];
        $ids[$key] = $eventId;

        // Written straight to the column: an in-memory copy elsewhere must not
        // clobber an id another request has already handed to a browser.
        $order->forceFill(['fb_event_ids' => $ids])->saveQuietly();

        return $eventId;
    }

    public function buildPayload(Order $order, string $key): array
    {
        $eventName = FacebookEventMap::EVENT_NAMES[$key];

        $customData = [
            'currency' => config('services.facebook.currency', 'BDT'),
            'content_type' => 'product',
            // Meta has no top-level order_id; it belongs in custom_data, where it
            // also gives Ads Manager something to reconcile against.
            'order_id' => $order->order_number,
        ];

        // Only the money events report a value. A value on Lead would count the
        // same order's revenue at two stages of the funnel.
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
                    'event_id' => $this->eventIdFor($order, $key),
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

        if (filled($code = $this->credentials()['test_event_code'])) {
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
        $credentials = $this->credentials();
        $pixelId = $credentials['pixel_id'];

        $response = Http::asJson()
            ->timeout(10)
            ->post("https://graph.facebook.com/{$version}/{$pixelId}/events", $payload + [
                'access_token' => $credentials['access_token'],
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
