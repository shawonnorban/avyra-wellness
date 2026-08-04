<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courier_consignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            // Nullable: consignments imported from the courier portal by tracking code
            // may not match a local order yet.
            $table->foreignUuid('order_id')->nullable()->constrained('orders')->cascadeOnDelete();
            $table->string('courier', 20)->default('steadfast');
            $table->string('consignment_id')->nullable();
            $table->string('tracking_code')->nullable();
            $table->string('invoice')->nullable(); // our order_number as sent to the courier
            $table->string('status', 30)->default('Pending');
            $table->decimal('cod_amount', 12, 2)->default(0);
            $table->decimal('courier_charge', 10, 2)->default(0);
            $table->decimal('weight', 8, 2)->default(0.5);

            $table->string('recipient_name')->nullable();
            $table->string('recipient_phone')->nullable();
            $table->text('recipient_address')->nullable();
            $table->string('recipient_city')->nullable();
            $table->string('recipient_zone')->nullable();

            $table->text('note')->nullable();
            $table->boolean('is_external')->default(false);
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('returned_at')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            // The webhook and the sync job both look consignments up by these.
            $table->unique(['courier', 'consignment_id']);
            $table->index('tracking_code');
            $table->index('invoice');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courier_consignments');
    }
};
