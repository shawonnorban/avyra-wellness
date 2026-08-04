<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            // Variant is nullable: products without variants sell at the product price.
            $table->foreignUuid('variant_id')->nullable()->after('product_id')->constrained('product_variants');
            $table->string('variant_label')->nullable()->after('product_name'); // snapshot, e.g. "500ml / Gold"
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropForeign(['variant_id']);
            $table->dropColumn(['variant_id', 'variant_label']);
        });
    }
};
