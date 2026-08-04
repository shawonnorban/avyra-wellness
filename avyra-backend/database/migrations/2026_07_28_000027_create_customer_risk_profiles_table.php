<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Keyed on phone rather than customer_id: guest checkouts create a new customer
        // row each time, but the phone number is what actually identifies the buyer.
        Schema::create('customer_risk_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('phone')->unique();
            $table->unsignedInteger('total_orders')->default(0);
            $table->unsignedInteger('delivered')->default(0);
            $table->unsignedInteger('failed')->default(0);
            $table->decimal('failure_rate', 5, 2)->default(0); // percent
            $table->string('risk_flag', 20)->default('Low');
            // Whitelisted customers skip the phone-repeat, cancelled-order and
            // delivery-ratio checks entirely.
            $table->boolean('is_whitelisted')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_risk_profiles');
    }
};
