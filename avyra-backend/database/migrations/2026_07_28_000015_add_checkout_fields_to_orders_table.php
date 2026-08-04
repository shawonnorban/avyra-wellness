<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // `total` already exists and stays the amount actually payable;
            // these break it down so an invoice can be reprinted exactly.
            $table->decimal('subtotal', 12, 2)->default(0)->after('items_count');
            $table->decimal('discount', 12, 2)->default(0)->after('subtotal');
            $table->decimal('delivery_charge', 12, 2)->default(0)->after('discount');
            $table->string('coupon_code')->nullable()->after('delivery_charge');
            $table->string('delivery_zone')->nullable()->after('coupon_code'); // inside_dhaka | outside_dhaka

            // Mobile-wallet payments (bKash/Nagad/Rocket) are reconciled manually.
            $table->string('payment_sender_number')->nullable()->after('payment_method');
            $table->string('payment_txn_ref')->nullable()->after('payment_sender_number');

            // Captured at checkout and replayed by the fraud service on later reviews.
            $table->string('ip_address', 45)->nullable()->after('referrer');
            $table->string('device_fingerprint')->nullable()->after('ip_address');

            $table->foreignUuid('warehouse_id')->nullable()->after('branch')->constrained('warehouses');

            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['warehouse_id']);
            $table->dropIndex(['created_at']);
            $table->dropColumn([
                'subtotal', 'discount', 'delivery_charge', 'coupon_code', 'delivery_zone',
                'payment_sender_number', 'payment_txn_ref', 'ip_address',
                'device_fingerprint', 'warehouse_id',
            ]);
        });
    }
};
