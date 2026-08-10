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
     * @return array{pixel_id: ?string, access_token: ?string, test_event_code: ?string, source: string}
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
                'source' => 'Settings → Meta CAPI',
            ];
        }

        return [
            'pixel_id' => config('services.facebook.pixel_id'),
            'access_token' => config('services.facebook.access_token'),
            'test_event_code' => config('services.facebook.test_event_code'),
            'source' => '.env',
        ];
    }

    /**
     * Every pixel this shop reports to, in send order.
     *
     * A list rather than a pair because an access token is bound to its own
     * pixel — there is no "send to both with one credential" — so each
     * destination has to carry its own. The settings panel exposes two, which is
     * what the shop asked for; adding a third is a settings field and a line
     * here, not a change to anything downstream, because everything past this
     * point already iterates.
     *
     * The `test_event_code` is deliberately shared: it marks a whole testing
     * session, not one destination.
     *
     * @return list<array{pixel_id: string, access_token: string, test_event_code: ?string}>
     */
    private function destinations(): array
    {
        $primary = $this->credentials();
        $stored = Setting::get('meta_capi', []) ?: [];

        $destinations = [];

        if (filled($primary['pixel_id']) && filled($primary['access_token'])) {
            $destinations[] = [
                'pixel_id' => (string) $primary['pixel_id'],
                'access_token' => (string) $primary['access_token'],
                'test_event_code' => $primary['test_event_code'],
            ];
        }

        // The second lives only in the panel: an .env pair describes one pixel,
        // and a shop reporting to two is configuring it deliberately.
        if (! empty($stored['enabled'])
            && filled($stored['pixel_id_2'] ?? null)
            && filled($stored['access_token_2'] ?? null)) {
            $destinations[] = [
                'pixel_id' => (string) $stored['pixel_id_2'],
                'access_token' => (string) $stored['access_token_2'],
                'test_event_code' => $primary['test_event_code'],
            ];
        }

        // Two entries naming the same pixel would send everything twice to it,
        // and the second copy is not deduplicated — same event_id, but Facebook
        // discards a repeat only within one pixel's own stream, which is exactly
        // where this would land it.
        return array_values(array_column($destinations, null, 'pixel_id'));
    }

    /**
     * A redacted view of the resolved credentials for `fb:doctor`.
     *
     * Reads through `credentials()` rather than the config directly, so the
     * diagnostic can never disagree with what a real send would use — which is
     * the whole reason to run it.
     *
     * @return array{source: string, test_event_code: ?string, configured: bool,
     *               pixels: list<array{pixel_id: string, token: string}>}
     */
    public function describeCredentials(): array
    {
        $credentials = $this->credentials();

        return [
            'source' => $credentials['source'],
            'test_event_code' => $credentials['test_event_code'],
            'configured' => $this->isConfigured(),
            'pixels' => array_map(fn (array $destination) => [
                // The pixel id is not a secret — it is in the page source — and
                // seeing it is the point: it has to match the one in the GTM tag.
                'pixel_id' => $destination['pixel_id'],
                'token' => Str::limit(
                    $destination['access_token'],
                    6,
                    '…' . mb_substr($destination['access_token'], -4),
                ),
            ], $this->destinations()),
        ];
    }

    /** Credentials missing means tracking is simply off, not broken. */
    public function isConfigured(): bool
    {
        return $this->destinations() !== [];
    }

    /**
     * Sends the event for `$key` to every pixel that has not already had it, and
     * records each flag only once Facebook has accepted that copy.
     *
     * The payload is built once and reused across destinations so all of them
     * carry the same `event_id` — each pixel then deduplicates its own browser
     * copy against it, and the shop can reconcile one order across both.
     *
     * Returns whether *anything* was sent. A destination that fails is logged
     * for retry and does not stop the others: one expired token must not cost
     * the other pixel its conversion.
     *
     * Never throws: a tracking failure must not roll back the order change that
     * triggered it.
     */
    public function sendForOrder(Order $order, string $key): bool
    {
        $payload = null;
        $sentAny = false;

        foreach ($this->destinations() as $destination) {
            if (! $this->deduper->shouldSend($order, $key, $destination['pixel_id'])) {
                continue;
            }

            $payload ??= $this->buildPayload($order, $key);

            try {
                $result = $this->post($payload, $destination);
            } catch (Throwable $e) {
                // A thrown exception is the same outcome as a rejected call: log
                // it for retry rather than letting it escape into the order update.
                $result = ['ok' => false, 'error' => $e->getMessage()];
            }

            if ($result['ok']) {
                $this->deduper->markSent($order, $key, $destination['pixel_id']);
                $sentAny = true;

                continue;
            }

            $this->logFailure($order, $key, $payload, $result['error'], $destination['pixel_id']);
        }

        return $sentAny;
    }

    /**
     * Replays a previously failed call. Used by `fb:retry-events`, which owns
     * the attempt bookkeeping, so this only reports the outcome.
     *
     * @return array{ok: bool, error: string|null}
     */
    public function resend(array $payload, ?string $pixelId = null): array
    {
        $destinations = $this->destinations();

        // A null pixel is a log written before there was more than one
        // destination; it belonged to the first, which is where it goes back.
        $destination = $pixelId === null
            ? ($destinations[0] ?? null)
            : collect($destinations)->firstWhere('pixel_id', $pixelId);

        if ($destination === null) {
            return ['ok' => false, 'error' => $pixelId === null
                ? 'Facebook credentials are not configured.'
                : "Pixel {$pixelId} is no longer configured; nothing to retry against."];
        }

        try {
            return $this->post($payload, $destination);
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    /** The pixel a retry should replay a null-pixel log against. */
    public function primaryPixelId(): ?string
    {
        return $this->destinations()[0]['pixel_id'] ?? null;
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
                    'action_source' => $this->actionSource($order),
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
                        // Name, city and country are already on every order and
                        // were simply not being sent. Each one Meta can match on
                        // raises the event match quality, which is what decides
                        // whether a conversion is attributed to an ad at all.
                        'fn' => ($first = $this->firstName($order)) ? [$this->hash($first)] : null,
                        'ln' => ($last = $this->lastName($order)) ? [$this->hash($last)] : null,
                        'ct' => ($city = $this->city($order)) ? [$this->hash($city)] : null,
                        'country' => [$this->hash('bd')],
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
     * How the conversion actually reached the business.
     *
     * A staff-entered order (`order_source` POS) never touched the site: it is
     * created straight to `confirm` from the admin panel and carries no IP, user
     * agent, `fbc` or `fbp`. Reporting it as `website` credited campaigns with
     * sales that arrived over the phone, and left Meta matching them to ad clicks
     * on the hashed phone number alone. `phone_call` is Meta's own value for
     * exactly this, and it keeps the website conversion figures honest.
     *
     * Still sent rather than suppressed: a cash-on-delivery buyer who rings the
     * number in an advert is a real conversion, just not a browser one.
     */
    private function actionSource(Order $order): string
    {
        return $order->order_source === 'POS' ? 'phone_call' : 'website';
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

    /**
     * @param  array{pixel_id: string, access_token: string, test_event_code: ?string}  $destination
     * @return array{ok: bool, error: string|null}
     */
    private function post(array $payload, array $destination): array
    {
        $version = config('services.facebook.api_version', 'v20.0');

        $response = Http::asJson()
            ->timeout(10)
            ->post("https://graph.facebook.com/{$version}/{$destination['pixel_id']}/events", $payload + [
                'access_token' => $destination['access_token'],
            ]);

        if ($response->successful()) {
            return ['ok' => true, 'error' => null];
        }

        return ['ok' => false, 'error' => $response->body()];
    }

    private function logFailure(Order $order, string $key, array $payload, ?string $error, string $pixelId): void
    {
        Log::warning('[FB CAPI] event failed', [
            'order' => $order->order_number,
            'event' => FacebookEventMap::EVENT_NAMES[$key],
            'pixel' => $pixelId,
            'error' => $error,
        ]);

        FbEventLog::create([
            'order_id' => $order->id,
            'event_name' => FacebookEventMap::EVENT_NAMES[$key],
            // Which destination this owes, so the retry knows where to replay it.
            'pixel_id' => $pixelId,
            'status' => FbEventLog::STATUS_FAILED,
            // The token is appended at send time, so nothing secret is stored.
            'payload' => $payload,
            'error_message' => $error,
            'attempt_count' => 1,
            'last_attempt_at' => now(),
        ]);
    }

    /**
     * The parts of `customer_name` Meta can match on.
     *
     * One free-text field is all the checkout collects, so the first whitespace
     * separated token is taken as the given name and the remainder as the family
     * name. A single-word name yields no `ln` rather than a duplicated `fn` —
     * a wrong hash matches nothing and only dilutes the signal.
     */
    private function firstName(Order $order): ?string
    {
        $parts = preg_split('/\s+/', trim((string) $order->customer_name), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        return $parts[0] ?? null;
    }

    private function lastName(Order $order): ?string
    {
        $parts = preg_split('/\s+/', trim((string) $order->customer_name), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        return count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : null;
    }

    /**
     * City, but only when the order actually says so.
     *
     * `inside_dhaka` is a fact; `outside_dhaka` covers the whole rest of the
     * country and naming a city there would be a guess. Meta treats a wrong hash
     * as a failed match, so silence is worth more than a plausible invention.
     */
    private function city(Order $order): ?string
    {
        return $order->delivery_zone === 'inside_dhaka' ? 'dhaka' : null;
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
