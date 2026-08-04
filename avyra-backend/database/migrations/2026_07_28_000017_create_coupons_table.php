<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code')->unique();
            // Stored as an amount + type rather than the legacy free-text "10%" string,
            // so the discount can be computed without parsing.
            $table->enum('discount_type', ['percent', 'fixed'])->default('percent');
            $table->decimal('discount_value', 10, 2);
            $table->decimal('min_order_total', 12, 2)->default(0);
            $table->decimal('max_discount', 12, 2)->nullable(); // caps a percent discount
            $table->unsignedInteger('max_usage')->nullable();   // null = unlimited
            $table->unsignedInteger('current_usage')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupons');
    }
};
