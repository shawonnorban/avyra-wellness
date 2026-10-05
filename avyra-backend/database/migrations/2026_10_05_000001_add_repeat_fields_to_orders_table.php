<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Whether this order was placed by a buyer who had already ordered and been confirmed.
 *
 * Stored on the order rather than derived on read: it is a fact about the moment of
 * purchase. Recomputing it later would make a report of last quarter's re-orders
 * change as customers' statuses changed since — and a cancellation today must not
 * retroactively turn an earlier re-order into a first order.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->boolean('is_repeat')->default(false)->after('order_source')->index();
            $table->unsignedInteger('prior_confirmed_orders')->default(0)->after('is_repeat');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['is_repeat']);
            $table->dropColumn(['is_repeat', 'prior_confirmed_orders']);
        });
    }
};
