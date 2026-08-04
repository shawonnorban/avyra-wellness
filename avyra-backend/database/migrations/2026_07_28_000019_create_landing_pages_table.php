<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('landing_pages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug')->unique();          // served at /lp/{slug}
            $table->string('title');
            $table->foreignUuid('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->foreignUuid('campaign_id')->nullable()->constrained('campaigns')->nullOnDelete();

            $table->string('headline')->nullable();
            $table->string('sub_headline')->nullable();
            $table->string('hero_image')->nullable();

            // The builder output: an ordered array of typed blocks
            // ({ type: 'hero' | 'gallery' | 'faq' | 'reviews' | 'video' | ..., props: {...} }).
            // Kept as JSON so a new block type needs no migration.
            $table->json('sections')->nullable();

            $table->boolean('show_header')->default(false);
            $table->boolean('show_footer')->default(false);
            $table->string('cta_text')->default('অর্ডার করুন');
            $table->string('cta_type')->default('order_form'); // order_form, add_to_cart, phone, link
            $table->string('cta_value')->nullable();
            $table->timestamp('countdown_end')->nullable();

            $table->decimal('delivery_charge_inside', 10, 2)->nullable();
            $table->decimal('delivery_charge_outside', 10, 2)->nullable();

            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('landing_pages');
    }
};
