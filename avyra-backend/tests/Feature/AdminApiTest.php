<?php

namespace Tests\Feature;

use App\Enums\OrderSource;
use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Models\CampaignVisit;
use App\Models\CourierConsignment;
use App\Models\CourierReturn;
use App\Models\Customer;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\PurchaseItem;
use App\Models\Supplier;
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

    /**
     * `orders.customer_id` has no `onDelete`, so the database would refuse this
     * with a foreign-key error — a 500 where the operator needs a reason. The
     * controller checks first; this pins that it keeps doing so, now that the
     * admin has a delete button pointed at it.
     */
    public function test_a_customer_with_orders_cannot_be_deleted(): void
    {
        $order = $this->orderWithItem($this->product());
        $customer = Customer::create([
            'code' => 'CUS-TEST01',
            'name' => 'Has Orders',
            'type' => 'Guest',
            'phone' => '01711111111',
        ]);
        $order->forceFill(['customer_id' => $customer->id])->save();

        $this->actingAs($this->userWithRole(Role::Manager))
            ->deleteJson("/api/admin/customers/{$customer->id}")
            ->assertStatus(422)
            ->assertJsonPath('message', 'This customer has orders and cannot be deleted.');

        $this->assertDatabaseHas('customers', ['id' => $customer->id]);
    }

    public function test_a_customer_without_orders_can_be_deleted(): void
    {
        $customer = Customer::create([
            'code' => 'CUS-TEST02',
            'name' => 'No Orders',
            'type' => 'Guest',
            'phone' => '01722222222',
        ]);

        $this->actingAs($this->userWithRole(Role::Manager))
            ->deleteJson("/api/admin/customers/{$customer->id}")
            ->assertOk();

        $this->assertDatabaseMissing('customers', ['id' => $customer->id]);
    }

    /**
     * Sales & Orders is a work queue — confirm, dispatch, chase. A counter sale
     * has none of that, and mixing them in makes the courier and delivery
     * figures beside them meaningless.
     */
    public function test_shop_sales_are_hidden_from_the_orders_list(): void
    {
        $product = $this->product();
        $online = $this->orderWithItem($product);
        $shop = $this->orderWithItem($product);
        $shop->forceFill(['order_source' => OrderSource::Shop->value])->save();

        $manager = $this->userWithRole(Role::Manager);

        $numbers = $this->actingAs($manager)->getJson('/api/admin/orders')
            ->assertOk()->json('data.*.order_number');

        $this->assertSame([$online->order_number], $numbers);

        // Its own panel asks for them by name, which is how it is served without
        // a second endpoint.
        $shopNumbers = $this->actingAs($manager)->getJson('/api/admin/orders?source=Shop')
            ->assertOk()->json('data.*.order_number');

        $this->assertSame([$shop->order_number], $shopNumbers);
    }

    /** The tabs filter that list, so they have to count the same rows it shows. */
    public function test_status_counts_follow_the_list_they_filter(): void
    {
        $product = $this->product();
        $this->orderWithItem($product);
        $shop = $this->orderWithItem($product);
        $shop->forceFill(['order_source' => OrderSource::Shop->value])->save();

        $manager = $this->userWithRole(Role::Manager);

        $this->assertSame(1, $this->actingAs($manager)
            ->getJson('/api/admin/orders/status-counts')->json('data.total'));

        $this->assertSame(1, $this->actingAs($manager)
            ->getJson('/api/admin/orders/status-counts?source=Shop')->json('data.total'));
    }

    public function test_a_staff_member_can_record_a_shop_sale(): void
    {
        $product = $this->product();

        $this->actingAs($this->userWithRole(Role::Manager))
            ->postJson('/api/admin/orders', [
                'customer_name' => 'Walk In',
                'phone' => '01733333333',
                'address' => 'Counter',
                'payment_method' => 'Cash',
                'order_source' => OrderSource::Shop->value,
                'items' => [['product_id' => $product->id, 'quantity' => 1]],
            ])
            ->assertCreated()
            ->assertJsonPath('data.order_source', OrderSource::Shop->value);
    }

    /** Only the two a human can pick; the rest belong to the checkout. */
    public function test_a_staff_entered_order_cannot_pose_as_a_website_order(): void
    {
        $product = $this->product();

        $this->actingAs($this->userWithRole(Role::Manager))
            ->postJson('/api/admin/orders', [
                'customer_name' => 'Faker',
                'phone' => '01744444444',
                'address' => 'Nowhere',
                'payment_method' => 'Cash',
                'order_source' => 'Website',
                'items' => [['product_id' => $product->id, 'quantity' => 1]],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('order_source');
    }

    /**
     * The cap has to match the gallery field's `max` in the admin settings form.
     * When they drift, the form happily accepts a slide the save then rejects,
     * and the operator sees a 422 with no idea which image caused it.
     */
    public function test_the_campaign_slider_accepts_fifty_slides_and_no_more(): void
    {
        $admin = $this->userWithRole(Role::Admin);
        $paths = fn (int $n) => array_map(fn (int $i) => "landing/slide-{$i}.webp", range(1, $n));

        // Fifty is within the cap, so the array-size rule stays quiet. The paths
        // are not registered uploads, so each one still fails on its own — which
        // is what proves the size rule is not what rejected them.
        $this->actingAs($admin)
            ->putJson('/api/admin/settings/campaign_slider', ['value' => ['images' => $paths(50)]])
            ->assertStatus(422)
            ->assertJsonMissingValidationErrors('value.images')
            ->assertJsonValidationErrors('value.images.0');

        $this->actingAs($admin)
            ->putJson('/api/admin/settings/campaign_slider', ['value' => ['images' => $paths(51)]])
            ->assertStatus(422)
            ->assertJsonValidationErrors('value.images');
    }

    /**
     * Hold, fake and cancel are judgements about the customer, and the remark is
     * the part of them that cannot be reconstructed later. The admin now insists
     * on one, so the round trip has to hold it.
     */
    public function test_a_status_change_stores_and_returns_its_remark(): void
    {
        $order = $this->orderWithItem($this->product());
        $manager = $this->userWithRole(Role::Manager);

        $this->actingAs($manager)
            ->patchJson("/api/admin/orders/{$order->id}/status", [
                'status' => OrderStatus::Hold->value,
                'reason' => 'ফোন নম্বর ভুল',
            ])
            ->assertOk()
            ->assertJsonPath('data.status_reason', 'ফোন নম্বর ভুল');

        // Cleared when the order moves on: a stale "wrong phone number" beside a
        // confirmed order is worse than none.
        $this->actingAs($manager)
            ->patchJson("/api/admin/orders/{$order->id}/status", [
                'status' => OrderStatus::Confirm->value,
            ])
            ->assertOk()
            ->assertJsonPath('data.status_reason', null);
    }

    /**
     * The hazard a seventh status introduces: CourierService::handleReturn()
     * already puts the goods back and settles the order as `return`, so a staff
     * member confirming what the courier recorded would credit the shelf twice.
     */
    public function test_marking_return_does_not_restore_stock_the_courier_already_did(): void
    {
        $product = $this->product();   // starts at 50
        $order = $this->orderWithItem($product, 5);

        // What the courier leaves behind: the goods already back on the shelf.
        $consignment = CourierConsignment::create([
            'order_id' => $order->id,
            'courier' => 'steadfast',
            'status' => 'Returned',
        ]);
        CourierReturn::create([
            'consignment_id' => $consignment->id,
            'order_id' => $order->id,
            'return_date' => now()->toDateString(),
            'stock_restored' => true,
        ]);
        $product->update(['quantity' => 55]);   // as the courier left it

        $this->actingAs($this->userWithRole(Role::Manager))
            ->patchJson("/api/admin/orders/{$order->id}/status", [
                'status' => OrderStatus::Return->value,
                'reason' => 'Courier brought it back',
            ])
            ->assertOk();

        $this->assertSame(55, $product->fresh()->quantity);
    }

    /** With no courier return on file, the goods do come back. */
    public function test_marking_return_restores_stock_when_nothing_else_has(): void
    {
        $product = $this->product();   // starts at 50
        $order = $this->orderWithItem($product, 5);

        $this->actingAs($this->userWithRole(Role::Manager))
            ->patchJson("/api/admin/orders/{$order->id}/status", [
                'status' => OrderStatus::Return->value,
                'reason' => 'Brought back to the counter',
            ])
            ->assertOk();

        $this->assertSame(55, $product->fresh()->quantity);
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
public function test_stock_report_values_each_variant_and_counts_units_sold(): void
    {
        $product = $this->product();

        $small = $product->variants()->create([
            'sku_suffix' => '250G', 'size' => '250gm', 'quantity' => 10,
            'cost_price' => 500, 'sell_price' => 900, 'is_active' => true,
        ]);
        $product->variants()->create([
            'sku_suffix' => '500G', 'size' => '500gm', 'quantity' => 4,
            'cost_price' => 900, 'sell_price' => 1500, 'is_active' => true,
        ]);

        // One sold on a confirmed order, three on a cancelled one — only the
        // first should count.
        $sold = Order::create([
            'customer_name' => 'A', 'phone' => '01700000001', 'address' => 'Dhaka',
            'status' => OrderStatus::Delivered, 'total' => 900,
        ]);
        OrderItem::create([
            'order_id' => $sold->id, 'product_id' => $product->id, 'variant_id' => $small->id,
            'product_name' => $product->name, 'quantity' => 2, 'unit_price' => 900,
        ]);

        $void = Order::create([
            'customer_name' => 'B', 'phone' => '01700000002', 'address' => 'Dhaka',
            'status' => OrderStatus::Cancel, 'total' => 900,
        ]);
        OrderItem::create([
            'order_id' => $void->id, 'product_id' => $product->id, 'variant_id' => $small->id,
            'product_name' => $product->name, 'quantity' => 3, 'unit_price' => 900,
        ]);

        $response = $this->actingAs($this->userWithRole(Role::Manager))
            ->getJson('/api/admin/products/stock')
            ->assertOk();

        // 10*500 + 4*900 = 8600 at cost, 10*900 + 4*1500 = 15000 at retail.
        $response->assertJsonPath('summary.units', 14);
        $response->assertJsonPath('summary.cost_value', 8600);
        $response->assertJsonPath('summary.retail_value', 15000);
        $response->assertJsonPath('summary.potential_profit', 6400);

        // The cancelled order's three pieces are not sales.
        $response->assertJsonPath('summary.sold_units', 2);
    }

    public function test_the_stock_route_is_not_swallowed_by_the_product_id_route(): void
    {
        // "stock" would otherwise be read as a product id and 404.
        $this->actingAs($this->userWithRole(Role::Manager))
            ->getJson('/api/admin/products/stock')
            ->assertOk()
            ->assertJsonStructure(['data', 'summary']);
    }
public function test_pending_orders_do_not_count_as_sold(): void
    {
        $product = $this->product();

        $variant = $product->variants()->create([
            'sku_suffix' => '500G', 'size' => '500gm', 'quantity' => 20,
            'cost_price' => 900, 'sell_price' => 1500, 'is_active' => true,
        ]);

        foreach ([OrderStatus::Pending, OrderStatus::Hold, OrderStatus::Confirm, OrderStatus::Delivered] as $i => $status) {
            $order = Order::create([
                'customer_name' => 'Buyer ' . $i, 'phone' => '017000000' . $i,
                'address' => 'Dhaka', 'status' => $status, 'total' => 1500,
            ]);

            OrderItem::create([
                'order_id' => $order->id, 'product_id' => $product->id,
                'variant_id' => $variant->id, 'product_name' => $product->name,
                'quantity' => 1, 'unit_price' => 1500,
            ]);
        }

        $manager = $this->userWithRole(Role::Manager);

        // Only confirm + delivered. A pending order is a request, not a sale,
        // and hold is still undecided.
        $this->actingAs($manager)
            ->getJson('/api/admin/products/stock')
            ->assertOk()
            ->assertJsonPath('data.0.sold_count', 2)
            ->assertJsonPath('summary.sold_units', 2);

        // The product list must agree, or the two screens contradict each other.
        $this->actingAs($manager)
            ->getJson('/api/admin/products')
            ->assertOk()
            ->assertJsonPath('data.0.sold_count', 2);
    }

    public function test_stock_value_prices_each_variant_at_its_own_cost(): void
    {
        $product = $this->product();
        $product->update(['quantity' => 30, 'cost_price' => 900]);

        $product->variants()->create([
            'sku_suffix' => '500G', 'size' => '500gm', 'quantity' => 10,
            'cost_price' => 900, 'sell_price' => 1500, 'is_active' => true,
        ]);
        $product->variants()->create([
            'sku_suffix' => '250G', 'size' => '250gm', 'quantity' => 20,
            'cost_price' => 500, 'sell_price' => 900, 'is_active' => true,
        ]);

        $manager = $this->userWithRole(Role::Manager);

        // 10*900 + 20*500 = 19000. Valuing all 30 at the product's own 900 would
        // give 27000 — the bug this covers.
        $this->actingAs($manager)
            ->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.inventory.stock_value', 19000);

        // And the stock report has to reach the same number.
        $this->actingAs($manager)
            ->getJson('/api/admin/products/stock')
            ->assertOk()
            ->assertJsonPath('summary.cost_value', 19000);
    }
public function test_receiving_a_purchase_adds_stock_to_the_named_variant(): void
    {
        $product = $this->product();
        $product->update(['quantity' => 0]);

        $small = $product->variants()->create([
            'sku_suffix' => '250G', 'size' => '250gm', 'quantity' => 5,
            'cost_price' => 500, 'sell_price' => 900, 'is_active' => true,
        ]);
        $large = $product->variants()->create([
            'sku_suffix' => '500G', 'size' => '500gm', 'quantity' => 5,
            'cost_price' => 900, 'sell_price' => 1500, 'is_active' => true,
        ]);

        $supplier = Supplier::create(['code' => 'SUP-1', 'name' => 'Hasan']);
        $manager = $this->userWithRole(Role::Manager);

        $purchase = $this->actingAs($manager)->postJson('/api/admin/purchases', [
            'supplier_id' => $supplier->id,
            'items' => [[
                'product_id' => $product->id,
                'variant_id' => $small->id,
                'quantity' => 20,
                'unit_price' => 500,
            ]],
        ])->assertCreated()->json('data');

        // The label is snapshotted so the line still reads correctly if the
        // variant is later deleted.
        $this->assertDatabaseHas('purchase_items', [
            'purchase_id' => $purchase['id'],
            'variant_id' => $small->id,
            'variant_label' => '250gm',
        ]);

        $itemId = PurchaseItem::where('purchase_id', $purchase['id'])->value('id');

        $this->actingAs($manager)->postJson("/api/admin/purchases/{$purchase['id']}/receive", [
            'lines' => [['item_id' => $itemId, 'received_qty' => 20, 'rejected_qty' => 0]],
        ])->assertOk();

        // Only the variant that was bought gains stock. Before this, purchases
        // were product-level and the variants never moved, so inventory could
        // not be reconciled against orders.
        $this->assertSame(25, $small->fresh()->quantity);
        $this->assertSame(5, $large->fresh()->quantity);
        $this->assertSame(20, $product->fresh()->quantity);
    }
}
