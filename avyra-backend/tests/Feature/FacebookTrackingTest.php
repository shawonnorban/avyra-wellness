<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\FbEventLog;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Services\Facebook\BrowserTrackingPayload;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FacebookTrackingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Flipped by the tests that need Facebook to reject a call.
     *
     * A single stub reading this flag, rather than re-faking mid-test: repeated
     * Http::fake() calls are merged and the first matching stub wins, so a later
     * fake cannot override an earlier one.
     */
    private bool $facebookRejects = false;

    /**
     * Pixel id => how many of its next calls to reject.
     *
     * Same reason as the flag above: a per-URL `Http::fake([...])` in a test
     * would be merged behind the catch-all below and never match, so which pixel
     * fails has to be decided inside the one stub.
     *
     * @var array<string, int>
     */
    private array $rejectingPixels = [];

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.facebook.pixel_id' => '1234567890',
            'services.facebook.access_token' => 'test-token',
            'services.facebook.api_version' => 'v20.0',
            'services.facebook.test_event_code' => null,
        ]);

        Http::fake(function ($request) {
            if ($this->facebookRejects) {
                return Http::response(['error' => 'bad token'], 401);
            }

            $pixel = $this->pixelFromUrl((string) $request->url());

            if (($this->rejectingPixels[$pixel] ?? 0) > 0) {
                $this->rejectingPixels[$pixel]--;

                return Http::response(['error' => 'expired token'], 401);
            }

            return Http::response(['events_received' => 1]);
        });
    }

    /** `https://graph.facebook.com/v20.0/<pixel>/events` → `<pixel>`. */
    private function pixelFromUrl(string $url): string
    {
        return explode('/', (string) parse_url($url, PHP_URL_PATH))[2] ?? '';
    }

    private function order(array $attributes = []): Order
    {
        return Order::create(array_merge([
            'customer_name' => 'Test Buyer',
            'phone' => '01712345678',
            'address' => 'Dhaka',
            'total' => 1500,
            'status' => OrderStatus::Pending,
            'ip_address' => '203.0.113.9',
            'user_agent' => 'Mozilla/5.0',
            'fbc' => 'fb.1.1700000000.abc123',
            'fbp' => 'fb.1.1700000000.9876543210',
        ], $attributes));
    }

    /** @return array<int, array<string, mixed>> */
    private function sentEvents(): array
    {
        $events = [];

        foreach (Http::recorded() as [$request]) {
            $events[] = $request->data()['data'][0];
        }

        return $events;
    }

    public function test_a_new_order_sends_lead(): void
    {
        $order = $this->order();

        $events = $this->sentEvents();

        $this->assertCount(1, $events);
        $this->assertSame('Lead', $events[0]['event_name']);
        // Keyed by pixel: a send that reached one destination and not the other
        // must not read as complete.
        $this->assertSame(['1234567890' => true], $order->fresh()->fb_events_sent['lead']);
    }

    public function test_the_funnel_fires_lead_then_purchase_then_delivered_purchase(): void
    {
        $order = $this->order();

        $order->update(['status' => OrderStatus::Confirm]);
        $order->update(['status' => OrderStatus::Delivered]);

        $events = $this->sentEvents();

        $this->assertSame(
            ['Lead', 'Purchase', 'DeliveredPurchase'],
            array_column($events, 'event_name'),
        );

        // All three report the order total. The same money therefore appears at
        // two funnel stages, which is intended — Lead is what the media buyer
        // optimises against — but means the two must never be summed.
        $this->assertSame(1500.0, $events[0]['custom_data']['value']);
        $this->assertSame(1500.0, $events[1]['custom_data']['value']);
        $this->assertSame(1500.0, $events[2]['custom_data']['value']);
        $this->assertSame('BDT', $events[1]['custom_data']['currency']);

        // The brief asks for order_id on every event.
        $this->assertSame($order->order_number, $events[1]['custom_data']['order_id']);
    }

    public function test_cancelling_sends_nothing_and_does_not_retract_the_purchase(): void
    {
        $order = $this->order();
        $order->update(['status' => OrderStatus::Confirm]);

        $before = count($this->sentEvents());
        $order->update(['status' => OrderStatus::Cancel]);

        // A cancellation is an internal judgement, not a conversion. It also does
        // not take back the Purchase already reported — that needs Meta's
        // value-adjustment API, which is out of scope.
        $this->assertCount($before, $this->sentEvents());
    }

    public function test_hold_fake_and_cancel_send_nothing(): void
    {
        // Created straight into `hold` so the Lead of a normal checkout does not
        // muddy the count.
        $order = $this->order(['status' => OrderStatus::Hold]);

        $order->update(['status' => OrderStatus::Fake]);
        $order->update(['status' => OrderStatus::Cancel]);

        Http::assertNothingSent();
        $this->assertNull($order->fresh()->fb_events_sent);
    }

    public function test_the_same_status_twice_sends_one_event(): void
    {
        $order = $this->order(['status' => OrderStatus::Hold]);

        $order->update(['status' => OrderStatus::Confirm]);
        $order->update(['status' => OrderStatus::Hold]);
        $order->update(['status' => OrderStatus::Confirm]);

        $this->assertCount(1, $this->sentEvents());
    }

    public function test_personal_data_is_hashed_and_match_signals_are_included(): void
    {
        $order = $this->order();

        $userData = $this->sentEvents()[0]['user_data'];

        // 8801… is what Facebook matches on, not the local 01… form.
        $this->assertSame([hash('sha256', '8801712345678')], $userData['ph']);
        $this->assertSame([hash('sha256', $order->id)], $userData['external_id']);
        $this->assertSame('203.0.113.9', $userData['client_ip_address']);
        $this->assertSame('Mozilla/5.0', $userData['client_user_agent']);
        $this->assertSame('fb.1.1700000000.abc123', $userData['fbc']);
        $this->assertSame('fb.1.1700000000.9876543210', $userData['fbp']);

        // The raw phone must never appear anywhere in the request body.
        $this->assertStringNotContainsString('01712345678', json_encode($this->sentEvents()));
    }

    public function test_the_event_id_is_stored_so_the_browser_can_send_the_same_one(): void
    {
        $order = $this->order();

        $sent = $this->sentEvents()[0]['event_id'];
        $stored = $order->fresh()->fb_event_ids['lead'];

        // Stored rather than derived: the browser half is fired by a GTM tag a
        // media buyer wires up, so the id has to be handed over as a value.
        $this->assertSame($stored, $sent);
        $this->assertStringStartsWith('Lead.' . $order->order_number, $sent);
    }

    public function test_a_failed_call_is_logged_and_the_flag_is_not_set(): void
    {
        $this->facebookRejects = true;

        $order = $this->order();

        $log = FbEventLog::where('order_id', $order->id)->firstOrFail();

        $this->assertSame('Lead', $log->event_name);
        $this->assertSame(FbEventLog::STATUS_FAILED, $log->status);
        $this->assertSame(1, $log->attempt_count);

        // Still owed, so a retry will send it rather than skipping it.
        $this->assertNull($order->fresh()->fb_events_sent);
    }

    public function test_the_retry_command_resends_a_failed_event_and_marks_it_sent(): void
    {
        $this->facebookRejects = true;
        $order = $this->order();

        $this->facebookRejects = false;
        $this->artisan('fb:retry-events')->assertSuccessful();

        $log = FbEventLog::where('order_id', $order->id)->firstOrFail();

        $this->assertSame(2, $log->attempt_count);

        // The retry marks the flag for the pixel it actually replayed against —
        // a log written before there was a second one belongs to the first.
        $this->assertSame(['1234567890' => true], $order->fresh()->fb_events_sent['lead']);
    }

    public function test_the_retry_command_gives_up_after_the_attempt_cap(): void
    {
        $this->facebookRejects = true;
        $order = $this->order();

        FbEventLog::where('order_id', $order->id)
            ->update(['attempt_count' => FbEventLog::MAX_ATTEMPTS]);

        $sentBefore = count(Http::recorded());

        $this->facebookRejects = false;
        $this->artisan('fb:retry-events')->assertSuccessful();

        // The cap is respected: the retry made no call of its own.
        $this->assertCount($sentBefore, Http::recorded());
        $this->assertNull($order->fresh()->fb_events_sent);
    }

    public function test_nothing_is_sent_when_credentials_are_missing(): void
    {
        config(['services.facebook.access_token' => null]);

        $this->order()->update(['status' => OrderStatus::Delivered]);

        Http::assertNothingSent();
    }

    public function test_a_facebook_outage_does_not_fail_the_order_update(): void
    {
        Http::fake(fn () => throw new \RuntimeException('connection refused'));

        $order = $this->order();
        $order->update(['status' => OrderStatus::Delivered]);

        // The status change is what matters; tracking is best effort.
        $this->assertSame(OrderStatus::Delivered, $order->fresh()->status);
    }

    public function test_the_checkout_stores_the_ip_and_user_agent_for_later_events(): void
    {
        $product = Product::create([
            'name' => 'Vital Plus',
            'slug' => 'vital-plus-fb',
            'sku' => 'VP-FB-1',
            'price' => 1000,
            'quantity' => 50,
            'is_active' => true,
        ]);

        $this->withHeader('User-Agent', 'FbTestAgent/1.0')
            ->postJson('/api/storefront/checkout', [
                'customer_name' => 'Buyer',
                'phone' => '01799990000',
                'address' => 'Dhaka, Bangladesh, house 12 road 4',
                'delivery_zone' => 'inside_dhaka',
                'payment_method' => 'COD',
                'items' => [['product_id' => $product->id, 'quantity' => 1]],
                'fbc' => 'fb.1.1700000000.click',
                'fbp' => 'fb.1.1700000000.browser',
            ])
            ->assertCreated();

        $order = Order::where('phone', '01799990000')->firstOrFail();

        $this->assertSame('FbTestAgent/1.0', $order->user_agent);
        $this->assertNotNull($order->ip_address);
        $this->assertSame('fb.1.1700000000.click', $order->fbc);
        $this->assertSame('fb.1.1700000000.browser', $order->fbp);
    }
public function test_checkout_hands_the_browser_the_same_event_id_it_sends(): void
    {
        $order = $this->order();

        $payload = app(BrowserTrackingPayload::class)->leadPayload($order);

        // The whole point of the handover: Meta only collapses the browser and
        // server copies into one conversion when these match exactly.
        $this->assertSame('Lead', $payload['event_name']);
        $this->assertSame($this->sentEvents()[0]['event_id'], $payload['event_id']);
        $this->assertSame($order->order_number, $payload['order_id']);

        // The browser copy must claim exactly the revenue the server copy does,
        // or a deduplicated pair disagrees about what the conversion was worth.
        $this->assertSame((float) $order->total, $payload['value']);
        $this->assertSame($this->sentEvents()[0]['custom_data']['value'], $payload['value']);
    }
public function test_the_settings_panel_overrides_the_env_credentials(): void
    {
        Setting::put('meta_capi', [
            'enabled' => true,
            'pixel_id' => 'PANEL-PIXEL',
            'access_token' => 'panel-token',
            'test_event_code' => 'TEST123',
        ]);

        $this->order();

        $urls = collect(Http::recorded())->map(fn ($pair) => (string) $pair[0]->url());

        // The panel wins so staff can rotate a token without a deploy; without
        // this the tab looked editable but changed nothing.
        $this->assertTrue($urls->every(fn ($url) => str_contains($url, 'PANEL-PIXEL')));
        $this->assertSame('TEST123', $this->sentPayloads()[0]['test_event_code'] ?? null);
    }

    public function test_the_env_is_used_while_the_panel_switch_is_off(): void
    {
        Setting::put('meta_capi', [
            'enabled' => false,
            'pixel_id' => 'PANEL-PIXEL',
            'access_token' => 'panel-token',
            'test_event_code' => '',
        ]);

        $this->order();

        $urls = collect(Http::recorded())->map(fn ($pair) => (string) $pair[0]->url());

        $this->assertTrue($urls->every(fn ($url) => ! str_contains($url, 'PANEL-PIXEL')));
    }

    /**
     * The diagnostic has to be trustworthy about the state it exists to report:
     * blank credentials are the silent failure that sends nothing without logging
     * anything, and an operator reading "configured" there would look in the
     * wrong place entirely.
     */
    public function test_the_doctor_reports_missing_credentials_as_a_failure(): void
    {
        config(['services.facebook.pixel_id' => null, 'services.facebook.access_token' => null]);

        $this->artisan('fb:doctor')
            ->expectsOutputToContain('NOTHING is being sent')
            ->assertExitCode(1);
    }

    public function test_the_doctor_never_prints_the_whole_access_token(): void
    {
        config(['services.facebook.access_token' => 'EAAsupersecrettokenvalue']);

        $this->artisan('fb:doctor')
            ->doesntExpectOutputToContain('EAAsupersecrettokenvalue')
            ->assertExitCode(0);
    }

    /**
     * "Nothing was rejected" must not be reported as "it works". An order placed
     * before the credentials existed sent nothing and logged nothing, and the
     * two states are indistinguishable in the failure table — reading the first
     * as the second sends an operator to debug GTM while the server half has
     * never made a single call.
     */
    public function test_the_doctor_distinguishes_never_attempted_from_all_accepted(): void
    {
        // An order that predates the credentials: no events sent, none rejected.
        $order = $this->order();
        $order->forceFill(['fb_events_sent' => []])->saveQuietly();

        $this->artisan('fb:doctor')
            ->expectsOutputToContain('nothing has been attempted yet')
            ->doesntExpectOutputToContain('Server events are arriving')
            ->assertExitCode(0);
    }

    public function test_the_doctor_confirms_delivery_once_an_event_has_been_accepted(): void
    {
        // The observer sends Lead on creation, and the stubbed Meta accepts it.
        $this->order();

        $this->artisan('fb:doctor')
            ->expectsOutputToContain('Server events are arriving')
            ->doesntExpectOutputToContain('nothing has been attempted yet')
            ->assertExitCode(0);
    }

    /**
     * A phone order reported as a website conversion credits campaigns with
     * sales no advert produced, and Meta then matches it to ad clicks on the
     * hashed phone number alone — the order carries no IP, user agent or click
     * id to contradict that.
     */
    /**
     * A failure that sits past its retry window is the only visible symptom of a
     * missing cron — everything else about the setup looks healthy while events
     * are quietly owed forever.
     */
    public function test_the_doctor_notices_that_the_hourly_retry_is_not_running(): void
    {
        $this->facebookRejects = true;
        $this->order();

        FbEventLog::query()->update(['last_attempt_at' => now()->subHours(3)]);

        $this->artisan('fb:doctor')
            ->expectsOutputToContain('schedule:run')
            ->assertExitCode(0);
    }

    public function test_the_doctor_stays_quiet_about_the_scheduler_with_nothing_to_retry(): void
    {
        $this->order();

        $this->artisan('fb:doctor')
            ->doesntExpectOutputToContain('schedule:run')
            ->assertExitCode(0);
    }

    /**
     * Event match quality decides whether a conversion is attributed to an ad at
     * all, and name, city and country were sitting on every order unsent.
     */
    public function test_every_matchable_field_on_the_order_is_hashed_and_sent(): void
    {
        $this->order([
            'customer_name' => 'Shawon Noor Rahman',
            'delivery_zone' => 'inside_dhaka',
        ]);

        $userData = $this->sentEvents()[0]['user_data'];

        $this->assertSame([hash('sha256', 'shawon')], $userData['fn']);
        // Everything after the first token, so a middle name is not discarded.
        $this->assertSame([hash('sha256', 'noor rahman')], $userData['ln']);
        $this->assertSame([hash('sha256', 'dhaka')], $userData['ct']);
        $this->assertSame([hash('sha256', 'bd')], $userData['country']);
    }

    /**
     * A wrong hash is a failed match that dilutes the signal, so a field the
     * order cannot actually supply is omitted rather than guessed.
     */
    public function test_a_single_word_name_sends_no_family_name(): void
    {
        $this->order(['customer_name' => 'Shawon', 'delivery_zone' => 'outside_dhaka']);

        $userData = $this->sentEvents()[0]['user_data'];

        $this->assertSame([hash('sha256', 'shawon')], $userData['fn']);
        $this->assertArrayNotHasKey('ln', $userData);
        // outside_dhaka is the whole rest of the country, not a city.
        $this->assertArrayNotHasKey('ct', $userData);
    }

    /** Configures a second destination alongside the .env one. */
    private function useTwoPixels(array $overrides = []): void
    {
        Setting::put('meta_capi', array_merge([
            'enabled' => true,
            'pixel_id' => 'PIXEL-A',
            'access_token' => 'token-a',
            'test_event_code' => '',
            'pixel_id_2' => 'PIXEL-B',
            'access_token_2' => 'token-b',
            'test_event_code_2' => '',
        ], $overrides));
    }

    /**
     * A test event code names one pixel's Test Events tab, so the wrong pixel's
     * code sends its events somewhere nobody is looking.
     */
    public function test_each_pixel_gets_its_own_test_event_code(): void
    {
        $this->useTwoPixels([
            'test_event_code' => 'TEST-A',
            'test_event_code_2' => 'TEST-B',
        ]);

        $this->order();

        $sent = collect(Http::recorded())->mapWithKeys(fn ($pair) => [
            $this->pixelFromUrl((string) $pair[0]->url()) => $pair[0]->data()['test_event_code'] ?? null,
        ])->all();

        $this->assertSame(['PIXEL-A' => 'TEST-A', 'PIXEL-B' => 'TEST-B'], $sent);
    }

    /** One pixel can be under test while the other reports live. */
    public function test_a_pixel_without_a_code_still_reports_live(): void
    {
        $this->useTwoPixels(['test_event_code' => 'TEST-A']);

        $this->order();

        $sent = collect(Http::recorded())->mapWithKeys(fn ($pair) => [
            $this->pixelFromUrl((string) $pair[0]->url()) => $pair[0]->data()['test_event_code'] ?? null,
        ])->all();

        $this->assertSame(['PIXEL-A' => 'TEST-A', 'PIXEL-B' => null], $sent);
    }

    /** @return list<string> The pixel each recorded call was addressed to. */
    private function calledPixels(): array
    {
        return collect(Http::recorded())
            ->map(fn ($pair) => $this->pixelFromUrl((string) $pair[0]->url()))
            ->all();
    }

    public function test_one_conversion_is_reported_to_both_pixels(): void
    {
        $this->useTwoPixels();

        $order = $this->order();

        $this->assertSame(['PIXEL-A', 'PIXEL-B'], $this->calledPixels());

        // Same event_id to both, so each pixel deduplicates its own browser copy
        // against it and the shop can reconcile one order across the pair.
        $events = $this->sentEvents();
        $this->assertSame($events[0]['event_id'], $events[1]['event_id']);

        $this->assertSame(
            ['PIXEL-A' => true, 'PIXEL-B' => true],
            $order->fresh()->fb_events_sent['lead'],
        );
    }

    /**
     * The failure that a shared flag would cause: one pixel accepts, the flag
     * says "sent", and the other loses the conversion for good.
     */
    public function test_a_pixel_that_rejects_still_owes_the_event(): void
    {
        $this->useTwoPixels();
        $this->rejectingPixels = ['PIXEL-B' => 99];

        $order = $this->order();

        $this->assertSame(['PIXEL-A' => true], $order->fresh()->fb_events_sent['lead']);

        // Logged against the pixel that failed, so the retry knows where to go.
        $log = FbEventLog::where('order_id', $order->id)->firstOrFail();
        $this->assertSame('PIXEL-B', $log->pixel_id);
    }

    public function test_the_retry_replays_only_to_the_pixel_that_failed(): void
    {
        $this->useTwoPixels();
        // Fails once, then recovers — the case the retry exists for.
        $this->rejectingPixels = ['PIXEL-B' => 1];

        $order = $this->order();
        $this->artisan('fb:retry-events')->assertSuccessful();

        // A is untouched by the retry; only B is replayed.
        $this->assertSame(['PIXEL-A', 'PIXEL-B', 'PIXEL-B'], $this->calledPixels());
        $this->assertSame(
            ['PIXEL-A' => true, 'PIXEL-B' => true],
            $order->fresh()->fb_events_sent['lead'],
        );
    }

    /**
     * Adding a second pixel must not replay history into it. Facebook rejects
     * events past seven days, and `eventTime()` would restamp them with today's
     * date if it did not — turning old sales into today's reported revenue.
     */
    public function test_adding_a_pixel_does_not_resend_orders_that_predate_it(): void
    {
        $order = $this->order();
        $order->forceFill(['fb_events_sent' => ['lead' => true]])->saveQuietly();

        Http::fake(fn () => Http::response(['events_received' => 1]));
        $this->useTwoPixels();

        $order->update(['status' => OrderStatus::Pending]);

        Http::assertNothingSent();
    }

    public function test_a_staff_entered_order_is_not_reported_as_a_website_conversion(): void
    {
        $this->order(['status' => OrderStatus::Confirm, 'order_source' => 'POS']);

        $this->assertSame('phone_call', $this->sentEvents()[0]['action_source']);
    }

    public function test_a_storefront_order_is_still_a_website_conversion(): void
    {
        $this->order(['order_source' => 'Website']);

        $this->assertSame('website', $this->sentEvents()[0]['action_source']);
    }

    public function test_the_doctor_lists_an_order_that_still_owes_an_event(): void
    {
        $this->facebookRejects = true;

        $order = $this->order(['status' => OrderStatus::Confirm]);

        $this->artisan('fb:doctor')
            ->expectsOutputToContain($order->order_number)
            ->expectsOutputToContain('Purchase')
            ->assertExitCode(0);

        $this->assertEmpty(array_filter((array) $order->fresh()->fb_events_sent));
    }

    /** @return array<int, array<string, mixed>> */
    private function sentPayloads(): array
    {
        return collect(Http::recorded())->map(fn ($pair) => $pair[0]->data())->all();
    }
}
