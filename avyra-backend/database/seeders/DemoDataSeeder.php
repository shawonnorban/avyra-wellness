<?php

namespace Database\Seeders;

use App\Models\Coupon;
use App\Models\Product;
use App\Models\ShopBanner;
use App\Models\Upload;
use App\Services\UploadService;
use Illuminate\Database\Seeder;
use Illuminate\Http\UploadedFile;

/**
 * Sample catalogue so the storefront has something to render during development.
 * Not part of DatabaseSeeder — run explicitly:
 *   php artisan db:seed --class=DemoDataSeeder
 */
class DemoDataSeeder extends Seeder
{
    /**
     * Copies a brand image from the frontend's public folder through the upload
     * pipeline, so demo data uses real stored files exactly like admin uploads do.
     * Returns null when the source file is missing, which keeps the seeder usable
     * on a checkout without the image assets.
     */
    private function seedImage(string $filename, string $folder): ?string
    {
        $source = base_path('../avyra-frontend/public/avyra/' . $filename);

        if (! is_file($source)) {
            return null;
        }

        // Re-running the seeder must not pile up duplicate copies of the same file.
        $existing = Upload::where('folder', $folder)
            ->where('original_name', $filename)
            ->value('path');

        if ($existing) {
            return $existing;
        }

        // The service expects an UploadedFile; a copy in the temp dir keeps the
        // original asset untouched when the file is consumed.
        $temp = tempnam(sys_get_temp_dir(), 'seed');
        copy($source, $temp);

        return app(UploadService::class)
            ->store(new UploadedFile($temp, $filename, null, null, true), $folder)
            ->path;
    }

    public function run(): void
    {
        $vitalPlus = Product::updateOrCreate(
            ['sku' => 'AVY-VP-001'],
            [
                'slug' => 'vital-plus',
                'name' => 'Vital Plus',
                'tagline' => 'Men\'s Natural Wellness Formula',
                'product_label' => 'Best Seller',
                'facility_label' => 'Made in a certified facility',
                'category' => 'Vital Plus',
                'short_description' => 'A honey-based blend of pine nuts, cashew, ashwagandha and mastic gum.',
                'description' => 'Vital Plus combines traditional ingredients into a daily wellness spread.',
                'long_description' => 'Vital Plus is built around whole ingredients — no fillers, no synthetic additives. Take one spoon daily, on its own or with warm milk.',
                // Seeded through the same upload pipeline as the admin UI, so these
                // are registered paths rather than URLs.
                'images' => array_filter([$this->seedImage('vital-plus-box.png', 'products')]),
                'gallery_images' => array_filter([
                    $this->seedImage('vital-plus-box.png', 'products'),
                    $this->seedImage('vital-plus-jar.png', 'products'),
                    $this->seedImage('ingredients.jpg', 'products'),
                ]),
                'ingredients' => [
                    ['name' => 'Pine Nuts', 'benefit' => 'Zinc and healthy fats'],
                    ['name' => 'Cashew Nuts', 'benefit' => 'Magnesium and protein'],
                    ['name' => 'Honey', 'benefit' => 'Natural energy base'],
                    ['name' => 'Ashwagandha', 'benefit' => 'Traditional adaptogen'],
                    ['name' => 'Mastic Gum', 'benefit' => 'Digestive support'],
                ],
                'faqs' => [
                    ['q' => 'How do I take it?', 'a' => 'One tablespoon daily, preferably in the morning.'],
                    ['q' => 'Is it suitable for everyone?', 'a' => 'It is formulated for adult men. Consult a doctor if you are on medication.'],
                ],
                'warehouse' => 'Dhaka WH-1',
                'quantity' => 250,
                'min_stock' => 20,
                'cost_price' => 900,
                'sell_price' => 1490,
                'meta_title' => 'Vital Plus — Avyra Wellness',
                'meta_description' => 'Natural men\'s wellness formula from Avyra Wellness.',
                'is_active' => true,
            ],
        );

        // Two pack sizes with a compare-at price so campaign pages can show a saving.
        $variants = [
            ['sku_suffix' => '250G', 'size' => '250gm', 'quantity' => 150, 'cost_price' => 520, 'sell_price' => 900, 'compare_at_price' => 1000],
            ['sku_suffix' => '500G', 'size' => '500gm', 'quantity' => 100, 'cost_price' => 900, 'sell_price' => 1540, 'compare_at_price' => 1640],
        ];

        foreach ($variants as $variant) {
            $vitalPlus->variants()->updateOrCreate(
                ['sku_suffix' => $variant['sku_suffix']],
                $variant + ['is_active' => true],
            );
        }

        // Anything else on this product is left over from manual testing.
        $vitalPlus->variants()
            ->whereNotIn('sku_suffix', array_column($variants, 'sku_suffix'))
            ->delete();

        $bannerImage = $this->seedImage('shop-hero-banner.jpg', 'banners');

        // A banner without an image would fail the NOT NULL column, so it is only
        // seeded when the source asset is actually present.
        if ($bannerImage) {
            ShopBanner::updateOrCreate(
                ['title' => 'Guided by Nature'],
                [
                    'subtitle' => 'Discover Vital Plus',
                    'image_path' => $bannerImage,
                    'link_url' => '/vital-plus',
                    'button_text' => 'Shop Now',
                    'sort_order' => 1,
                    'is_active' => true,
                ],
            );
        }

        Coupon::updateOrCreate(
            ['code' => 'AVYRA10'],
            [
                'discount_type' => 'percent',
                'discount_value' => 10,
                'min_order_total' => 1000,
                'max_discount' => 300,
                'max_usage' => 500,
                'is_active' => true,
            ],
        );
    }
}
