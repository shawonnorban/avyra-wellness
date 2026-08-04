<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Image columns now hold a disk-relative path produced by the upload endpoint,
     * never an external URL. The columns are renamed so nothing keeps treating the
     * value as a URL by habit.
     */
    public function up(): void
    {
        Schema::table('shop_banners', function (Blueprint $table) {
            $table->renameColumn('image_url', 'image_path');
        });

        Schema::table('landing_pages', function (Blueprint $table) {
            $table->renameColumn('hero_image', 'hero_image_path');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('avatar_url', 'avatar_path');
        });

        // Variants can carry their own pack shot.
        Schema::table('product_variants', function (Blueprint $table) {
            $table->string('image_path')->nullable()->after('sku_suffix');
        });
    }

    public function down(): void
    {
        Schema::table('shop_banners', function (Blueprint $table) {
            $table->renameColumn('image_path', 'image_url');
        });

        Schema::table('landing_pages', function (Blueprint $table) {
            $table->renameColumn('hero_image_path', 'hero_image');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('avatar_path', 'avatar_url');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn('image_path');
        });
    }
};
