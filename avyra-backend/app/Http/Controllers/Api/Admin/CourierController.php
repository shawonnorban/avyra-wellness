<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourierConsignmentResource;
use App\Models\CourierConsignment;
use App\Models\CourierReturn;
use App\Models\Order;
use App\Services\Courier\CourierService;
use App\Services\Courier\CourierStatus;
use App\Services\Courier\SteadfastClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Throwable;

class CourierController extends Controller
{
    public function __construct(
        private readonly CourierService $courier,
        private readonly SteadfastClient $steadfast,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $consignments = CourierConsignment::query()
            ->with('order')
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%' . $request->string('search') . '%';
                $q->where(fn ($sub) => $sub->where('invoice', 'like', $term)
                    ->orWhere('tracking_code', 'like', $term)
                    ->orWhere('consignment_id', 'like', $term)
                    ->orWhere('recipient_phone', 'like', $term));
            })
            ->latest('created_at')
            ->paginate($request->integer('per_page', 25))
            ->withQueryString();

        return CourierConsignmentResource::collection($consignments);
    }

    public function show(CourierConsignment $consignment): JsonResponse
    {
        $consignment->load(['order', 'statusLogs' => fn ($q) => $q->latest('logged_at')]);

        return response()->json(['data' => new CourierConsignmentResource($consignment)]);
    }

    public function dispatchOrder(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate(['note' => ['nullable', 'string', 'max:500']]);

        try {
            $consignment = $this->courier->dispatch($order, $validated['note'] ?? null);
        } catch (Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => new CourierConsignmentResource($consignment)], 201);
    }

    /**
     * Dispatches several orders in one click. Each order is independent — one
     * failure is reported but does not abort the rest.
     */
    public function bulkDispatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_ids' => ['required', 'array', 'min:1', 'max:100'],
            'order_ids.*' => ['uuid', 'exists:orders,id'],
        ]);

        $dispatched = [];
        $failed = [];

        foreach (Order::whereIn('id', $validated['order_ids'])->get() as $order) {
            try {
                $consignment = $this->courier->dispatch($order);
                $dispatched[] = ['order_number' => $order->order_number, 'tracking_code' => $consignment->tracking_code];
            } catch (Throwable $e) {
                $failed[] = ['order_number' => $order->order_number, 'reason' => $e->getMessage()];
            }
        }

        return response()->json(['dispatched' => $dispatched, 'failed' => $failed]);
    }

    public function sync(CourierConsignment $consignment): JsonResponse
    {
        try {
            $consignment = $this->courier->sync($consignment);
        } catch (Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => new CourierConsignmentResource($consignment)]);
    }

    public function balance(): JsonResponse
    {
        try {
            return response()->json(['data' => $this->steadfast->balance()]);
        } catch (Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function createReturn(Request $request, CourierConsignment $consignment): JsonResponse
    {
        $validated = $request->validate(['reason' => ['required', 'string', 'max:255']]);

        try {
            if ($consignment->consignment_id) {
                $this->steadfast->createReturn($consignment->consignment_id, $validated['reason']);
            }
        } catch (Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $return = $this->courier->handleReturn($consignment, $validated['reason']);
        $this->courier->applyStatus($consignment, CourierStatus::RETURNED, null, 'manual', $validated['reason']);

        return response()->json(['data' => $return], 201);
    }

    public function returns(Request $request): JsonResponse
    {
        $returns = CourierReturn::with(['consignment', 'order'])
            ->latest('created_at')
            ->paginate($request->integer('per_page', 25));

        return response()->json($returns);
    }

    public function stats(): JsonResponse
    {
        $counts = CourierConsignment::selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $total = (int) $counts->sum();
        $pct = fn (string $status) => $total > 0 ? round(((int) ($counts[$status] ?? 0)) / $total * 100, 1) : 0.0;

        return response()->json([
            'data' => [
                'total' => $total,
                'by_status' => $counts,
                'in_transit_pct' => $pct(CourierStatus::IN_TRANSIT),
                'delivered_pct' => $pct(CourierStatus::DELIVERED),
                'returned_pct' => $pct(CourierStatus::RETURNED),
            ],
        ]);
    }
}
