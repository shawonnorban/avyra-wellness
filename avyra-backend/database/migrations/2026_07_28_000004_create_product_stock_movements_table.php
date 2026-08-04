<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_stock_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained('products');
            $table->string('product_name'); // denormalized snapshot at time of movement
            $table->decimal('change_qty', 12, 2);
            $table->enum('movement_type', ['IN', 'OUT', 'ADJUST', 'TRANSFER_IN', 'TRANSFER_OUT']);
            $table->string('reference_type')->nullable(); // e.g. "order", "purchase_order", "manual"
            $table->uuid('reference_id')->nullable();
            $table->foreignUuid('warehouse_id')->nullable()->constrained('warehouses');
            $table->string('warehouse_name')->nullable();
            $table->string('batch_number')->nullable();
            $table->decimal('unit_cost_at_time', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->foreignUuid('changed_by')->nullable()->constrained('users');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['product_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_stock_movements');
    }
};
