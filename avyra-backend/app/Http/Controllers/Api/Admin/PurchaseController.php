<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use App\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    public function __construct(private readonly StockService $stock) {}

    public function index(Request $request): JsonResponse
    {
        $purchases = Purchase::with(['supplier:id,name', 'items'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('supplier_id'), fn ($q) => $q->where('supplier_id', $request->string('supplier_id')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%' . $request->string('search') . '%';
                $q->where(fn ($sub) => $sub->where('purchase_number', 'like', $term)->orWhere('supplier_name', 'like', $term));
            })
            ->latest('order_date')
            ->paginate($request->integer('per_page', 25));

        return response()->json($purchases);
    }

    public function show(Purchase $purchase): JsonResponse
    {
        return response()->json(['data' => $purchase->load(['items.product', 'supplier', 'payments'])]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'supplier_id' => ['required', 'uuid', 'exists:suppliers,id'],
            'warehouse_id' => ['nullable', 'uuid', 'exists:warehouses,id'],
            'order_date' => ['nullable', 'date'],
            'expected_delivery' => ['nullable', 'date'],
            'shipping_cost' => ['nullable', 'numeric', 'min:0'],
            'other_cost' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'uuid', 'exists:products,id'],
            'items.*.variant_id' => ['nullable', 'uuid', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.unit' => ['nullable', 'string', 'max:20'],
        ]);

        $purchase = DB::transaction(function () use ($validated, $request) {
            $supplier = Supplier::findOrFail($validated['supplier_id']);

            $purchase = Purchase::create([
                'supplier_id' => $supplier->id,
                'supplier_name' => $supplier->name,
                'warehouse_id' => $validated['warehouse_id'] ?? null,
                'status' => 'Ordered',
                'order_date' => $validated['order_date'] ?? now()->toDateString(),
                'expected_delivery' => $validated['expected_delivery'] ?? null,
                'shipping_cost' => $validated['shipping_cost'] ?? 0,
                'other_cost' => $validated['other_cost'] ?? 0,
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            $this->replaceItems($purchase, $validated['items']);
            $supplier->refreshTotals();

            return $purchase;
        });

        return response()->json(['data' => $purchase->load('items')], 201);
    }

    public function update(Request $request, Purchase $purchase): JsonResponse
    {
        // Once anything has been received the lines are part of the stock ledger.
        if ($purchase->items()->where('received_qty', '>', 0)->exists()) {
            return response()->json([
                'message' => 'This purchase has received stock and can no longer be edited.',
            ], 422);
        }

        $validated = $request->validate([
            'expected_delivery' => ['nullable', 'date'],
            'shipping_cost' => ['nullable', 'numeric', 'min:0'],
            'other_cost' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.product_id' => ['required_with:items', 'uuid', 'exists:products,id'],
            'items.*.variant_id' => ['nullable', 'uuid', 'exists:product_variants,id'],
            'items.*.quantity' => ['required_with:items', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.unit' => ['nullable', 'string', 'max:20'],
        ]);

        DB::transaction(function () use ($validated, $purchase) {
            $purchase->update(collect($validated)->except('items')->all());

            if (isset($validated['items'])) {
                $purchase->items()->delete();
                $this->replaceItems($purchase, $validated['items']);
            } else {
                $this->recalculateTotals($purchase);
            }

            $purchase->supplier?->refreshTotals();
        });

        return response()->json(['data' => $purchase->fresh()->load('items')]);
    }

    /**
     * Stock-in: records received/rejected quantities per line and moves the
     * received amount into inventory. Safe to call more than once for partial
     * deliveries — each call only adds the delta supplied.
     */
    public function receive(Request $request, Purchase $purchase): JsonResponse
    {
        $validated = $request->validate([
            'received_date' => ['nullable', 'date'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.item_id' => ['required', 'uuid', 'exists:purchase_items,id'],
            'lines.*.received_qty' => ['required', 'numeric', 'min:0'],
            'lines.*.rejected_qty' => ['nullable', 'numeric', 'min:0'],
            'lines.*.batch_number' => ['nullable', 'string', 'max:64'],
        ]);

        DB::transaction(function () use ($validated, $purchase, $request) {
            foreach ($validated['lines'] as $line) {
                /** @var PurchaseItem $item */
                $item = $purchase->items()->findOrFail($line['item_id']);

                $receiving = (float) $line['received_qty'];
                $rejecting = (float) ($line['rejected_qty'] ?? 0);

                if ($receiving + $rejecting > $item->pendingQty() + 0.001) {
                    abort(422, "Line [{$item->product_name}]: received + rejected exceeds the ordered quantity.");
                }

                if ($receiving > 0 && $item->product) {
                    $this->stock->move(
                        product: $item->product,
                        changeQty: $receiving,
                        movementType: 'IN',
                        referenceType: 'purchase',
                        referenceId: $purchase->id,
                        variant: $item->variant,
                        warehouseId: $purchase->warehouse_id,
                        batchNumber: $line['batch_number'] ?? $item->batch_number,
                        unitCost: (float) $item->unit_price,
                        notes: "Stock-in from {$purchase->purchase_number}",
                        userId: $request->user()->id,
                    );
                }

                $item->update([
                    'received_qty' => (float) $item->received_qty + $receiving,
                    'rejected_qty' => (float) $item->rejected_qty + $rejecting,
                    'batch_number' => $line['batch_number'] ?? $item->batch_number,
                ]);
            }

            $purchase->refresh()->load('items');

            $fullyReceived = $purchase->items->every(fn (PurchaseItem $i) => $i->pendingQty() <= 0.001);
            $anyReceived = $purchase->items->contains(fn (PurchaseItem $i) => (float) $i->received_qty > 0);

            $purchase->update([
                'status' => $fullyReceived ? 'Received' : ($anyReceived ? 'Partial' : $purchase->status),
                'received_date' => $validated['received_date'] ?? now()->toDateString(),
            ]);
        });

        return response()->json(['data' => $purchase->fresh()->load('items')]);
    }

    public function addPayment(Request $request, Purchase $purchase): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_date' => ['nullable', 'date'],
            'method' => ['nullable', 'string', 'max:30'],
            'reference' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $payment = DB::transaction(function () use ($validated, $purchase, $request) {
            $payment = SupplierPayment::create([
                'supplier_id' => $purchase->supplier_id,
                'purchase_id' => $purchase->id,
                'amount' => $validated['amount'],
                'payment_date' => $validated['payment_date'] ?? now()->toDateString(),
                'method' => $validated['method'] ?? 'Cash',
                'reference' => $validated['reference'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            $purchase->increment('paid_amount', (float) $validated['amount']);
            $purchase->supplier?->refreshTotals();

            return $payment;
        });

        return response()->json(['data' => $payment], 201);
    }

    public function destroy(Purchase $purchase): JsonResponse
    {
        if ($purchase->items()->where('received_qty', '>', 0)->exists()) {
            return response()->json([
                'message' => 'This purchase has received stock; cancel it instead of deleting.',
            ], 422);
        }

        $supplier = $purchase->supplier;
        $purchase->delete();
        $supplier?->refreshTotals();

        return response()->json(['message' => 'Purchase deleted.']);
    }

    public function stats(): JsonResponse
    {
        return response()->json([
            'data' => [
                'pending_purchases' => Purchase::whereIn('status', ['Ordered', 'Partial'])->count(),
                'received_today' => Purchase::whereDate('received_date', today())->count(),
                'payable' => round((float) Purchase::whereNot('status', 'Cancelled')->sum('total')
                    - (float) Purchase::whereNot('status', 'Cancelled')->sum('paid_amount'), 2),
                'mtd_spend' => (float) Purchase::whereNot('status', 'Cancelled')
                    ->whereBetween('order_date', [now()->startOfMonth(), now()->endOfMonth()])
                    ->sum('total'),
            ],
        ]);
    }

    private function replaceItems(Purchase $purchase, array $items): void
    {
        foreach ($items as $item) {
            $product = Product::findOrFail($item['product_id']);
            $variant = ! empty($item['variant_id']) ? ProductVariant::find($item['variant_id']) : null;

            PurchaseItem::create([
                'purchase_id' => $purchase->id,
                'product_id' => $product->id,
                'variant_id' => $variant?->id,
                'product_name' => $product->name,
                'quantity' => $item['quantity'],
                'unit' => $item['unit'] ?? 'pcs',
                'unit_price' => $item['unit_price'],
                'total_cost' => round((float) $item['quantity'] * (float) $item['unit_price'], 2),
            ]);
        }

        $this->recalculateTotals($purchase->fresh());
    }

    private function recalculateTotals(Purchase $purchase): void
    {
        $purchase->loadMissing('items');

        $subtotal = (float) $purchase->items->sum('total_cost');

        $purchase->update([
            'items_count' => $purchase->items->count(),
            'subtotal' => $subtotal,
            'total' => round($subtotal + (float) $purchase->shipping_cost + (float) $purchase->other_cost, 2),
        ]);
    }
}
