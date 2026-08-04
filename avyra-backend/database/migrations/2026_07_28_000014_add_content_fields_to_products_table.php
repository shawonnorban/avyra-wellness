<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Rich merchandising content used by the product detail page and by landing
        // pages that embed a product. Repeatable blocks are JSON rather than child
        // tables because they are only ever read and written as a whole.
        Schema::table('products', function (Blueprint $table) {
            $table->string('tagline')->nullable()->after('name');
            $table->string('product_label')->nullable()->after('tagline');   // e.g. "Best Seller"
            $table->string('facility_label')->nullable()->after('product_label');
            $table->longText('long_description')->nullable()->after('description');
            $table->json('gallery_images')->nullable()->after('images');
            $table->json('pack_options')->nullable()->after('gallery_images');
            $table->json('ingredients')->nullable()->after('pack_options');
            $table->json('nutrition')->nullable()->after('ingredients');
            $table->json('benefits_section')->nullable()->after('nutrition');
            $table->json('trust_section')->nullable()->after('benefits_section');
            $table->json('suitability')->nullable()->after('trust_section');
            $table->json('certificates')->nullable()->after('suitability');
            $table->json('faqs')->nullable()->after('certificates');
            $table->json('delivery_info')->nullable()->after('faqs');
            $table->text('terms_conditions')->nullable()->after('delivery_info');
            $table->string('meta_title')->nullable()->after('terms_conditions');
            $table->text('meta_description')->nullable()->after('meta_title');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'tagline', 'product_label', 'facility_label', 'long_description',
                'gallery_images', 'pack_options', 'ingredients', 'nutrition',
                'benefits_section', 'trust_section', 'suitability', 'certificates',
                'faqs', 'delivery_info', 'terms_conditions', 'meta_title', 'meta_description',
            ]);
        });
    }
};
