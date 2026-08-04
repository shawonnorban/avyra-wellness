<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A purchase is the stock-in document: order goods from a supplier, then receive
        // them. Receiving writes product_stock_movements, which is what moves inventory.
        // (The legacy schema split this across purchase_orders + GRN for raw materials;
        // with no manufacturing in scope, one document with received quantities is enough.)
        Schema::create('purchases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('purchase_number')->unique();
            $table->foreignUuid('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->string('supplier_name'); // snapshot
            $table->foreignUuid('warehouse_id')->nullable()->constrained('warehouses');

            $table->string('status', 20)->default('Draft'); // Draft, Ordered, Partial, Received, Cancelled
            $table->date('order_date');
            $table->date('expected_delivery')->nullable();
            $table->date('received_date')->nullable();

            $table->unsignedInteger('items_count')->default(0);
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('shipping_cost', 12, 2)->default(0);
            $table->decimal('other_cost', 12, 2)->default(0);
            $table->decimal('total', 14, 2)->default(0);
            $table->decimal('paid_amount', 14, 2)->default(0);

            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'order_date']);
        });

        Schema::create('purchase_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('purchase_id')->constrained('purchases')->cascadeOnDelete();
            $table->foreignUuid('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->foreignUuid('variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->string('product_name'); // snapshot
            $table->decimal('quantity', 12, 2);
            $table->decimal('received_qty', 12, 2)->default(0);
            $table->decimal('rejected_qty', 12, 2)->default(0);
            $table->string('unit', 20)->default('pcs');
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('total_cost', 14, 2)->default(0);
            $table->string('batch_number')->nullable();
            $table->timestamps();
        });

        Schema::create('supplier_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('supplier_id')->constrained('suppliers')->cascadeOnDelete();
            $table->foreignUuid('purchase_id')->nullable()->constrained('purchases')->nullOnDelete();
            $table->decimal('amount', 14, 2);
            $table->date('payment_date');
            $table->string('method', 30)->default('Cash'); // Cash, bKash, Bank, Cheque
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_payments');
        Schema::dropIfExists('purchase_items');
        Schema::dropIfExists('purchases');
    }
};
