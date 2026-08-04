<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductStockMovement;
use App\Models\RolePermission;
use App\Models\Setting;
use App\Models\User;
use App\Models\UserRole;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Covers the gaps filled in the inventory, settings and order modules.
 */
class AdminModulesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\SettingSeeder::class);
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
    }

    private function user(Role $role, string $email = 'staff@test.com'): User
    {
        $user = User::create(['name' => 'Staff', 'email' => $email, 'password' => 'secret']);
        UserRole::create(['user_id' => $user->id, 'role' => $role]);

        return $user->load('roles');
    }

    private function product(array $attributes = []): Product
    {
        return Product::create(array_merge([
            'sku' => 'SKU-' . uniqid(),
            'slug' => 'p-' . uniqid(),
            'name' => 'Test product',
            'sell_price' => 1000,
            'cost_price' => 600,
            'quantity' => 50,
            'min_stock' => 10,
            'is_active' => true,
        ], $attributes));
    }

    /* ---------- Inventory: warehouses ---------- */

    public function test_a_manager_can_create_a_warehouse(): void
    {
        $this->actingAs($this->user(Role::Manager))
            ->postJson('/api/admin/warehouses', [
                'name' => 'Chattogram Hub',
                'code' => 'CTG-1',
                'address' => 'Agrabad',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('warehouses', ['code' => 'CTG-1']);
    }

    public function test_warehouse_codes_are_unique(): void
    {
        Warehouse::create(['name' => 'A', 'code' => 'DUP', 'is_active' => true]);

        $this->actingAs($this->user(Role::Manager))
            ->postJson('/api/admin/warehouses', ['name' => 'B', 'code' => 'DUP'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('code');
    }

    public function test_a_warehouse_with_stock_history_is_deactivated_not_deleted(): void
    {
        $warehouse = Warehouse::create(['name' => 'Busy', 'code' => 'BSY', 'is_active' => true]);

        $product = $this->product();

        ProductStockMovement::create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'warehouse_id' => $warehouse->id,
            'change_qty' => 5,
            'movement_type' => 'ADJUST',
        ]);

        $this->actingAs($this->user(Role::Admin))
            ->deleteJson("/api/admin/warehouses/{$warehouse->id}")
            ->assertOk();

        // The row survives so the movement's foreign key stays valid.
        $this->assertDatabaseHas('warehouses', ['id' => $warehouse->id, 'is_active' => false]);
    }

    public function test_an_employee_without_inventory_create_cannot_add_a_warehouse(): void
    {
        RolePermission::where('role', Role::Employee)
            ->where('module', 'inventory')
            ->update(['can_create' => false]);

        $this->actingAs($this->user(Role::Employee))
            ->postJson('/api/admin/warehouses', ['name' => 'X', 'code' => 'X-1'])
            ->assertForbidden();
    }

    /* ---------- Inventory: deleting products ---------- */

    public function test_an_unsold_product_is_deleted_outright(): void
    {
        $product = $this->product();

        $this->actingAs($this->user(Role::Admin))
            ->deleteJson("/api/admin/products/{$product->id}")
            ->assertOk()
            ->assertJsonPath('deleted', true);

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }

    public function test_deleting_a_product_clears_its_variants_and_ledger(): void
    {
        $product = $this->product();

        $product->variants()->create([
            'sku_suffix' => '250G',
            'size' => '250g',
            'quantity' => 10,
            'sell_price' => 900,
            'is_active' => true,
        ]);

        ProductStockMovement::create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'change_qty' => 10,
            'movement_type' => 'IN',
        ]);

        $this->actingAs($this->user(Role::Admin))
            ->deleteJson("/api/admin/products/{$product->id}")
            ->assertOk();

        $this->assertDatabaseMissing('product_variants', ['product_id' => $product->id]);
        $this->assertDatabaseMissing('product_stock_movements', ['product_id' => $product->id]);
    }

    public function test_a_product_on_an_order_is_deactivated_rather_than_deleted(): void
    {
        $manager = $this->user(Role::Manager, 'mgr@test.com');
        $product = $this->product();

        $this->actingAs($manager)->postJson('/api/admin/orders', [
            'customer_name' => 'Buyer',
            'phone' => '01711111111',
            'address' => 'Dhaka',
            'payment_method' => 'COD',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertCreated();

        $this->actingAs($this->user(Role::Admin, 'admin@test.com'))
            ->deleteJson("/api/admin/products/{$product->id}")
            ->assertOk()
            ->assertJsonPath('deleted', false);

        // The row survives so the order's line item still resolves.
        $this->assertDatabaseHas('products', ['id' => $product->id, 'is_active' => false]);
    }

    public function test_deleting_a_product_requires_the_delete_permission(): void
    {
        RolePermission::where('role', Role::Employee)
            ->where('module', 'inventory')
            ->update(['can_delete' => false]);

        $product = $this->product();

        $this->actingAs($this->user(Role::Employee))
            ->deleteJson("/api/admin/products/{$product->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }

    /* ---------- Inventory: deleting variants ---------- */

    public function test_an_unsold_variant_is_deleted_outright(): void
    {
        $product = $this->product();
        $variant = $product->variants()->create([
            'sku_suffix' => '250G',
            'size' => '250g',
            'quantity' => 5,
            'sell_price' => 900,
            'is_active' => true,
        ]);

        $this->actingAs($this->user(Role::Admin))
            ->deleteJson("/api/admin/products/{$product->id}/variants/{$variant->id}")
            ->assertOk()
            ->assertJsonPath('deleted', true);

        $this->assertDatabaseMissing('product_variants', ['id' => $variant->id]);
    }

    public function test_a_variant_on_an_order_is_deactivated_rather_than_deleted(): void
    {
        $manager = $this->user(Role::Manager, 'mgr2@test.com');
        $product = $this->product();
        $variant = $product->variants()->create([
            'sku_suffix' => '500G',
            'size' => '500g',
            'quantity' => 5,
            'sell_price' => 1490,
            'is_active' => true,
        ]);

        $this->actingAs($manager)->postJson('/api/admin/orders', [
            'customer_name' => 'Buyer',
            'phone' => '01722222222',
            'address' => 'Dhaka',
            'payment_method' => 'COD',
            'items' => [['product_id' => $product->id, 'variant_id' => $variant->id, 'quantity' => 1]],
        ])->assertCreated();

        $this->actingAs($this->user(Role::Admin, 'admin2@test.com'))
            ->deleteJson("/api/admin/products/{$product->id}/variants/{$variant->id}")
            ->assertOk()
            ->assertJsonPath('deleted', false);

        $this->assertDatabaseHas('product_variants', ['id' => $variant->id, 'is_active' => false]);
    }

    public function test_a_variant_cannot_be_deleted_through_another_product(): void
    {
        $product = $this->product();
        $other = $this->product();
        $variant = $product->variants()->create([
            'sku_suffix' => 'X',
            'quantity' => 1,
            'sell_price' => 100,
            'is_active' => true,
        ]);

        $this->actingAs($this->user(Role::Admin))
            ->deleteJson("/api/admin/products/{$other->id}/variants/{$variant->id}")
            ->assertNotFound();

        $this->assertDatabaseHas('product_variants', ['id' => $variant->id]);
    }

    /* ---------- Delivery discount ---------- */

    public function test_the_delivery_discount_reduces_the_charge(): void
    {
        Setting::put('delivery', [
            'inside_dhaka_charge' => 60,
            'outside_dhaka_charge' => 120,
            'free_delivery_above' => null,
            'delivery_discount_enabled' => true,
            'delivery_discount' => 60,
        ], true);

        $product = $this->product(['sell_price' => 1540]);

        $this->postJson('/api/storefront/checkout', [
            'customer_name' => 'Discount Buyer',
            'phone' => '01455667788',
            'address' => 'House 3, Gulshan, Dhaka, Bangladesh',
            'delivery_zone' => 'inside_dhaka',
            'payment_method' => 'COD',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertCreated();

        $order = Order::latest('created_at')->first();

        $this->assertEqualsWithDelta(0.0, (float) $order->delivery_charge, 0.01);
        $this->assertEqualsWithDelta(1540.0, (float) $order->total, 0.01);
    }

    public function test_the_delivery_discount_never_makes_the_charge_negative(): void
    {
        Setting::put('delivery', [
            'inside_dhaka_charge' => 60,
            'outside_dhaka_charge' => 120,
            'free_delivery_above' => null,
            'delivery_discount_enabled' => true,
            'delivery_discount' => 500,
        ], true);

        $product = $this->product(['sell_price' => 1000]);

        $this->postJson('/api/storefront/checkout', [
            'customer_name' => 'Over Discount',
            'phone' => '01455667799',
            'address' => 'House 3, Gulshan, Dhaka, Bangladesh',
            'delivery_zone' => 'inside_dhaka',
            'payment_method' => 'COD',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertCreated();

        $this->assertEqualsWithDelta(0.0, (float) Order::latest('created_at')->first()->delivery_charge, 0.01);
    }

    public function test_the_delivery_discount_is_ignored_when_disabled(): void
    {
        Setting::put('delivery', [
            'inside_dhaka_charge' => 60,
            'outside_dhaka_charge' => 120,
            'free_delivery_above' => null,
            'delivery_discount_enabled' => false,
            'delivery_discount' => 60,
        ], true);

        $product = $this->product(['sell_price' => 1000]);

        $this->postJson('/api/storefront/checkout', [
            'customer_name' => 'Normal Buyer',
            'phone' => '01455667700',
            'address' => 'House 3, Gulshan, Dhaka, Bangladesh',
            'delivery_zone' => 'inside_dhaka',
            'payment_method' => 'COD',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertCreated();

        $this->assertEqualsWithDelta(60.0, (float) Order::latest('created_at')->first()->delivery_charge, 0.01);
    }

    /* ---------- Settings: staff & permission matrix ---------- */

    public function test_a_manager_cannot_reach_staff_administration(): void
    {
        $this->actingAs($this->user(Role::Manager))
            ->getJson('/api/admin/users')
            ->assertForbidden();
    }

    public function test_an_admin_can_create_a_staff_account_with_a_role(): void
    {
        $this->actingAs($this->user(Role::Admin))
            ->postJson('/api/admin/users', [
                'name' => 'New Employee',
                'email' => 'new@test.com',
                'password' => 'password123',
                'role' => 'employee',
            ])
            ->assertCreated()
            ->assertJsonPath('data.role', 'employee');

        $created = User::where('email', 'new@test.com')->first();

        // The role lives in user_roles, never on the user row.
        $this->assertDatabaseHas('user_roles', ['user_id' => $created->id, 'role' => 'employee']);
    }

    public function test_updating_a_user_without_a_password_keeps_the_existing_one(): void
    {
        $admin = $this->user(Role::Admin, 'admin@test.com');
        $target = $this->user(Role::Employee, 'target@test.com');
        $before = $target->password;

        $this->actingAs($admin)
            ->putJson("/api/admin/users/{$target->id}", ['name' => 'Renamed'])
            ->assertOk();

        $this->assertSame($before, $target->fresh()->password);
        $this->assertSame('Renamed', $target->fresh()->name);
    }

    public function test_an_admin_cannot_deactivate_their_own_account(): void
    {
        $admin = $this->user(Role::Admin);

        $this->actingAs($admin)
            ->deleteJson("/api/admin/users/{$admin->id}")
            ->assertStatus(422);

        $this->assertTrue($admin->fresh()->is_active);
    }

    public function test_the_permission_matrix_shows_admin_as_full_access(): void
    {
        $response = $this->actingAs($this->user(Role::Admin))
            ->getJson('/api/admin/permissions')
            ->assertOk();

        $this->assertTrue($response->json('data.matrix.admin.sales.delete'));
    }

    public function test_a_permission_can_be_granted_and_takes_effect(): void
    {
        RolePermission::where('role', Role::Employee)
            ->where('module', 'inventory')
            ->update(['can_create' => false]);

        $this->actingAs($this->user(Role::Admin, 'admin@test.com'))
            ->putJson('/api/admin/permissions', [
                'role' => 'employee',
                'module' => 'inventory',
                'can_view' => true,
                'can_create' => true,
                'can_edit' => true,
                'can_delete' => false,
                'can_approve' => false,
            ])
            ->assertOk();

        // The employee can now do what they were refused a moment ago.
        $this->actingAs($this->user(Role::Employee, 'emp@test.com'))
            ->postJson('/api/admin/warehouses', ['name' => 'Granted', 'code' => 'GRT'])
            ->assertCreated();
    }

    public function test_admin_permissions_cannot_be_edited(): void
    {
        $this->actingAs($this->user(Role::Admin))
            ->putJson('/api/admin/permissions', [
                'role' => 'admin',
                'module' => 'sales',
                'can_view' => false,
                'can_create' => false,
                'can_edit' => false,
                'can_delete' => false,
                'can_approve' => false,
            ])
            ->assertStatus(422);
    }

    /* ---------- Orders: POS, detail, history ---------- */

    public function test_a_pos_order_creates_the_customer_inline(): void
    {
        $product = $this->product();

        $response = $this->actingAs($this->user(Role::Manager))
            ->postJson('/api/admin/orders', [
                'customer_name' => 'Rahim Uddin',
                'phone' => '01712345678',
                'address' => 'House 4, Dhanmondi, Dhaka',
                'delivery_zone' => 'inside_dhaka',
                'payment_method' => 'COD',
                'delivery_charge' => 60,
                'items' => [['product_id' => $product->id, 'quantity' => 2]],
            ])
            ->assertCreated();

        $this->assertDatabaseHas('customers', ['phone' => '01712345678', 'name' => 'Rahim Uddin']);

        $order = Order::find($response->json('data.id'));

        $this->assertNotNull($order->customer_id);
        $this->assertSame('POS', $order->order_source);
        // Staff-entered orders skip the fraud gate.
        $this->assertSame('confirm', $order->status->value);
        $this->assertEqualsWithDelta(2060.0, (float) $order->total, 0.01);
    }

    public function test_a_pos_order_reuses_an_existing_customer(): void
    {
        $existing = Customer::create([
            'code' => 'CUS-EXISTING',
            'name' => 'Karim',
            'phone' => '01812345678',
            'type' => 'Guest',
        ]);

        $this->actingAs($this->user(Role::Manager))
            ->postJson('/api/admin/orders', [
                'customer_name' => 'Karim',
                'phone' => '01812345678',
                'address' => 'Uttara',
                'payment_method' => 'COD',
                'items' => [['product_id' => $this->product()->id, 'quantity' => 1]],
            ])
            ->assertCreated();

        $this->assertSame(1, Customer::where('phone', '01812345678')->count());
        $this->assertSame($existing->id, Order::latest('created_at')->first()->customer_id);
    }

    public function test_a_pos_order_defaults_to_the_catalogue_price(): void
    {
        $product = $this->product(['sell_price' => 1490]);

        $this->actingAs($this->user(Role::Manager))
            ->postJson('/api/admin/orders', [
                'customer_name' => 'Standard Buyer',
                'phone' => '01912345678',
                'address' => 'Dhaka',
                'payment_method' => 'COD',
                'items' => [['product_id' => $product->id, 'quantity' => 1]],
            ])
            ->assertCreated();

        $this->assertEqualsWithDelta(1490.0, (float) Order::latest('created_at')->first()->subtotal, 0.01);
    }

    public function test_staff_may_override_the_price_on_a_pos_order(): void
    {
        $product = $this->product(['sell_price' => 1490]);

        $this->actingAs($this->user(Role::Manager))
            ->postJson('/api/admin/orders', [
                'customer_name' => 'Negotiated',
                'phone' => '01912345679',
                'address' => 'Dhaka',
                'payment_method' => 'COD',
                'items' => [['product_id' => $product->id, 'quantity' => 1, 'unit_price' => 1200]],
            ])
            ->assertCreated();

        // Deliberate: an authenticated seller can agree a different price. The public
        // checkout does not share this behaviour — see the test below.
        $this->assertEqualsWithDelta(1200.0, (float) Order::latest('created_at')->first()->subtotal, 0.01);
    }

    public function test_the_public_checkout_still_ignores_a_client_supplied_price(): void
    {
        $product = $this->product(['sell_price' => 1490]);

        $this->postJson('/api/storefront/checkout', [
            'customer_name' => 'Public Buyer',
            'phone' => '01411223344',
            'address' => 'House 9, Banani, Dhaka, Bangladesh',
            'delivery_zone' => 'inside_dhaka',
            'payment_method' => 'COD',
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'unit_price' => 1]],
        ])->assertCreated();

        $this->assertEqualsWithDelta(1490.0, (float) Order::latest('created_at')->first()->subtotal, 0.01);
    }

    public function test_a_pos_order_reduces_stock(): void
    {
        $product = $this->product(['quantity' => 50]);

        $this->actingAs($this->user(Role::Manager))
            ->postJson('/api/admin/orders', [
                'customer_name' => 'Buyer',
                'phone' => '01612345678',
                'address' => 'Dhaka',
                'payment_method' => 'COD',
                'items' => [['product_id' => $product->id, 'quantity' => 3]],
            ])
            ->assertCreated();

        $this->assertSame(47, $product->fresh()->quantity);
    }

    public function test_the_order_detail_carries_an_invoice_payload(): void
    {
        $product = $this->product();
        $manager = $this->user(Role::Manager);

        $id = $this->actingAs($manager)
            ->postJson('/api/admin/orders', [
                'customer_name' => 'Invoice Test',
                'phone' => '01512345678',
                'address' => 'Dhaka',
                'payment_method' => 'COD',
                'items' => [['product_id' => $product->id, 'quantity' => 1]],
            ])
            ->json('data.id');

        $this->actingAs($manager)
            ->getJson("/api/admin/orders/{$id}")
            ->assertOk()
            ->assertJsonPath('invoice.company.name', 'Avyra Wellness')
            ->assertJsonStructure([
                'data' => ['id', 'order_number', 'items'],
                'risk',
                'invoice' => ['company' => ['name', 'phone', 'email', 'logo_url', 'currency_symbol']],
            ]);
    }

    public function test_customer_history_returns_other_orders_on_the_same_phone(): void
    {
        $manager = $this->user(Role::Manager);
        $product = $this->product();

        $ids = collect(range(1, 2))->map(fn () => $this->actingAs($manager)
            ->postJson('/api/admin/orders', [
                'customer_name' => 'Repeat Buyer',
                'phone' => '01312345678',
                'address' => 'Dhaka',
                'payment_method' => 'COD',
                'items' => [['product_id' => $product->id, 'quantity' => 1]],
            ])->json('data.id'));

        $response = $this->actingAs($manager)
            ->getJson("/api/admin/orders/{$ids[1]}/customer-history")
            ->assertOk();

        // The order being viewed is excluded from its own history.
        $this->assertCount(1, $response->json('data'));
        $this->assertSame($ids[0], $response->json('data.0.id'));
    }
}
