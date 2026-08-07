<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Snapshots which variant a purchase line was for.
 *
 * `product_name` is already snapshotted here for the same reason, and
 * `order_items` carries a `variant_label` beside its `variant_id`: the id is a
 * link that `nullOnDelete` will cut if the variant is ever removed, which would
 * leave a historical purchase saying only "Vital Plus" for stock that was
 * actually 250gm. The label is what a human reads; the id is what stock moves
 * against.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->string('variant_label')->nullable()->after('product_name');
        });
    }

    public function down(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->dropColumn('variant_label');
        });
    }
};
