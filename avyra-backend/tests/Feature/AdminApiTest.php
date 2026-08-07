<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Models\CampaignVisit;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\SettingSeeder::class);
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
    }

    private function userWithRole(Role $role): User
    {
        $user = User::create([
            'name' => ucfirst($role->value),
            'email' => $role->value . '@test.com',
            'password' => 'secret',
        ]);

        UserRole::create(['user_id' => $user->id, 'role' => $role]);

        return $user->load('roles');
    }

    private function product(): Product
    {
        return Product::create([
            'sku' => 'ADM-1',
            'name' => 'Admin Test Product',
            'quantity' => 50,
            'cost_price' => 400,
            'sell_price' => 900,
            'is_active' => true,
        ]);
    }

    private function orderWithItem(Product $product, int $qty = 3): Order
    {
        $order = Order::create([
            'customer_name' => 'Karim',
            'phone' => '01700000000',
            'address' => 'Mirpur, Dhaka',
            'status' => OrderStatus::Confirm,
            'payment_method' => 'COD',
            'items_count' => $qty,
            'subtotal' => 900 * $qty,
            'total' => 900 * $qty,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'quantity' => $qty,
            'unit_price' => 900,
        ]);

        return $order;
    }

    public function test_admin_routes_reject_guests(): void
    {
        $this->getJson('/api/admin/orders')->assertUnauthorized();
        $this->getJson('/api/admin/dashboard')->assertUnauthorized();
    }

    public function test_a_plain_user_cannot_reach_admin_routes(): void
    {
        $this->actingAs($this->userWithRole(Role::User))
            ->getJson('/api/admin/orders')
            ->assertForbidden();
    }

    public function test_an_employee_can_list_but_not_delete_orders(): void
    {
        $employee = $this->userWithRole(Role::Employee);
        $order = $this->orderWithItem($this->product());

        $this->actingAs($employee)->getJson('/api/admin/orders')->assertOk();

        $this->actingAs($employee)
            ->deleteJson("/api/admin/orders/{$order->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('orders', ['id' => $order->id]);
    }

    public function test_a_manager_can_delete_an_order(): void
    {
        $order = $this->orderWithItem($this->product());

        $this->actingAs($this->userWithRole(Role::Manager))
            ->deleteJson("/api/admin/orders/{$order->id}")
            ->assertOk();

        $this->assertDatabaseMissing('orders', ['id' => $order->id]);
    }

    public function test_only_an_admin_can_read_settings(): void
    {
        $this->actingAs($this->userWithRole(Role::Manager))
            ->getJson('/api/admin/settings')
            ->assertForbidden();

        $this->actingAs($this->userWithRole(Role::Admin))
            ->getJson('/api/admin/settings')
            ->assertOk();
    }

    public function test_settings_responses_mask_courier_credentials(): void
    {
        $admin = $this->userWithRole(Role::Admin);

        $this->actingAs($admin)->putJson('/api/admin/settings/courier_steadfast', [
            'value' => [
                'enabled' => true,
                'base_url' => 'https://portal.packzy.com/api/v1',
                'api_key' => 'real-api-key',
                'secret_key' => 'real-secret',
                'webhook_token' => 'hook-token',
                'auto_sync' => true,
            ],
        ])->assertOk()->assertJsonPath('data.api_key', '********');

        // Saving the form again with the mask must not wipe the stored key.
        $this->actingAs($admin)->putJson('/api/admin/settings/courier_steadfast', [
            'value' => [
                'enabled' => false,
                'base_url' => 'https://portal.packzy.com/api/v1',
                'api_key' => '********',
                'secret_key' => '********',
                'webhook_token' => '********',
                'auto_sync' => true,
            ],
        ])->assertOk();

        $stored = \App\Models\Setting::where('key', 'courier_steadfast')->first()->value;
        $this->assertSame('real-api-key', $stored['api_key']);
        $this->assertFalse($stored['enabled']);
    }

    public function test_the_public_settings_endpoint_never_exposes_credentials(): void
    {
        $response = $this->getJson('/api/storefront/settings')->assertOk();

        $keys = array_keys($response->json('data'));

        $this->assertContains('company', $keys);
        $this->assertContains('delivery', $keys);
        $this->assertNotContains('courier_steadfast', $keys);
        $this->assertNotContains('sms', $keys);
        $this->assertNotContains('meta_capi', $keys);
        $this->assertNotContains('fraud_detection', $keys);
    }

    public function test_cancelling_an_order_returns_the_stock(): void
    {
        $product = $this->product();
        $order = $this->orderWithItem($product, 3);

        $this->actingAs($this->userWithRole(Role::Manager))
            ->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'cancel'])
            ->assertOk();

        $this->assertSame(53, $product->fresh()->quantity);
        $this->assertDatabaseHas('product_stock_movements', [
            'product_id' => $product->id,
            'change_qty' => 3,
            'reference_type' => 'order_return',
        ]);
    }

    public function test_cancelling_twice_does_not_return_the_stock_twice(): void
    {
        $product = $this->product();
        $order = $this->orderWithItem($product, 3);
        $manager = $this->userWithRole(Role::Manager);

        $this->actingAs($manager)
            ->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'cancel'])
            ->assertOk();

        $this->actingAs($manager)
            ->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'cancel'])
            ->assertOk();

        $this->assertSame(53, $product->fresh()->quantity);
    }

    public function test_a_stock_adjustment_writes_a_movement(): void
    {
        $product = $this->product();

        $this->actingAs($this->userWithRole(Role::Manager))
            ->postJson("/api/admin/products/{$product->id}/adjust-stock", [
                'change_qty' => -5,
                'notes' => 'Damaged in storage',
            ])
            ->assertOk();

        $this->assertSame(45, $product->fresh()->quantity);
        $this->assertDatabaseHas('product_stock_movements', [
            'product_id' => $product->id,
            'movement_type' => 'ADJUST',
            'change_qty' => -5,
        ]);
    }

    public function test_creating_a_product_records_the_opening_stock_as_a_movement(): void
    {
        $this->actingAs($this->userWithRole(Role::Manager))
            ->postJson('/api/admin/products', [
                'sku' => 'NEW-1',
                'name' => 'New Product',
                'quantity' => 30,
                'sell_price' => 500,
            ])
            ->assertCreated();

        $product = Product::where('sku', 'NEW-1')->first();

        $this->assertSame(30, $product->quantity);
        $this->assertDatabaseHas('product_stock_movements', [
            'product_id' => $product->id,
            'reference_type' => 'opening_balance',
            'change_qty' => 30,
        ]);
    }

    public function test_dashboard_returns_status_counts(): void
    {
        $this->orderWithItem($this->product());

        $this->actingAs($this->userWithRole(Role::Manager))
            ->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.orders.confirmed', 1)
            ->assertJsonPath('data.orders.total', 1);
    }

    public function test_orders_can_be_exported_as_csv(): void
    {
        $this->orderWithItem($this->product());

        $response = $this->actingAs($this->userWithRole(Role::Manager))
            ->get('/api/admin/orders/export');

        $response->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
    }
public function test_notifications_list_carries_the_unread_count(): void
    {
        Notification::create([
            'type' => 'order', 'title' => 'New order received',
            'message' => 'AVY-1', 'link' => '/admin/orders', 'is_read' => false,
        ]);
        Notification::create([
            'type' => 'courier', 'title' => 'Order returned',
            'message' => 'AVY-2', 'link' => null, 'is_read' => true,
        ]);

        // The paginator is an object, so building this payload with `+` used to
        // throw a TypeError and the endpoint 500'd — the badge never had a number.
        $this->actingAs($this->userWithRole(Role::Employee))
            ->getJson('/api/admin/notifications')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('unread_count', 1);
    }

    public function test_marking_all_read_clears_the_unread_count(): void
    {
        Notification::create([
            'type' => 'order', 'title' => 'New order received',
            'message' => 'AVY-1', 'link' => null, 'is_read' => false,
        ]);

        // One user for both calls — the helper creates a row, so calling it twice
        // collides on the unique email.
        $staff = $this->userWithRole(Role::Employee);

        $this->actingAs($staff)
            ->postJson('/api/admin/notifications/read-all')
            ->assertOk();

        $this->actingAs($staff)
            ->getJson('/api/admin/notifications')
            ->assertJsonPath('unread_count', 0);
    }
public function test_a_visit_is_recorded_with_the_device_parsed_from_the_user_agent(): void
    {
        $this->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
        ])->postJson('/api/storefront/visits', [
            'path' => '/avyravitalplus',
            'utm_source' => 'facebook',
        ])->assertCreated();

        $visit = CampaignVisit::firstOrFail();

        $this->assertSame('/avyravitalplus', $visit->path);
        $this->assertSame('facebook', $visit->utm_source);
        // Parsed once on write, so reports never scan the raw string.
        $this->assertSame('Mobile', $visit->device);
        $this->assertSame('iOS', $visit->os);
        $this->assertSame('Safari', $visit->browser);
    }

    public function test_admin_paths_are_never_counted_as_site_traffic(): void
    {
        $this->postJson('/api/storefront/visits', ['path' => '/admin/orders'])->assertOk();

        $this->assertSame(0, CampaignVisit::count());
    }

    public function test_analytics_aggregates_visits_without_returning_rows(): void
    {
        CampaignVisit::create([
            'event_type' => 'pageview', 'path' => '/', 'utm_source' => 'facebook',
            'device' => 'Mobile', 'browser' => 'Chrome', 'os' => 'Android',
        ]);
        CampaignVisit::create([
            'event_type' => 'pageview', 'path' => '/shop',
            'device' => 'Desktop', 'browser' => 'Chrome', 'os' => 'Windows',
        ]);

        $response = $this->actingAs($this->userWithRole(Role::Manager))
            ->getJson('/api/admin/analytics?days=30')
            ->assertOk();

        $response->assertJsonPath('summary.visits', 2);
        $response->assertJsonPath('summary.total', 2);

        // Zero-filled, so a gap reads as a flat line rather than a missing day.
        $this->assertCount(30, $response->json('daily'));
        $this->assertCount(24, $response->json('hourly'));

        // A visit with no utm_source is "Direct", not a blank row.
        $sources = collect($response->json('breakdowns.source'))->pluck('visits', 'label');
        $this->assertSame(1, $sources['facebook']);
        $this->assertSame(1, $sources['Direct']);
    }
}
