<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Stock held per variant, with what it is worth and how much has sold.
 *
 * Separate from the Variants editor on the product page, which is for changing a
 * variant, and from the Stock tab, which is the movement ledger. This answers a
 * different question — "what am I holding, and what is it worth" — across the
 * whole catalogue at once, which neither of those can.
 *
 * Both values are reported because they answer different things: cost is what
 * the stock is worth on the books, retail is what it would bring in if it all
 * sold. The gap between them is the margin still sitting on the shelf.
 */
class StockController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $variants = ProductVariant::query()
            ->with('product:id,name,sku,images,min_stock')
            // Same definition as the product list — confirmed or delivered only.
            ->withSum(
                ['orderItems as sold_count' => fn ($q) => $q->whereHas(
                    'order',
                    fn ($o) => $o->whereIn('status', OrderStatus::soldValues()),
                )],
                'quantity',
            )
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%' . $request->string('search') . '%';

                $q->where(fn ($sub) => $sub->where('sku_suffix', 'like', $term)
                    ->orWhere('size', 'like', $term)
                    ->orWhereHas('product', fn ($p) => $p->where('name', 'like', $term)));
            })
            ->when($request->boolean('in_stock_only'), fn ($q) => $q->where('quantity', '>', 0))
            ->get();

        $rows = $variants
            ->map(function (ProductVariant $variant) {
                $quantity = (int) $variant->quantity;

                return [
                    'id' => $variant->id,
                    'product_id' => $variant->product_id,
                    'product_name' => $variant->product?->name,
                    'label' => collect([$variant->size, $variant->color])->filter()->join(' / ')
                        ?: $variant->sku_suffix,
                    'sku' => trim(($variant->product?->sku ?? '') . '-' . $variant->sku_suffix, '-'),
                    'quantity' => $quantity,
                    'cost_price' => (float) $variant->cost_price,
                    'sell_price' => (float) $variant->sell_price,
                    'cost_value' => round($quantity * (float) $variant->cost_price, 2),
                    'retail_value' => round($quantity * (float) $variant->sell_price, 2),
                    'sold_count' => (int) ($variant->sold_count ?? 0),
                    'is_active' => (bool) $variant->is_active,
                    // Variants have no threshold of their own, so the product's
                    // stands in — better a shared warning than none at all.
                    'is_low' => $quantity > 0 && $quantity <= (int) ($variant->product?->min_stock ?? 0),
                    'is_out' => $quantity <= 0,
                ];
            })
            ->sortByDesc('cost_value')
            ->values();

        return response()->json([
            'data' => $rows,
            'summary' => [
                'variants' => $rows->count(),
                'units' => (int) $rows->sum('quantity'),
                'cost_value' => round($rows->sum('cost_value'), 2),
                'retail_value' => round($rows->sum('retail_value'), 2),
                // What the shelf would earn if it all sold at the listed price.
                'potential_profit' => round($rows->sum('retail_value') - $rows->sum('cost_value'), 2),
                'sold_units' => (int) $rows->sum('sold_count'),
                'low' => $rows->where('is_low', true)->count(),
                'out' => $rows->where('is_out', true)->count(),
            ],
        ]);
    }
}
