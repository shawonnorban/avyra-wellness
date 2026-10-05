<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Customer;
use App\Models\CustomerRiskProfile;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Models\UserRole;
use App\Enums\Role;
use App\Support\Phone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class RepeatCustomerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\SettingSeeder::class);
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        // Two orders from one number is a repeat-order block by design; these tests
        // are about what the second order records, not the fraud gate.
        $config = Setting::get('fraud_detection');
        $config['enabled'] = false;
        Setting::put('fraud_detection', $config);
    }

    private function product(): Product
    {
        return Product::create([
            'sku' => 'REP-1', 'slug' => 'rep-product', 'name' => 'Repeat Product',
            'quantity' => 100, 'min_stock' => 5, 'cost_price' => 500,
            'sell_price' => 1000, 'is_active' => true,
        ]);
    }

    private function checkout(Product $product, string $phone): void
    {
        $this->postJson('/api/storefront/checkout', [
            'customer_name' => 'Rahim Uddin',
            'phone' => $phone,
            'address' => 'House 12, Road 5, Dhanmondi, Dhaka',
            'delivery_zone' => 'inside_dhaka',
            'payment_method' => 'COD',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertCreated();
    }

    /** Marks the most recent order with the given status, as the admin or courier would. */
    private function setLatestStatus(OrderStatus $status): void
    {
        Order::query()->latest('created_at')->first()->update(['status' => $status]);
    }

    private function admin(): User
    {
        $user = User::create(['name' => 'Admin', 'email' => 'a@test.com', 'password' => 'secret']);
        UserRole::create(['user_id' => $user->id, 'role' => Role::Admin]);

        return $user->load('roles');
    }

    // ── canonical phone ────────────────────────────────────────────────────

    public function test_every_common_form_of_a_bangladeshi_number_canonicalises_to_the_local_form(): void
    {
        $this->assertSame('01712345678', Phone::canonical('01712345678'));
        $this->assertSame('01712345678', Phone::canonical('+8801712345678'));
        $this->assertSame('01712345678', Phone::canonical('8801712345678'));
        $this->assertSame('01712345678', Phone::canonical('+880 1712-345678'));
        $this->assertSame('01712345678', Phone::canonical('1712345678'));
    }

    public function test_an_unrecognised_number_is_kept_as_digits_rather_than_refused(): void
    {
        $this->assertSame('12345', Phone::canonical('12345'));
        $this->assertSame('', Phone::canonical(null));
    }

    /** The same buyer typing the number two ways must land on one customer. */
    public function test_two_spellings_of_one_number_are_one_customer(): void
    {
        $product = $this->product();

        $this->checkout($product, '01712345678');
        $this->checkout($product, '+8801712345678');

        $this->assertSame(1, Customer::count());
        $this->assertSame(2, Customer::first()->orders()->count());
        $this->assertSame(['01712345678'], Order::distinct()->pluck('phone')->all());
    }

    // ── re-order snapshot ──────────────────────────────────────────────────

    public function test_a_first_order_is_not_a_repeat(): void
    {
        $this->checkout($this->product(), '01712345678');

        $order = Order::first();
        $this->assertFalse($order->is_repeat);
        $this->assertSame(0, $order->prior_confirmed_orders);
    }

    public function test_a_second_order_from_the_same_number_is_a_repeat_once_the_first_was_confirmed(): void
    {
        $product = $this->product();

        $this->checkout($product, '01712345678');
        $this->setLatestStatus(OrderStatus::Confirm);

        $this->checkout($product, '+8801712345678');

        $second = Order::latest('created_at')->first();
        $this->assertTrue($second->is_repeat);
        $this->assertSame(1, $second->prior_confirmed_orders);
    }

    /** A first order that never reached confirmation must not make the buyer a returning one. */
    public function test_an_earlier_order_that_was_never_confirmed_does_not_count(): void
    {
        $product = $this->product();

        $this->checkout($product, '01712345678');
        $this->setLatestStatus(OrderStatus::Cancel);

        $this->checkout($product, '01712345678');

        $this->assertFalse(Order::latest('created_at')->first()->is_repeat);
    }

    public function test_delivered_counts_as_confirmed_for_the_snapshot(): void
    {
        $product = $this->product();

        $this->checkout($product, '01712345678');
        $this->setLatestStatus(OrderStatus::Delivered);

        $this->checkout($product, '01712345678');

        $this->assertTrue(Order::latest('created_at')->first()->is_repeat);
    }

    /** The snapshot is a fact about the moment of purchase; later status changes do not rewrite it. */
    public function test_the_snapshot_does_not_change_when_an_earlier_order_is_cancelled_later(): void
    {
        $product = $this->product();

        $this->checkout($product, '01712345678');
        $this->setLatestStatus(OrderStatus::Confirm);
        $this->checkout($product, '01712345678');

        $first = Order::orderBy('created_at')->first();
        $first->update(['status' => OrderStatus::Cancel]);

        $this->assertTrue(Order::latest('created_at')->first()->is_repeat);
    }

    // ── admin list filter ──────────────────────────────────────────────────

    public function test_the_orders_list_can_be_filtered_to_re_orders_or_first_orders(): void
    {
        $product = $this->product();

        $this->checkout($product, '01712345678');
        $this->setLatestStatus(OrderStatus::Confirm);
        $this->checkout($product, '01712345678');
        $this->checkout($product, '01799999999');

        $admin = $this->admin();

        $repeat = $this->actingAs($admin)->getJson('/api/admin/orders?returning=1')->assertOk()->json('data');
        $first = $this->actingAs($admin)->getJson('/api/admin/orders?returning=0')->assertOk()->json('data');

        $this->assertCount(1, $repeat);
        $this->assertCount(2, $first);
        $this->assertTrue($repeat[0]['is_repeat']);
        $this->assertSame(1, $repeat[0]['prior_confirmed_orders']);
    }

    // ── merge command ──────────────────────────────────────────────────────

    /** Two customer rows for one buyer, one under each spelling, as the old code created. */
    private function seedDuplicateCustomers(): void
    {
        $older = Customer::create([
            'code' => 'CUS-OLD00001', 'name' => 'Rahim', 'type' => 'Guest',
            'phone' => '01712345678', 'address' => 'Dhaka',
        ]);
        $newer = Customer::create([
            'code' => 'CUS-NEW00002', 'name' => 'Rahim', 'type' => 'Guest',
            'phone' => '8801712345678', 'address' => 'Dhaka', 'email' => 'rahim@example.com',
        ]);

        DB::table('orders')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(), 'order_number' => 'AVY-T-0001',
            'customer_id' => $older->id, 'customer_name' => 'Rahim', 'phone' => '01712345678',
            'address' => 'Dhaka', 'items_count' => 1, 'subtotal' => 1000, 'total' => 1000,
            'status' => 'confirm', 'order_date' => now()->subDays(2)->toDateString(), 'created_at' => now()->subDays(2), 'updated_at' => now(),
        ]);
        DB::table('orders')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(), 'order_number' => 'AVY-T-0002',
            'customer_id' => $newer->id, 'customer_name' => 'Rahim', 'phone' => '8801712345678',
            'address' => 'Dhaka', 'items_count' => 1, 'subtotal' => 1000, 'total' => 1000,
            'status' => 'delivered', 'order_date' => now()->subDay()->toDateString(), 'created_at' => now()->subDay(), 'updated_at' => now(),
        ]);
    }

    public function test_the_merge_command_dry_run_reports_and_changes_nothing(): void
    {
        $this->seedDuplicateCustomers();

        $this->artisan('customers:merge-phones')->assertSuccessful();

        // Nothing written: both customer rows, both phone spellings, and the snapshot untouched.
        $this->assertSame(2, Customer::count());

        $phones = DB::table('orders')->distinct()->orderBy('phone')->pluck('phone')->all();
        $this->assertSame(['01712345678', '8801712345678'], $phones);

        $this->assertFalse((bool) Order::where('order_number', 'AVY-T-0002')->value('is_repeat'));
    }

    public function test_apply_merges_duplicates_re_points_orders_and_keeps_the_oldest_row(): void
    {
        $this->seedDuplicateCustomers();

        $this->artisan('customers:merge-phones --apply')->assertSuccessful();

        $this->assertSame(1, Customer::count());

        $kept = Customer::first();
        $this->assertSame('CUS-OLD00001', $kept->code, 'the oldest row survives');
        $this->assertSame('01712345678', $kept->phone);
        $this->assertSame('rahim@example.com', $kept->email, 'a blank field is filled from the duplicate');

        $this->assertSame(2, Order::where('customer_id', $kept->id)->count());
        $this->assertSame(['01712345678'], Order::distinct()->pluck('phone')->all());
    }

    public function test_apply_backfills_the_snapshot_in_placement_order(): void
    {
        $this->seedDuplicateCustomers();

        $this->artisan('customers:merge-phones --apply')->assertSuccessful();

        $older = Order::where('order_number', 'AVY-T-0001')->first();
        $newer = Order::where('order_number', 'AVY-T-0002')->first();

        $this->assertFalse((bool) $older->is_repeat);
        $this->assertTrue((bool) $newer->is_repeat);
        $this->assertSame(1, (int) $newer->prior_confirmed_orders);
    }

    public function test_the_merge_does_not_send_facebook_events_for_the_orders_it_touches(): void
    {
        \Illuminate\Support\Facades\Http::fake();
        $this->seedDuplicateCustomers();

        $this->artisan('customers:merge-phones --apply')->assertSuccessful();

        \Illuminate\Support\Facades\Http::assertNothingSent();
    }

    public function test_merged_risk_profiles_keep_a_whitelist_from_any_variant(): void
    {
        CustomerRiskProfile::create(['phone' => '01712345678', 'is_whitelisted' => false, 'total_orders' => 0]);
        CustomerRiskProfile::create(['phone' => '8801712345678', 'is_whitelisted' => true, 'total_orders' => 0]);

        $this->artisan('customers:merge-phones --apply')->assertSuccessful();

        $profiles = CustomerRiskProfile::all();
        $this->assertCount(1, $profiles);
        $this->assertSame('01712345678', $profiles->first()->phone);
        $this->assertTrue((bool) $profiles->first()->is_whitelisted);
    }
}
