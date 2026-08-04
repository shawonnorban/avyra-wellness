<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Models\CourierConsignment;
use App\Models\CustomerRiskProfile;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CourierTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\SettingSeeder::class);
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        Setting::put('courier_steadfast', [
            'enabled' => true,
            'base_url' => 'https://portal.packzy.com/api/v1',
            'api_key' => 'test-key',
            'secret_key' => 'test-secret',
            'webhook_token' => 'hook-secret',
            'auto_sync' => true,
        ]);
    }

    private function manager(): User
    {
        $user = User::create(['name' => 'Manager', 'email' => 'm@test.com', 'password' => 'secret']);
        UserRole::create(['user_id' => $user->id, 'role' => Role::Manager]);

        return $user->load('roles');
    }

    private function confirmedOrder(int $qty = 2): Order
    {
        $product = Product::create([
            'sku' => 'CUR-1',
            'name' => 'Courier Test Product',
            'quantity' => 100,
            'cost_price' => 300,
            'sell_price' => 800,
            'is_active' => true,
        ]);

        $order = Order::create([
            'customer_name' => 'Salma',
            'phone' => '01812345678',
            'address' => 'Uttara Sector 7, Dhaka',
            'status' => OrderStatus::Confirm,
            'payment_method' => 'COD',
            'items_count' => $qty,
            'subtotal' => 800 * $qty,
            'total' => 800 * $qty,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'quantity' => $qty,
            'unit_price' => 800,
        ]);

        return $order;
    }

    public function test_dispatching_an_order_creates_a_consignment_and_moves_it_to_in_courier(): void
    {
        Http::fake([
            '*/create_order' => Http::response([
                'status' => 200,
                'consignment' => [
                    'consignment_id' => 123456,
                    'tracking_code' => 'ABC123',
                    'status' => 'in_review',
                ],
            ]),
        ]);

        $order = $this->confirmedOrder();

        $this->actingAs($this->manager())
            ->postJson("/api/admin/courier/orders/{$order->id}/dispatch")
            ->assertCreated()
            ->assertJsonPath('data.tracking_code', 'ABC123');

        // Dispatch is recorded on the consignment; the order stays confirmed
        // until the parcel settles.
        $this->assertSame(OrderStatus::Confirm, $order->fresh()->status);

        $consignment = CourierConsignment::first();
        $this->assertSame('123456', $consignment->consignment_id);
        $this->assertSame(1600.0, (float) $consignment->cod_amount);  // COD = order total
        $this->assertDatabaseHas('courier_status_logs', ['consignment_id' => $consignment->id]);
    }

    public function test_an_unconfirmed_order_cannot_be_dispatched(): void
    {
        Http::fake();

        $order = $this->confirmedOrder();
        $order->update(['status' => OrderStatus::Pending]);

        $this->actingAs($this->manager())
            ->postJson("/api/admin/courier/orders/{$order->id}/dispatch")
            ->assertStatus(422);

        $this->assertSame(0, CourierConsignment::count());
        Http::assertNothingSent();
    }

    public function test_an_order_cannot_be_dispatched_twice(): void
    {
        Http::fake([
            '*/create_order' => Http::response([
                'consignment' => ['consignment_id' => 1, 'tracking_code' => 'T1', 'status' => 'pending'],
            ]),
        ]);

        $order = $this->confirmedOrder();
        $manager = $this->manager();

        $this->actingAs($manager)->postJson("/api/admin/courier/orders/{$order->id}/dispatch")->assertCreated();
        $this->actingAs($manager)->postJson("/api/admin/courier/orders/{$order->id}/dispatch")->assertStatus(422);

        $this->assertSame(1, CourierConsignment::count());
    }

    public function test_the_webhook_rejects_a_bad_token(): void
    {
        $this->postJson('/api/webhooks/courier/steadfast', [
            'consignment_id' => 1,
            'status' => 'delivered',
        ], ['Authorization' => 'Bearer wrong'])->assertUnauthorized();
    }

    public function test_the_webhook_marks_an_order_delivered(): void
    {
        Http::fake([
            '*/create_order' => Http::response([
                'consignment' => ['consignment_id' => 999, 'tracking_code' => 'T9', 'status' => 'pending'],
            ]),
        ]);

        $order = $this->confirmedOrder();
        $this->actingAs($this->manager())->postJson("/api/admin/courier/orders/{$order->id}/dispatch");

        $this->postJson('/api/webhooks/courier/steadfast', [
            'consignment_id' => 999,
            'status' => 'delivered',
        ], ['Authorization' => 'Bearer hook-secret'])->assertOk();

        $this->assertSame(OrderStatus::Delivered, $order->fresh()->status);
        $this->assertNotNull(CourierConsignment::first()->delivered_at);

        // The buyer's risk profile must reflect the successful delivery.
        $profile = CustomerRiskProfile::where('phone', '01812345678')->first();
        $this->assertSame(1, $profile->delivered);
        $this->assertSame(0.0, (float) $profile->failure_rate);
    }

    public function test_a_returned_webhook_restores_stock_exactly_once(): void
    {
        Http::fake([
            '*/create_order' => Http::response([
                'consignment' => ['consignment_id' => 555, 'tracking_code' => 'T5', 'status' => 'pending'],
            ]),
        ]);

        $order = $this->confirmedOrder(2);
        $product = Product::first();
        $this->actingAs($this->manager())->postJson("/api/admin/courier/orders/{$order->id}/dispatch");

        $before = $product->fresh()->quantity;

        $headers = ['Authorization' => 'Bearer hook-secret'];
        $this->postJson('/api/webhooks/courier/steadfast', ['consignment_id' => 555, 'status' => 'returned'], $headers)->assertOk();
        // A duplicate delivery of the same status must be a no-op.
        $this->postJson('/api/webhooks/courier/steadfast', ['consignment_id' => 555, 'status' => 'returned'], $headers)->assertOk();

        $this->assertSame($before + 2, $product->fresh()->quantity);
        $this->assertSame(1, \App\Models\CourierReturn::count());
        // A returned parcel leaves the order cancelled; the return itself stays
        // on the consignment, which is what guards the stock restore.
        $this->assertSame(OrderStatus::Cancel, $order->fresh()->status);
    }

    public function test_the_webhook_answers_ok_for_an_unknown_consignment(): void
    {
        $this->postJson('/api/webhooks/courier/steadfast', [
            'consignment_id' => 404404,
            'status' => 'delivered',
        ], ['Authorization' => 'Bearer hook-secret'])
            ->assertOk()
            ->assertJsonPath('message', 'No matching consignment.');
    }

    public function test_the_sync_command_skips_settled_consignments(): void
    {
        Http::fake([
            '*/create_order' => Http::response([
                'consignment' => ['consignment_id' => 777, 'tracking_code' => 'T7', 'status' => 'pending'],
            ]),
            '*/status_by_cid/*' => Http::response(['delivery_status' => 'delivered']),
        ]);

        $order = $this->confirmedOrder();
        $this->actingAs($this->manager())->postJson("/api/admin/courier/orders/{$order->id}/dispatch");

        $this->artisan('courier:sync')->assertSuccessful();
        $this->assertSame(OrderStatus::Delivered, $order->fresh()->status);

        // Second run: the consignment is delivered, so it is no longer trackable.
        Http::fake(['*/status_by_cid/*' => Http::response(['delivery_status' => 'delivered'])]);
        $this->artisan('courier:sync')->assertSuccessful();
        Http::assertNothingSent();
    }

    public function test_the_sync_command_does_nothing_when_auto_sync_is_off(): void
    {
        Http::fake();

        $config = Setting::get('courier_steadfast');
        $config['auto_sync'] = false;
        Setting::put('courier_steadfast', $config);

        $this->artisan('courier:sync')->assertSuccessful();
        Http::assertNothingSent();
    }
}
