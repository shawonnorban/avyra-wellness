<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courier_returns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('consignment_id')->constrained('courier_consignments')->cascadeOnDelete();
            $table->foreignUuid('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->date('return_date')->nullable();
            $table->string('return_reason')->nullable();
            // Guards against restocking the same return twice.
            $table->boolean('stock_restored')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courier_returns');
    }
};
