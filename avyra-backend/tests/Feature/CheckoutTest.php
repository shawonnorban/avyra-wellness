<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\BlockedPhone;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderRiskScore;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\SettingSeeder::class);
    }

    private function product(array $overrides = []): Product
    {
        return Product::create(array_merge([
            'sku' => 'TEST-1',
            'slug' => 'test-product',
            'name' => 'Test Product',
            'quantity' => 100,
            'min_stock' => 5,
            'cost_price' => 500,
            'sell_price' => 1000,
            'is_active' => true,
        ], $overrides));
    }

    private function payload(Product $product, array $overrides = []): array
    {
        return array_merge([
            'customer_name' => 'Rahim Uddin',
            'phone' => '01711223344',
            'address' => 'House 12, Road 5, Dhanmondi, Dhaka',
            'delivery_zone' => 'inside_dhaka',
            'payment_method' => 'COD',
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ], $overrides);
    }

    public function test_it_creates_an_order_and_prices_it_server_side(): void
    {
        $product = $this->product();

        $response = $this->postJson('/api/storefront/checkout', $this->payload($product));

        $response->assertCreated();

        $order = Order::first();
        $this->assertSame(2000.0, (float) $order->subtotal);
        $this->assertSame(70.0, (float) $order->delivery_charge);   // inside-Dhaka default
        $this->assertSame(2070.0, (float) $order->total);
        $this->assertSame(OrderStatus::Pending, $order->status);
        $this->assertSame('01711223344', $order->phone);
    }

    public function test_it_ignores_prices_supplied_by_the_client(): void
    {
        $product = $this->product();

        $payload = $this->payload($product);
        $payload['items'][0]['unit_price'] = 1;    // attacker-supplied
        $payload['total'] = 1;

        $this->postJson('/api/storefront/checkout', $payload)->assertCreated();

        $this->assertSame(2000.0, (float) Order::first()->subtotal);
    }

    public function test_it_deducts_stock_and_writes_a_movement(): void
    {
        $product = $this->product();

        $this->postJson('/api/storefront/checkout', $this->payload($product))->assertCreated();

        $this->assertSame(98, $product->fresh()->quantity);
        $this->assertDatabaseHas('product_stock_movements', [
            'product_id' => $product->id,
            'movement_type' => 'OUT',
            'change_qty' => -2,
        ]);
    }

    public function test_it_applies_a_valid_coupon(): void
    {
        $product = $this->product();

        Coupon::create([
            'code' => 'SAVE10',
            'discount_type' => 'percent',
            'discount_value' => 10,
            'min_order_total' => 1000,
            'is_active' => true,
        ]);

        $this->postJson('/api/storefront/checkout', $this->payload($product, ['coupon_code' => 'SAVE10']))
            ->assertCreated();

        $order = Order::first();
        $this->assertSame(200.0, (float) $order->discount);
        $this->assertSame(1870.0, (float) $order->total);
        $this->assertSame(1, Coupon::first()->current_usage);
    }

    public function test_it_caps_a_percent_coupon_at_max_discount(): void
    {
        $product = $this->product();

        Coupon::create([
            'code' => 'BIG',
            'discount_type' => 'percent',
            'discount_value' => 50,
            'max_discount' => 300,
            'is_active' => true,
        ]);

        $this->postJson('/api/storefront/checkout', $this->payload($product, ['coupon_code' => 'BIG']))
            ->assertCreated();

        $this->assertSame(300.0, (float) Order::first()->discount);
    }

    public function test_it_blocks_a_blocklisted_phone_and_creates_no_order(): void
    {
        $product = $this->product();
        BlockedPhone::create(['phone' => '01711223344', 'reason' => 'Known fraud', 'is_active' => true]);

        $this->postJson('/api/storefront/checkout', $this->payload($product))
            ->assertStatus(422)
            ->assertJsonPath('code', 'order_blocked');

        $this->assertSame(0, Order::count());
        $this->assertSame('blocked', OrderRiskScore::first()->action_taken);
        $this->assertSame(100, Order::count() + $product->fresh()->quantity); // stock untouched
    }

    public function test_it_blocks_a_repeat_order_from_the_same_phone_inside_the_window(): void
    {
        $product = $this->product();

        $this->postJson('/api/storefront/checkout', $this->payload($product))->assertCreated();

        $this->postJson('/api/storefront/checkout', $this->payload($product))
            ->assertStatus(422)
            ->assertJsonPath('code', 'order_blocked');

        $this->assertSame(1, Order::count());
    }

    public function test_a_whitelisted_customer_bypasses_the_phone_repeat_block(): void
    {
        $product = $this->product();

        $this->postJson('/api/storefront/checkout', $this->payload($product))->assertCreated();

        \App\Models\CustomerRiskProfile::create([
            'phone' => '01711223344',
            'is_whitelisted' => true,
        ]);

        $this->postJson('/api/storefront/checkout', $this->payload($product))->assertCreated();

        $this->assertSame(2, Order::count());
    }

    public function test_fraud_checks_are_skipped_when_protection_is_disabled(): void
    {
        $product = $this->product();
        BlockedPhone::create(['phone' => '01711223344', 'is_active' => true]);

        $config = Setting::get('fraud_detection');
        $config['enabled'] = false;
        Setting::put('fraud_detection', $config);

        $this->postJson('/api/storefront/checkout', $this->payload($product))->assertCreated();
    }

    public function test_it_requires_otp_when_the_setting_is_on(): void
    {
        $product = $this->product();
        Setting::put('order', ['require_otp' => true, 'auto_confirm' => false]);

        $this->postJson('/api/storefront/checkout', $this->payload($product))
            ->assertStatus(422)
            ->assertJsonPath('code', 'otp_required');

        $this->assertSame(0, Order::count());
    }

    public function test_order_numbers_are_sequential_per_day(): void
    {
        $product = $this->product();

        // Both requests share the test client's IP, which the repeat-IP rule would
        // otherwise block. This test is about numbering, so take fraud out of it.
        $config = Setting::get('fraud_detection');
        $config['enabled'] = false;
        Setting::put('fraud_detection', $config);

        $this->postJson('/api/storefront/checkout', $this->payload($product))->assertCreated();
        $this->postJson('/api/storefront/checkout', $this->payload($product, ['phone' => '01822334455']))
            ->assertCreated();

        $numbers = Order::orderBy('order_number')->pluck('order_number')->all();
        $prefix = 'AVY-' . now()->format('Ymd');

        $this->assertSame(["{$prefix}-0001", "{$prefix}-0002"], $numbers);
    }

    /**
     * Email was only captured when the customer record was created, so a repeat
     * buyer offering one for the first time lost it — and it is the strongest
     * signal Meta can match a conversion on after the phone number.
     */
    public function test_a_returning_customer_can_still_supply_an_email(): void
    {
        $product = $this->product();
        $this->disableFraudChecks();

        $this->postJson('/api/storefront/checkout', $this->payload($product))->assertCreated();
        $this->assertNull(Customer::where('phone', '01711223344')->value('email'));

        $this->postJson('/api/storefront/checkout', $this->payload($product, [
            'email' => 'rahim@example.com',
        ]))->assertCreated();

        $this->assertSame('rahim@example.com', Customer::where('phone', '01711223344')->value('email'));
    }

    /** Leaving the optional field blank must not wipe an address already on file. */
    public function test_an_omitted_email_does_not_erase_the_stored_one(): void
    {
        $product = $this->product();
        $this->disableFraudChecks();

        $this->postJson('/api/storefront/checkout', $this->payload($product, [
            'email' => 'rahim@example.com',
        ]))->assertCreated();

        $this->postJson('/api/storefront/checkout', $this->payload($product))->assertCreated();

        $this->assertSame('rahim@example.com', Customer::where('phone', '01711223344')->value('email'));
    }

    /**
     * Two orders from one phone are a repeat-order block by design. These tests
     * are about what the second order stores, not about the fraud gate.
     */
    private function disableFraudChecks(): void
    {
        $config = Setting::get('fraud_detection');
        $config['enabled'] = false;
        Setting::put('fraud_detection', $config);
    }
}
