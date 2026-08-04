<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The "was" price a campaign strikes through to show a saving. It is display
     * only — nothing is ever charged from it.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('compare_at_price', 12, 2)->nullable()->after('sell_price');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->decimal('compare_at_price', 12, 2)->nullable()->after('sell_price');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('compare_at_price');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn('compare_at_price');
        });
    }
};
