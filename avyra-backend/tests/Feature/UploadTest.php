<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Product;
use App\Models\ShopBanner;
use App\Models\Upload;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UploadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        $this->seed(\Database\Seeders\SettingSeeder::class);
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
    }

    private function manager(): User
    {
        $user = User::create(['name' => 'Manager', 'email' => 'm@test.com', 'password' => 'secret']);
        UserRole::create(['user_id' => $user->id, 'role' => Role::Manager]);

        return $user->load('roles');
    }

    private function upload(User $actor, string $folder = 'products', ?UploadedFile $file = null)
    {
        return $this->actingAs($actor)->postJson('/api/admin/uploads', [
            'folder' => $folder,
            'files' => [$file ?? UploadedFile::fake()->image('shot.jpg', 2400, 1800)],
        ]);
    }

    public function test_guests_cannot_upload(): void
    {
        $this->postJson('/api/admin/uploads', [
            'folder' => 'products',
            'files' => [UploadedFile::fake()->image('a.jpg')],
        ])->assertUnauthorized();
    }

    public function test_it_stores_an_image_and_registers_it(): void
    {
        $response = $this->upload($this->manager())->assertCreated();

        $path = $response->json('data.0.path');

        $this->assertNotNull($path);
        Storage::disk('public')->assertExists($path);
        $this->assertDatabaseHas('uploads', ['path' => $path, 'folder' => 'products']);
    }

    public function test_it_downscales_and_writes_a_thumbnail(): void
    {
        $response = $this->upload($this->manager())->assertCreated();

        // products cap the longest edge at 1600px.
        $this->assertSame(1600, $response->json('data.0.width'));
        $this->assertSame('image/webp', $response->json('data.0.mime'));

        Storage::disk('public')->assertExists($response->json('data.0.thumbnail_path'));
    }

    public function test_it_rejects_a_non_image_file(): void
    {
        $this->actingAs($this->manager())
            ->postJson('/api/admin/uploads', [
                'folder' => 'products',
                'files' => [UploadedFile::fake()->create('invoice.pdf', 100, 'application/pdf')],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('files.0');
    }

    public function test_it_rejects_a_file_over_five_megabytes(): void
    {
        $this->actingAs($this->manager())
            ->postJson('/api/admin/uploads', [
                'folder' => 'products',
                'files' => [UploadedFile::fake()->create('huge.jpg', 6 * 1024, 'image/jpeg')],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('files.0');
    }

    public function test_the_advertised_limit_never_exceeds_what_php_accepts(): void
    {
        $phpLimit = (int) ini_get('upload_max_filesize') * 1024 * 1024;

        $this->assertGreaterThan(0, \App\Services\UploadService::maxBytes());

        // Promising more than PHP allows produces a bare "failed to upload" with no
        // usable explanation, so the cap must stay at or below the host's limit.
        if ($phpLimit > 0) {
            $this->assertLessThanOrEqual($phpLimit, \App\Services\UploadService::maxBytes());
        }
    }

    public function test_an_oversized_file_reports_the_server_limit(): void
    {
        $response = $this->actingAs($this->manager())
            ->postJson('/api/admin/uploads', [
                'folder' => 'products',
                'files' => [UploadedFile::fake()->create('huge.jpg', 20 * 1024, 'image/jpeg')],
            ])
            ->assertStatus(422);

        // The message must name a size, not just say the upload failed.
        $messages = collect($response->json('errors'))->flatten()->implode(' ');

        $this->assertMatchesRegularExpression('/MB or smaller|larger than this server accepts/i', $messages);
    }

    public function test_it_rejects_an_unknown_folder(): void
    {
        $this->upload($this->manager(), 'etc')
            ->assertStatus(422)
            ->assertJsonValidationErrors('folder');
    }

    public function test_a_product_accepts_an_uploaded_path(): void
    {
        $manager = $this->manager();
        $path = $this->upload($manager)->json('data.0.path');

        $this->actingAs($manager)
            ->postJson('/api/admin/products', [
                'sku' => 'IMG-1',
                'name' => 'With image',
                'sell_price' => 900,
                'images' => [$path],
            ])
            ->assertCreated();

        $this->assertSame([$path], Product::where('sku', 'IMG-1')->first()->images);
    }

    public function test_a_product_rejects_a_pasted_image_url(): void
    {
        $this->actingAs($this->manager())
            ->postJson('/api/admin/products', [
                'sku' => 'IMG-2',
                'name' => 'External image',
                'sell_price' => 900,
                'images' => ['https://example.com/hotlinked.jpg'],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('images.0');

        $this->assertSame(0, Product::where('sku', 'IMG-2')->count());
    }

    public function test_a_banner_rejects_a_pasted_image_url(): void
    {
        $this->actingAs($this->manager())
            ->postJson('/api/admin/banners', [
                'title' => 'Sale',
                'image_path' => 'https://cdn.example.com/banner.png',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('image_path');

        $this->assertSame(0, ShopBanner::count());
    }

    public function test_a_landing_page_section_rejects_a_pasted_image_url(): void
    {
        $this->actingAs($this->manager())
            ->postJson('/api/admin/landing-pages', [
                'title' => 'Campaign',
                'sections' => [
                    ['type' => 'gallery', 'images' => ['https://example.com/a.jpg']],
                ],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('sections.0.images.0');
    }

    public function test_deleting_an_upload_removes_the_files(): void
    {
        $manager = $this->manager();
        $data = $this->upload($manager)->json('data.0');

        $this->actingAs($manager)
            ->deleteJson("/api/admin/uploads/{$data['id']}")
            ->assertOk();

        Storage::disk('public')->assertMissing($data['path']);
        Storage::disk('public')->assertMissing($data['thumbnail_path']);
        $this->assertSame(0, Upload::count());
    }

    public function test_the_storefront_returns_absolute_image_urls(): void
    {
        $manager = $this->manager();
        $path = $this->upload($manager)->json('data.0.path');

        Product::create([
            'sku' => 'PUB-1',
            'slug' => 'public-product',
            'name' => 'Public product',
            'sell_price' => 1200,
            'quantity' => 5,
            'is_active' => true,
            'images' => [$path],
        ]);

        $url = $this->getJson('/api/storefront/products/public-product')->json('data.images.0');

        $this->assertStringContainsString('/storage/', $url);
        $this->assertStringContainsString($path, $url);
    }
}
