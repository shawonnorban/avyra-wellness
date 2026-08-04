<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\LandingPage;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Editing existing records through the admin API: landing pages and variants.
 */
class AdminEditingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\SettingSeeder::class);
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
    }

    private function admin(): User
    {
        $user = User::create(['name' => 'Admin', 'email' => 'a@test.com', 'password' => 'secret']);
        UserRole::create(['user_id' => $user->id, 'role' => Role::Admin]);

        return $user->load('roles');
    }

    private function product(): Product
    {
        return Product::create([
            'sku' => 'SKU-' . uniqid(),
            'slug' => 'p-' . uniqid(),
            'name' => 'Test product',
            'sell_price' => 1000,
            'quantity' => 20,
            'is_active' => true,
        ]);
    }

    /* ---------- Landing pages ---------- */

    public function test_a_landing_page_can_be_edited(): void
    {
        $page = LandingPage::create([
            'slug' => 'campaign',
            'title' => 'Campaign',
            'cta_text' => 'অর্ডার করুন',
            'is_active' => true,
        ]);

        $this->actingAs($this->admin())
            ->putJson("/api/admin/landing-pages/{$page->id}", [
                'title' => 'Renamed campaign',
                'headline' => 'নতুন হেডলাইন',
            ])
            ->assertOk();

        $this->assertSame('Renamed campaign', $page->fresh()->title);
        $this->assertSame('নতুন হেডলাইন', $page->fresh()->headline);
    }

    public function test_a_landing_page_round_trips_the_payload_the_editor_sends(): void
    {
        $page = LandingPage::create(['slug' => 'rt', 'title' => 'Round trip', 'is_active' => true]);
        $admin = $this->admin();

        // Exactly what the editor GETs, then PUTs back untouched.
        $loaded = $this->actingAs($admin)
            ->getJson("/api/admin/landing-pages/{$page->id}")
            ->assertOk()
            ->json('data');

        $payload = collect($loaded)->only([
            'title', 'slug', 'product_id', 'headline', 'sub_headline', 'hero_image_path',
            'cta_text', 'cta_type', 'cta_value', 'countdown_end',
            'delivery_charge_inside', 'delivery_charge_outside',
            'meta_title', 'meta_description', 'show_header', 'show_footer',
            'is_active', 'sections',
        ])->all();

        $this->actingAs($admin)
            ->putJson("/api/admin/landing-pages/{$page->id}", $payload)
            ->assertOk();
    }

    public function test_editing_a_landing_page_keeps_its_slug_stable(): void
    {
        $page = LandingPage::create(['slug' => 'stable', 'title' => 'Stable', 'is_active' => true]);

        $this->actingAs($this->admin())
            ->putJson("/api/admin/landing-pages/{$page->id}", [
                'title' => 'Stable',
                'slug' => 'stable',
            ])
            ->assertOk();

        // Re-saving with its own slug must not append a uniqueness suffix.
        $this->assertSame('stable', $page->fresh()->slug);
    }

    public function test_a_landing_page_section_survives_a_save(): void
    {
        $page = LandingPage::create(['slug' => 'sec', 'title' => 'Sections', 'is_active' => true]);

        $sections = [
            ['type' => 'faq', 'heading' => 'প্রশ্ন', 'items' => [['q' => 'ক', 'a' => 'খ']]],
            ['type' => 'order_form'],
        ];

        $this->actingAs($this->admin())
            ->putJson("/api/admin/landing-pages/{$page->id}", ['title' => 'Sections', 'sections' => $sections])
            ->assertOk();

        $this->assertSame($sections, $page->fresh()->sections);
    }

    /* ---------- Settings ---------- */

    public function test_saving_a_partial_setting_group_keeps_the_other_keys(): void
    {
        $before = Setting::get('company');

        $this->actingAs($this->admin())
            ->putJson('/api/admin/settings/company', ['value' => ['name' => 'Renamed Co']])
            ->assertOk();

        $after = Setting::where('key', 'company')->first()->value;

        $this->assertSame('Renamed Co', $after['name']);
        // Everything the form did not send must survive.
        $this->assertSame($before['email'], $after['email']);
        $this->assertArrayHasKey('currency_symbol', $after);
        $this->assertArrayHasKey('social', $after);
    }

    public function test_company_changes_reach_the_storefront(): void
    {
        $this->actingAs($this->admin())
            ->putJson('/api/admin/settings/company', [
                'value' => ['name' => 'Avyra BD', 'phone' => '01700112233', 'tagline' => 'Naturally yours'],
            ])
            ->assertOk();

        $company = $this->getJson('/api/storefront/settings')->assertOk()->json('data.company');

        $this->assertSame('Avyra BD', $company['name']);
        $this->assertSame('01700112233', $company['phone']);
        $this->assertSame('Naturally yours', $company['tagline']);
        // The logo is published as a URL, never as the raw storage path.
        $this->assertArrayHasKey('logo_url', $company);
        $this->assertArrayNotHasKey('logo_path', $company);
    }

    public function test_saving_settings_does_not_leak_secrets_to_the_storefront(): void
    {
        $this->actingAs($this->admin())
            ->putJson('/api/admin/settings/courier_steadfast', [
                'value' => ['api_key' => 'live-key-123', 'enabled' => true],
            ])
            ->assertOk();

        $public = $this->getJson('/api/storefront/settings')->assertOk()->json('data');

        $this->assertArrayNotHasKey('courier_steadfast', $public);
    }

    public function test_social_links_saved_in_admin_reach_the_storefront(): void
    {
        $this->actingAs($this->admin())
            ->putJson('/api/admin/settings/company', [
                'value' => [
                    'social' => [
                        'facebook' => 'https://facebook.com/avyrabd',
                        'instagram' => 'https://instagram.com/avyrabd',
                    ],
                ],
            ])
            ->assertOk();

        $company = $this->getJson('/api/storefront/settings')->assertOk()->json('data.company');

        $this->assertSame('https://facebook.com/avyrabd', $company['social']['facebook']);
        // The keys the form did not touch must keep their seeded values.
        $this->assertArrayHasKey('youtube', $company['social']);
        $this->assertNotNull($company['name']);
    }

    public function test_policy_bodies_are_public(): void
    {
        $policies = $this->getJson('/api/storefront/settings')->assertOk()->json('data.policies');

        foreach (['returns', 'shipping', 'terms', 'privacy'] as $key) {
            $this->assertNotEmpty($policies[$key], "policy `{$key}` should be seeded");
        }
    }

    public function test_a_policy_can_be_edited_from_the_admin(): void
    {
        $this->actingAs($this->admin())
            ->putJson('/api/admin/settings/policies', ['value' => ['returns' => 'Ten day returns.']])
            ->assertOk();

        $policies = $this->getJson('/api/storefront/settings')->assertOk()->json('data.policies');

        $this->assertSame('Ten day returns.', $policies['returns']);
        // Editing one policy must not blank the others.
        $this->assertNotEmpty($policies['privacy']);
    }

    public function test_the_purchase_popup_list_is_public_and_edits_cleanly(): void
    {
        $seeded = $this->getJson('/api/storefront/settings')->assertOk()->json('data.purchase_popup');

        $this->assertFalse($seeded['enabled'], 'the popup should ship switched off');
        $this->assertNotEmpty($seeded['entries']);

        $this->actingAs($this->admin())
            ->putJson('/api/admin/settings/purchase_popup', [
                'value' => ['enabled' => true, 'entries' => "মহিউদ্দিন | টাঙ্গাইল"],
            ])
            ->assertOk();

        $after = $this->getJson('/api/storefront/settings')->assertOk()->json('data.purchase_popup');

        $this->assertTrue($after['enabled']);
        $this->assertSame('মহিউদ্দিন | টাঙ্গাইল', $after['entries']);
        // The interval was not submitted, so the seeded value must survive.
        $this->assertSame(25, $after['interval_seconds']);
    }

    public function test_a_landing_page_keeps_every_review_image(): void
    {
        $page = LandingPage::create(['slug' => 'revs', 'title' => 'Reviews', 'is_active' => true]);
        $admin = $this->admin();

        $paths = [];

        // Three separate uploads, the way an admin adds them one at a time.
        for ($i = 0; $i < 3; $i++) {
            \Illuminate\Support\Facades\Storage::fake('public');
            $paths[] = $this->actingAs($admin)
                ->postJson('/api/admin/uploads', [
                    'folder' => 'reviews',
                    'files' => [\Illuminate\Http\UploadedFile::fake()->image("r{$i}.jpg", 600, 600)],
                ])
                ->json('data.0.path');
        }

        $this->actingAs($admin)
            ->putJson("/api/admin/landing-pages/{$page->id}", [
                'title' => 'Reviews',
                'sections' => [['type' => 'reviews', 'heading' => 'রিভিউ', 'images' => $paths]],
            ])
            ->assertOk();

        $saved = $page->fresh()->sections[0];

        $this->assertCount(3, $saved['images']);
        $this->assertSame($paths, $saved['images']);
        $this->assertSame('রিভিউ', $saved['heading']);
    }

    /* ---------- Orders list payload ---------- */

    public function test_the_orders_list_carries_a_thumbnail_and_full_timestamp(): void
    {
        $admin = $this->admin();
        $product = $this->product();
        $product->update(['images' => ['products/2026/07/example.webp']]);

        $this->actingAs($admin)->postJson('/api/admin/orders', [
            'customer_name' => 'Thumb Buyer',
            'phone' => '01799887766',
            'address' => 'Dhaka',
            'payment_method' => 'COD',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertCreated();

        $row = $this->actingAs($admin)->getJson('/api/admin/orders')->assertOk()->json('data.0');

        $this->assertStringContainsString('products/2026/07/example.webp', $row['thumbnail']);
        // The list shows a time under the date, so a bare date string is not enough.
        $this->assertStringContainsString('T', $row['order_date']);
    }

    public function test_status_counts_include_a_today_total(): void
    {
        $admin = $this->admin();
        $product = $this->product();

        $this->actingAs($admin)->postJson('/api/admin/orders', [
            'customer_name' => 'Today Buyer',
            'phone' => '01799887755',
            'address' => 'Dhaka',
            'payment_method' => 'COD',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertCreated();

        $counts = $this->actingAs($admin)
            ->getJson('/api/admin/orders/status-counts')
            ->assertOk()
            ->json('data');

        $this->assertSame(1, $counts['today']);
        $this->assertSame(1, $counts['total']);
    }

    public function test_the_product_list_reports_units_sold(): void
    {
        $admin = $this->admin();
        $product = $this->product();

        $this->actingAs($admin)->postJson('/api/admin/orders', [
            'customer_name' => 'Buyer One',
            'phone' => '01700000011',
            'address' => 'Dhaka',
            'payment_method' => 'COD',
            'items' => [['product_id' => $product->id, 'quantity' => 3]],
        ])->assertCreated();

        // A cancelled order must not count towards units sold.
        $cancelled = $this->actingAs($admin)->postJson('/api/admin/orders', [
            'customer_name' => 'Buyer Two',
            'phone' => '01700000022',
            'address' => 'Dhaka',
            'payment_method' => 'COD',
            'items' => [['product_id' => $product->id, 'quantity' => 5]],
        ])->json('data.id');

        $this->actingAs($admin)
            ->patchJson("/api/admin/orders/{$cancelled}/status", ['status' => 'cancel'])
            ->assertOk();

        $row = collect($this->actingAs($admin)->getJson('/api/admin/products')->json('data'))
            ->firstWhere('id', $product->id);

        $this->assertSame(3, (int) $row['sold_count']);
    }

    /* ---------- Variants ---------- */

    public function test_a_variant_can_be_edited(): void
    {
        $product = $this->product();
        $variant = $product->variants()->create([
            'sku_suffix' => '250G',
            'size' => '250g',
            'quantity' => 10,
            'sell_price' => 900,
            'is_active' => true,
        ]);

        $this->actingAs($this->admin())
            ->putJson("/api/admin/products/{$product->id}/variants/{$variant->id}", [
                'size' => '500gm',
                'sell_price' => 1540,
                'compare_at_price' => 1640,
            ])
            ->assertOk();

        $fresh = $variant->fresh();

        $this->assertSame('500gm', $fresh->size);
        $this->assertEqualsWithDelta(1540.0, (float) $fresh->sell_price, 0.01);
        $this->assertEqualsWithDelta(1640.0, (float) $fresh->compare_at_price, 0.01);
    }

    public function test_editing_a_variant_does_not_wipe_untouched_fields(): void
    {
        $product = $this->product();
        $variant = $product->variants()->create([
            'sku_suffix' => '250G',
            'size' => '250g',
            'color' => 'natural',
            'quantity' => 42,
            'sell_price' => 900,
            'is_active' => true,
        ]);

        $this->actingAs($this->admin())
            ->putJson("/api/admin/products/{$product->id}/variants/{$variant->id}", [
                'sell_price' => 950,
            ])
            ->assertOk();

        $fresh = $variant->fresh();

        // Quantity is ledger-owned and must never move through this endpoint.
        $this->assertSame(42, (int) $fresh->quantity);
        $this->assertSame('250G', $fresh->sku_suffix);
    }
}
