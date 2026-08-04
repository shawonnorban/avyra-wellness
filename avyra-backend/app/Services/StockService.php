<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductStockMovement;
use App\Models\ProductVariant;

/**
 * Single entry point for every inventory change, so `products.quantity` and the
 * movement ledger can never drift apart.
 */
class StockService
{
    /**
     * Applies a signed quantity change and writes the audit row.
     * Negative for sales, positive for purchases and returns.
     */
    public function move(
        Product $product,
        float $changeQty,
        string $movementType,
        ?string $referenceType = null,
        ?string $referenceId = null,
        ?ProductVariant $variant = null,
        ?string $warehouseId = null,
        ?string $batchNumber = null,
        ?float $unitCost = null,
        ?string $notes = null,
        ?string $userId = null,
    ): ProductStockMovement {
        // Decrement/increment at the database level to avoid a lost update when two
        // orders for the same product land at once.
        if ($variant) {
            $variant->increment('quantity', $changeQty);
        }
        $product->increment('quantity', $changeQty);

        return ProductStockMovement::create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'change_qty' => $changeQty,
            'movement_type' => $movementType,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'warehouse_id' => $warehouseId,
            'batch_number' => $batchNumber,
            'unit_cost_at_time' => $unitCost ?? $product->cost_price,
            'notes' => $notes,
            'changed_by' => $userId,
        ]);
    }

    public function deductForOrder(Product $product, float $qty, string $orderId, ?ProductVariant $variant = null): void
    {
        $this->move(
            product: $product,
            changeQty: -abs($qty),
            movementType: 'OUT',
            referenceType: 'order',
            referenceId: $orderId,
            variant: $variant,
        );
    }

    public function restoreForOrder(Product $product, float $qty, string $orderId, ?ProductVariant $variant = null, ?string $notes = null): void
    {
        $this->move(
            product: $product,
            changeQty: abs($qty),
            movementType: 'IN',
            referenceType: 'order_return',
            referenceId: $orderId,
            variant: $variant,
            notes: $notes,
        );
    }
}
