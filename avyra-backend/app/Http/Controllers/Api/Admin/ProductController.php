<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Rules\StoredImagePath;
use App\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function __construct(private readonly StockService $stock) {}

    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->with('variants')
            // Units actually sold. Cancelled covers returned and lost, which are
            // no longer statuses of their own; fake orders never happened at all.
            ->withSum(
                ['orderItems as sold_count' => fn ($q) => $q->whereHas(
                    'order',
                    fn ($o) => $o->whereNotIn('status', [
                        OrderStatus::Cancel->value,
                        OrderStatus::Fake->value,
                    ]),
                )],
                'quantity',
            )
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%' . $request->string('search') . '%';
                $q->where(fn ($sub) => $sub->where('name', 'like', $term)->orWhere('sku', 'like', $term));
            })
            ->when($request->filled('category'), fn ($q) => $q->where('category', $request->string('category')))
            ->when($request->boolean('low_stock'), fn ($q) => $q->whereColumn('quantity', '<=', 'min_stock'))
            ->latest('created_at')
            ->paginate($request->integer('per_page', 25))
            ->withQueryString();

        return response()->json($products);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json(['data' => $product->load('variants')]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules());

        $validated['slug'] ??= Str::slug($validated['name']);

        $product = Product::create($validated);

        // An opening balance is a stock movement like any other, so it shows in the ledger.
        if (($validated['quantity'] ?? 0) > 0) {
            $product->update(['quantity' => 0]);
            $this->stock->move(
                product: $product,
                changeQty: (float) $validated['quantity'],
                movementType: 'IN',
                referenceType: 'opening_balance',
                notes: 'Opening stock on product creation',
                userId: $request->user()->id,
            );
        }

        return response()->json(['data' => $product->fresh()], 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate($this->rules($product->id));

        // Quantity is only ever changed through adjustStock so the ledger stays honest.
        unset($validated['quantity']);

        $product->update($validated);

        return response()->json(['data' => $product->fresh()->load('variants')]);
    }

    /**
     * A product that has never been sold is genuinely removed; one that appears on
     * an order is retired instead, so historical orders keep their line items.
     */
    public function destroy(Product $product): JsonResponse
    {
        if ($product->orderItems()->exists()) {
            $product->update(['is_active' => false]);

            return response()->json([
                'message' => 'Product appears on past orders, so it was deactivated instead of deleted.',
                'deleted' => false,
            ]);
        }

        DB::transaction(function () use ($product) {
            // Stock movements have no cascade, so clear the ledger with the product.
            $product->stockMovements()->delete();
            $product->variants()->delete();
            $product->delete();
        });

        return response()->json(['message' => 'Product deleted.', 'deleted' => true]);
    }

    public function adjustStock(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'change_qty' => ['required', 'numeric', 'not_in:0'],
            'variant_id' => ['nullable', 'uuid', 'exists:product_variants,id'],
            'notes' => ['nullable', 'string', 'max:500'],
            'batch_number' => ['nullable', 'string', 'max:64'],
        ]);

        $variant = ! empty($validated['variant_id']) ? ProductVariant::find($validated['variant_id']) : null;

        $movement = $this->stock->move(
            product: $product,
            changeQty: (float) $validated['change_qty'],
            movementType: 'ADJUST',
            referenceType: 'manual',
            variant: $variant,
            batchNumber: $validated['batch_number'] ?? null,
            notes: $validated['notes'] ?? null,
            userId: $request->user()->id,
        );

        return response()->json(['data' => ['movement' => $movement, 'product' => $product->fresh()]]);
    }

    public function movements(Request $request, Product $product): JsonResponse
    {
        $movements = $product->stockMovements()
            ->latest('created_at')
            ->paginate($request->integer('per_page', 50));

        return response()->json($movements);
    }

    public function storeVariant(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'size' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:50'],
            'sku_suffix' => ['required', 'string', 'max:50'],
            'image_path' => ['nullable', new StoredImagePath()],
            'quantity' => ['nullable', 'integer', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'sell_price' => ['nullable', 'numeric', 'min:0'],
            'compare_at_price' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $variant = $product->variants()->create($validated);

        return response()->json(['data' => $variant], 201);
    }

    public function updateVariant(Request $request, Product $product, ProductVariant $variant): JsonResponse
    {
        abort_unless($variant->product_id === $product->id, 404);

        $variant->update($request->validate([
            'size' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:50'],
            'sku_suffix' => ['sometimes', 'string', 'max:50'],
            'image_path' => ['nullable', new StoredImagePath()],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'sell_price' => ['nullable', 'numeric', 'min:0'],
            'compare_at_price' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
        ]));

        return response()->json(['data' => $variant->fresh()]);
    }

    /**
     * Mirrors product deletion: a variant nobody has ordered is removed outright,
     * one that appears on an order is retired so the line item still resolves.
     */
    public function destroyVariant(Product $product, ProductVariant $variant): JsonResponse
    {
        abort_unless($variant->product_id === $product->id, 404);

        if (OrderItem::where('variant_id', $variant->id)->exists()) {
            $variant->update(['is_active' => false]);

            return response()->json([
                'message' => 'Variant appears on past orders, so it was deactivated instead of deleted.',
                'deleted' => false,
            ]);
        }

        // Stock movements are recorded against the product, not the variant, so
        // there is nothing else to clean up.
        $variant->delete();

        return response()->json(['message' => 'Variant deleted.', 'deleted' => true]);
    }

    private function rules(?string $ignoreId = null): array
    {
        $skuUnique = 'unique:products,sku' . ($ignoreId ? ",{$ignoreId}" : '');
        $slugUnique = 'unique:products,slug' . ($ignoreId ? ",{$ignoreId}" : '');

        return [
            'sku' => ['required', 'string', 'max:64', $skuUnique],
            'slug' => ['nullable', 'string', 'max:255', $slugUnique],
            'name' => ['required', 'string', 'max:255'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'product_label' => ['nullable', 'string', 'max:100'],
            'facility_label' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:100'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'long_description' => ['nullable', 'string'],
            // Images are upload paths only; StoredImagePath rejects pasted URLs.
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => [new StoredImagePath()],
            'gallery_images' => ['nullable', 'array', 'max:20'],
            'gallery_images.*' => [new StoredImagePath()],
            'pack_options' => ['nullable', 'array'],
            'ingredients' => ['nullable', 'array'],
            'nutrition' => ['nullable', 'array'],
            'benefits_section' => ['nullable', 'array'],
            'trust_section' => ['nullable', 'array'],
            'suitability' => ['nullable', 'array'],
            'certificates' => ['nullable', 'array', 'max:10'],
            'certificates.*' => [new StoredImagePath()],
            'faqs' => ['nullable', 'array'],
            'delivery_info' => ['nullable', 'array'],
            'terms_conditions' => ['nullable', 'string'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'warehouse' => ['nullable', 'string', 'max:100'],
            'quantity' => ['nullable', 'integer', 'min:0'],
            'min_stock' => ['nullable', 'integer', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'sell_price' => ['nullable', 'numeric', 'min:0'],
            'compare_at_price' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }
}
