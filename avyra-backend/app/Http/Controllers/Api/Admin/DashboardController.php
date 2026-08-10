<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Support\Clock;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $byStatus = Order::selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $count = fn (OrderStatus $s) => (int) ($byStatus[$s->value] ?? 0);

        return response()->json([
            'data' => [
                'orders' => [
                    'total' => (int) $byStatus->sum(),
                    'today' => Order::whereDate('order_date', Clock::today())->count(),
                    'confirmed' => $count(OrderStatus::Confirm),
                    'delivered' => $count(OrderStatus::Delivered),
                    'cancelled' => $count(OrderStatus::Cancel),
                    'hold' => $count(OrderStatus::Hold),
                    'fake' => $count(OrderStatus::Fake),
                    'pending' => $count(OrderStatus::Pending),
                ],
                'customers' => Customer::count(),
                'revenue' => [
                    // Only settled orders count as revenue. `order_date` is a
                    // local calendar date, so it is compared against local dates.
                    'today' => $this->revenue(Clock::today(), Clock::today()),
                    'this_month' => $this->revenue(
                        Clock::now()->startOfMonth()->toDateString(),
                        Clock::now()->endOfMonth()->toDateString(),
                    ),
                ],
                'inventory' => [
                    'low_stock' => Product::whereColumn('quantity', '<=', 'min_stock')->where('quantity', '>', 0)->count(),
                    'out_of_stock' => Product::where('quantity', 0)->count(),
                    'stock_value' => $this->stockValue(),
                ],
            ],
        ]);
    }

    /**
     * Revenue by day for the dashboard chart.
     */
    public function revenueChart(): JsonResponse
    {
        $rows = Order::selectRaw('order_date, SUM(total) as revenue, COUNT(*) as orders')
            ->where('status', OrderStatus::Delivered->value)
            ->where('order_date', '>=', Clock::now()->subDays(29)->toDateString())
            ->groupBy('order_date')
            ->orderBy('order_date')
            ->get();

        return response()->json([
            'data' => $rows->map(fn ($r) => [
                'date' => $r->order_date,
                'revenue' => (float) $r->revenue,
                'orders' => (int) $r->orders,
            ]),
        ]);
    }

    public function recentOrders(): JsonResponse
    {
        $orders = Order::latest('created_at')->limit(10)->get([
            // `created_at` carries the clock time; `order_date` is a date column
            // and would render every row at midnight.
            'id', 'order_number', 'customer_name', 'phone', 'total', 'status',
            'order_date', 'order_source', 'created_at',
        ]);

        return response()->json(['data' => $orders]);
    }

    public function topProducts(): JsonResponse
    {
        $rows = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.status', OrderStatus::Delivered->value)
            ->selectRaw('order_items.product_name, SUM(order_items.quantity) as units, SUM(order_items.quantity * order_items.unit_price) as revenue')
            ->groupBy('order_items.product_name')
            ->orderByDesc('units')
            ->limit(10)
            ->get();

        return response()->json(['data' => $rows]);
    }

    private function revenue($from, $to): float
    {
        return (float) Order::where('status', OrderStatus::Delivered->value)
            ->whereBetween('order_date', [$from, $to])
            ->sum('total');
    }

    /**
     * What the stock on hand is worth at cost.
     *
     * A product with variants carries its stock on the variants, each with its
     * own cost — the product's `cost_price` is only the base figure shown on
     * the listing. Pricing every piece at that base overstated the total: 248
     * pieces at the 500gm cost, when 150 of them were the cheaper 250gm.
     *
     * So variants are valued from the variants, and only products without any
     * fall back to their own columns.
     */
    private function stockValue(): float
    {
        $fromVariants = (float) ProductVariant::selectRaw(
            'COALESCE(SUM(quantity * cost_price), 0) as v',
        )->value('v');

        $fromPlainProducts = (float) Product::whereDoesntHave('variants')
            ->selectRaw('COALESCE(SUM(quantity * cost_price), 0) as v')
            ->value('v');

        return round($fromVariants + $fromPlainProducts, 2);
    }
}
