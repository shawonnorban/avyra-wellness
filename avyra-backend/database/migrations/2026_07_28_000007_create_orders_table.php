<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('order_number')->unique();
            $table->foreignUuid('customer_id')->nullable()->constrained('customers');
            $table->string('customer_name');
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->integer('items_count')->default(1);
            $table->decimal('total', 12, 2)->default(0);

            // Kept as a plain string (validated via App\Enums\OrderStatus) instead of a DB
            // enum/check constraint, so new statuses can be added without a migration.
            $table->string('status', 30)->default('pending');
            $table->string('status_reason')->nullable();

            $table->date('order_date');
            $table->string('order_source')->default('Manual'); // Manual, Website, LazyChat, etc.
            $table->string('branch')->default('Main');
            $table->string('payment_method')->default('Cash');
            $table->text('notes')->nullable();

            // Ad/attribution tracking (Facebook Pixel + UTM), carried over from the old schema
            $table->string('fbclid')->nullable();
            $table->string('fbc')->nullable();
            $table->string('fbp')->nullable();
            $table->string('utm_source')->nullable();
            $table->string('utm_medium')->nullable();
            $table->string('utm_campaign')->nullable();
            $table->string('utm_term')->nullable();
            $table->string('utm_content')->nullable();
            $table->string('utm_id')->nullable();
            $table->text('landing_url')->nullable();
            $table->text('referrer')->nullable();

            $table->string('lazychat_order_id')->nullable();

            $table->foreignUuid('created_by')->nullable()->constrained('users');
            $table->timestamps();

            $table->index(['status', 'order_date']);
            $table->index('phone');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
