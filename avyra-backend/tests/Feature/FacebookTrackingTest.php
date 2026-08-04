<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\FbEventLog;
use App\Models\Order;
use App\Models\Product;
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

    public function test_a_new_order_sends_initiate_checkout(): void
    {
        $order = $this->order();

        $events = $this->sentEvents();

        $this->assertCount(1, $events);
        $this->assertSame('InitiateCheckout', $events[0]['event_name']);
        $this->assertTrue($order->fresh()->fb_events_sent['initiateCheckout']);
    }

    public function test_confirming_sends_lead_and_delivering_sends_purchase_with_the_value(): void
    {
        $order = $this->order();

        $order->update(['status' => OrderStatus::Confirm]);
        $order->update(['status' => OrderStatus::Delivered]);

        $events = $this->sentEvents();
        $names = array_column($events, 'event_name');

        $this->assertSame(['InitiateCheckout', 'Lead', 'Purchase'], $names);

        // Only Purchase carries money; a value on Lead would double-count revenue.
        $this->assertArrayNotHasKey('value', $events[1]['custom_data']);
        $this->assertSame(1500.0, $events[2]['custom_data']['value']);
        $this->assertSame('BDT', $events[2]['custom_data']['currency']);
    }

    public function test_hold_fake_and_cancel_send_nothing(): void
    {
        // Created straight into `hold` so the InitiateCheckout of a normal
        // checkout does not muddy the count.
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

    public function test_the_event_id_lets_facebook_deduplicate_against_the_pixel(): void
    {
        $order = $this->order();

        $this->assertSame(
            "{$order->order_number}-InitiateCheckout",
            $this->sentEvents()[0]['event_id'],
        );
    }

    public function test_a_failed_call_is_logged_and_the_flag_is_not_set(): void
    {
        $this->facebookRejects = true;

        $order = $this->order();

        $log = FbEventLog::where('order_id', $order->id)->firstOrFail();

        $this->assertSame('InitiateCheckout', $log->event_name);
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
        $this->assertTrue($order->fresh()->fb_events_sent['initiateCheckout']);
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
}
