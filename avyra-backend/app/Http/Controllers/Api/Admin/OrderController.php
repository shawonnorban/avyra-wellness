<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\OrderSource;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\CourierReturn;
use App\Models\Customer;
use App\Models\CustomerRiskProfile;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Setting;
use App\Services\StockService;
use App\Support\Clock;
use App\Support\Media;
use App\Support\PaginatedResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OrderController extends Controller
{
    public function __construct(private readonly StockService $stock) {}

    public function index(Request $request): JsonResponse
    {
        $orders = $this->filtered($request)
            // The product is needed only for the row thumbnail, so just its images.
            ->with(['items.product:id,images', 'consignments'])
            ->latest('created_at')
            ->paginate($request->integer('per_page', 25))
            ->withQueryString();

        // Flat, like every other paginated admin endpoint — see PaginatedResponse.
        return PaginatedResponse::of($orders, OrderResource::class);
    }

    public function show(Order $order): JsonResponse
    {
        $order->load(['items.product:id,images', 'consignments.statusLogs', 'riskScores', 'warehouse']);

        return response()->json([
            'data' => new OrderResource($order),
            'risk' => $order->riskScores->map(fn ($score) => [
                'risk_score' => $score->risk_score,
                'risk_level' => $score->risk_level,
                'signals' => $score->signals,
                'action_taken' => $score->action_taken,
                'created_at' => $score->created_at?->toIso8601String(),
            ]),
            // Everything the invoice needs, resolved server-side so the printed
            // document cannot drift from what the shop is configured to show.
            'invoice' => $this->invoicePayload($order),
        ]);
    }

    /**
     * Other orders from the same phone number — the history popover in the list.
     */
    public function customerHistory(Order $order): JsonResponse
    {
        $history = Order::where('phone', $order->phone)
            ->whereKeyNot($order->id)
            ->latest('order_date')
            ->limit(20)
            ->get(['id', 'order_number', 'status', 'total', 'order_date']);

        $profile = $order->phone
            ? CustomerRiskProfile::where('phone', $order->phone)->first()
            : null;

        return response()->json([
            'data' => $history,
            'risk_profile' => $profile,
        ]);
    }

    /**
     * Line items plus company/payment details for the printable invoice.
     */
    private function invoicePayload(Order $order): array
    {
        $company = Setting::get('company', []) ?: [];

        return [
            'company' => [
                'name' => $company['name'] ?? 'Avyra Wellness',
                'phone' => $company['phone'] ?? '',
                'email' => $company['email'] ?? '',
                'address' => $company['address'] ?? '',
                'logo_url' => Media::url($company['logo_path'] ?? null),
                'currency_symbol' => $company['currency_symbol'] ?? '৳',
            ],
            'consignment' => $order->consignments->first()?->only(['courier', 'tracking_code', 'consignment_id']),
        ];
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:32'],
            'address' => ['required', 'string', 'max:1000'],
            'email' => ['nullable', 'email', 'max:255'],
            // Only the two a human can pick. Website and Landing Page belong to
            // the checkout, and accepting either here would let a staff-entered
            // order pose as one in the reports.
            'order_source' => ['nullable', Rule::in(OrderSource::staffEntered())],
            'delivery_zone' => ['nullable', 'in:inside_dhaka,outside_dhaka'],
            'warehouse_id' => ['nullable', 'uuid', 'exists:warehouses,id'],
            'payment_method' => ['required', 'string', 'max:30'],
            'delivery_charge' => ['nullable', 'numeric', 'min:0'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'uuid', 'exists:products,id'],
            'items.*.variant_id' => ['nullable', 'uuid', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $order = DB::transaction(function () use ($validated, $request) {
            $phone = preg_replace('/\D/', '', $validated['phone']);

            // POS orders create the customer inline so staff never leave the form.
            $customer = Customer::firstOrCreate(
                ['phone' => $phone],
                [
                    'code' => 'CUS-' . strtoupper(Str::random(8)),
                    'name' => $validated['customer_name'],
                    'type' => 'Guest',
                    'email' => $validated['email'] ?? null,
                    'address' => $validated['address'],
                ],
            );

            $order = Order::create([
                'customer_id' => $customer->id,
                'customer_name' => $validated['customer_name'],
                'phone' => $phone,
                'address' => $validated['address'],
                'delivery_zone' => $validated['delivery_zone'] ?? null,
                'warehouse_id' => $validated['warehouse_id'] ?? null,
                'payment_method' => $validated['payment_method'],
                'delivery_charge' => $validated['delivery_charge'] ?? 0,
                'discount' => $validated['discount'] ?? 0,
                'notes' => $validated['notes'] ?? null,
                'status' => OrderStatus::Confirm, // staff-entered orders skip the fraud gate
                'order_source' => $validated['order_source'] ?? OrderSource::Pos->value,
                'created_by' => $request->user()->id,
            ]);

            $this->syncItems($order, $validated['items']);
            $customer->refreshOrderStats();

            return $order;
        });

        return response()->json(['data' => new OrderResource($order->load('items'))], 201);
    }

    /**
     * Replaces the line items wholesale, returning the old quantities to stock first.
     */
    public function update(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'max:32'],
            'address' => ['sometimes', 'string', 'max:1000'],
            'payment_method' => ['sometimes', 'string', 'max:30'],
            'delivery_charge' => ['sometimes', 'numeric', 'min:0'],
            'discount' => ['sometimes', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.product_id' => ['required_with:items', 'uuid', 'exists:products,id'],
            'items.*.variant_id' => ['nullable', 'uuid', 'exists:product_variants,id'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($validated, $order) {
            $order->fill(collect($validated)->except('items')->all());

            if (isset($validated['phone'])) {
                $order->phone = preg_replace('/\D/', '', $validated['phone']);
            }

            $order->save();

            if (isset($validated['items'])) {
                $this->releaseStock($order);
                $order->items()->delete();
                $this->syncItems($order, $validated['items']);
            } else {
                $this->recalculateTotals($order);
            }
        });

        return response()->json(['data' => new OrderResource($order->fresh()->load('items'))]);
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:' . implode(',', OrderStatus::values())],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $status = OrderStatus::from($validated['status']);
        $previous = $order->status;

        DB::transaction(function () use ($order, $status, $previous, $validated) {
            $order->update([
                'status' => $status,
                'status_reason' => $validated['reason'] ?? null,
            ]);

            // Cancelling or returning an unfulfilled order puts the goods back —
            // unless the courier already did it. CourierService::handleReturn()
            // restores stock against the consignment and marks the return row
            // `stock_restored`; that same return also settles the order as
            // `return`, so without this check a staff member confirming what the
            // courier already recorded would put the goods on the shelf twice.
            if ($status->isFailed() && ! $previous->isFailed() && ! $this->stockAlreadyRestored($order)) {
                $this->releaseStock($order, "Order marked {$status->value}");
            }

            if ($status->isTerminal() && $order->phone) {
                CustomerRiskProfile::recomputeFor($order->phone);
            }
        });

        return response()->json(['data' => new OrderResource($order->fresh()->load('items'))]);
    }

    public function destroy(Order $order): JsonResponse
    {
        DB::transaction(function () use ($order) {
            $this->releaseStock($order, 'Order deleted');
            $order->delete();
        });

        return response()->json(['message' => 'Order deleted.']);
    }

    /**
     * Counts per status for the dashboard tiles and the Sales tab bar.
     */
    public function statusCounts(Request $request): JsonResponse
    {
        // Scoped the same way as the list these tabs filter, or every tab would
        // promise more rows than clicking it produces.
        $shopOnly = $request->string('source')->value() === OrderSource::Shop->value;

        $scope = fn () => Order::query()
            ->when($shopOnly, fn ($q) => $q->shopSalesOnly(), fn ($q) => $q->excludingShopSales());

        $counts = $scope()
            ->when($request->filled('from'), fn ($q) => $q->whereDate('order_date', '>=', $request->date('from')))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('order_date', '<=', $request->date('to')))
            ->groupBy('status')
            ->pluck(DB::raw('count(*)'), 'status');

        $all = collect(OrderStatus::values())->mapWithKeys(fn ($s) => [$s => (int) ($counts[$s] ?? 0)]);

        return response()->json([
            'data' => $all->all() + [
                'total' => $all->sum(),
                // Its own tab in the orders list, so it is counted here rather
                // than derived from a status.
                'today' => $scope()->whereDate('order_date', Clock::today())->count(),
            ],
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $orders = $this->filtered($request)->with('items')->latest('created_at')->get();

        $columns = [
            'Order Number', 'Date', 'Status', 'Customer', 'Phone', 'Address',
            'Items', 'Subtotal', 'Discount', 'Delivery', 'Total', 'Payment', 'Source',
        ];

        return response()->streamDownload(function () use ($orders, $columns) {
            $handle = fopen('php://output', 'w');
            // BOM so Excel opens Bengali text in the address column correctly.
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, $columns);

            foreach ($orders as $order) {
                fputcsv($handle, [
                    $order->order_number,
                    $order->order_date?->toDateString(),
                    $order->status->value,
                    $order->customer_name,
                    $order->phone,
                    $order->address,
                    $order->items->map(fn ($i) => "{$i->product_name} x{$i->quantity}")->implode('; '),
                    $order->subtotal,
                    $order->discount,
                    $order->delivery_charge,
                    $order->total,
                    $order->payment_method,
                    $order->order_source,
                ]);
            }

            fclose($handle);
        }, 'orders-' . now()->format('Y-m-d') . '.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function filtered(Request $request)
    {
        return Order::query()
            // Shop sales are hidden unless asked for by name, so the Sales &
            // Orders list stays what it is for — the orders that need
            // confirming, dispatching and chasing. `?source=Shop` is what the
            // Shop Order panel sends, and it is how that panel is served without
            // a second endpoint.
            ->unless($request->string('source')->value() === OrderSource::Shop->value,
                fn ($q) => $q->excludingShopSales())
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('source'), fn ($q) => $q->where('order_source', $request->string('source')))
            ->when($request->filled('from'), fn ($q) => $q->whereDate('order_date', '>=', $request->date('from')))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('order_date', '<=', $request->date('to')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%' . $request->string('search') . '%';
                $q->where(fn ($sub) => $sub->where('order_number', 'like', $term)
                    ->orWhere('customer_name', 'like', $term)
                    ->orWhere('phone', 'like', $term));
            });
    }

    /**
     * @param  array<int, array{product_id:string, variant_id:?string, quantity:int, unit_price:?float}>  $items
     */
    private function syncItems(Order $order, array $items): void
    {
        foreach ($items as $item) {
            $product = Product::findOrFail($item['product_id']);
            $variant = ! empty($item['variant_id']) ? ProductVariant::find($item['variant_id']) : null;

            // Staff may override the price (negotiated sale); default to the catalogue.
            $unitPrice = $item['unit_price'] ?? (float) ($variant?->sell_price ?? $product->sell_price);

            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'variant_id' => $variant?->id,
                'product_name' => $product->name,
                'variant_label' => $variant ? trim(implode(' / ', array_filter([$variant->size, $variant->color]))) ?: null : null,
                'quantity' => $item['quantity'],
                'unit_price' => $unitPrice,
            ]);

            $this->stock->deductForOrder($product, $item['quantity'], $order->id, $variant);
        }

        $this->recalculateTotals($order->fresh());
    }

    private function recalculateTotals(Order $order): void
    {
        $order->loadMissing('items');

        $subtotal = $order->items->sum(fn ($i) => $i->quantity * (float) $i->unit_price);

        $order->update([
            'items_count' => $order->items->sum('quantity'),
            'subtotal' => $subtotal,
            'total' => round($subtotal - (float) $order->discount + (float) $order->delivery_charge, 2),
        ]);
    }

    /**
     * Returns every line's quantity to stock. Used when an order is edited,
     * cancelled or deleted.
     */
    /**
     * Whether a courier return has already put this order's goods back.
     *
     * `courier_returns.stock_restored` is the flag CourierService sets after it
     * restores, and it is the only record that the shelf has already been
     * credited — the order row itself says nothing about it.
     */
    private function stockAlreadyRestored(Order $order): bool
    {
        return CourierReturn::where('order_id', $order->id)
            ->where('stock_restored', true)
            ->exists();
    }

    private function releaseStock(Order $order, string $notes = 'Order items replaced'): void
    {
        $order->loadMissing('items.product', 'items.variant');

        foreach ($order->items as $item) {
            if (! $item->product) {
                continue;
            }

            $this->stock->restoreForOrder($item->product, $item->quantity, $order->id, $item->variant, $notes);
        }
    }
}
