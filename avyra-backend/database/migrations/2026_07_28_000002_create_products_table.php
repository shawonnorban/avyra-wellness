<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('sku')->unique();
            $table->string('slug')->unique()->nullable();
            $table->string('name');
            $table->string('category')->nullable();       // e.g. "Vital Plus"
            $table->string('short_description')->nullable();
            $table->text('description')->nullable();
            $table->json('images')->nullable();            // array of image URLs, primary = images[0]
            $table->string('warehouse')->default('Dhaka WH-1'); // legacy label; normalize to warehouse_id later if needed
            $table->integer('quantity')->default(0);
            $table->integer('min_stock')->default(20);
            $table->decimal('cost_price', 10, 2)->default(0);
            $table->decimal('sell_price', 10, 2)->default(0);
            $table->date('last_sale_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
