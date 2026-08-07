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

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.facebook.pixel_id' => '1234567890',
            'services.facebook.access_token' => 'test-token',
            'services.facebook.api_version' => 'v20.0',
            'services.facebook.test_event_code' => null,
        ]);

        Http::fake(fn () => $this->facebookRejects
            ? Http::response(['error' => 'bad token'], 401)
            : Http::response(['events_received' => 1]));
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
        $this->assertTrue($order->fresh()->fb_events_sent['lead']);
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

        // Only the money events carry a value; one on Lead would count the same
        // order's revenue at two stages of the funnel.
        $this->assertArrayNotHasKey('value', $events[0]['custom_data']);
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

        $this->assertSame(FbEventLog::STATUS_SUCCESS, $log->status);
        $this->assertSame(2, $log->attempt_count);
        $this->assertTrue($order->fresh()->fb_events_sent['lead']);
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

        // No value on Lead — the browser must not claim revenue the server does not.
        $this->assertArrayNotHasKey('value', $payload);
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
