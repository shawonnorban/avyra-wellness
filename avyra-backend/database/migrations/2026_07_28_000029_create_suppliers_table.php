<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('contact_person')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('contact_email')->nullable();
            $table->text('address')->nullable();
            $table->string('payment_terms')->nullable(); // e.g. "Net 30"
            // Running aggregates maintained by the purchase flow so the supplier list
            // does not have to aggregate every PO on each page load.
            $table->unsignedInteger('total_pos')->default(0);
            $table->decimal('total_paid', 14, 2)->default(0);
            $table->decimal('outstanding', 14, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
