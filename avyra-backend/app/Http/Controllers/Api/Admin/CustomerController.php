<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerRiskProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $customers = Customer::query()
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%' . $request->string('search') . '%';
                $q->where(fn ($sub) => $sub->where('name', 'like', $term)
                    ->orWhere('phone', 'like', $term)
                    ->orWhere('code', 'like', $term)
                    ->orWhere('email', 'like', $term));
            })
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->string('type')))
            ->orderByDesc('last_order_date')
            ->paginate($request->integer('per_page', 25));

        return response()->json($customers);
    }

    public function show(Customer $customer): JsonResponse
    {
        $customer->load(['orders' => fn ($q) => $q->with('items')->latest('order_date')]);

        return response()->json([
            'data' => $customer,
            'risk_profile' => $customer->phone
                ? CustomerRiskProfile::where('phone', $customer->phone)->first()
                : null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules());

        $validated['code'] ??= 'CUS-' . strtoupper(Str::random(8));
        $validated['phone'] = preg_replace('/\D/', '', $validated['phone'] ?? '') ?: null;

        return response()->json(['data' => Customer::create($validated)], 201);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate($this->rules($customer->id));

        if (isset($validated['phone'])) {
            $validated['phone'] = preg_replace('/\D/', '', $validated['phone']);
        }

        $customer->update($validated);

        return response()->json(['data' => $customer->fresh()]);
    }

    public function destroy(Customer $customer): JsonResponse
    {
        if ($customer->orders()->exists()) {
            return response()->json([
                'message' => 'This customer has orders and cannot be deleted.',
            ], 422);
        }

        $customer->delete();

        return response()->json(['message' => 'Customer deleted.']);
    }

    public function stats(): JsonResponse
    {
        $revenue = (float) Customer::sum('total_spent');
        $orderCount = (int) \App\Models\Order::status(OrderStatus::Delivered)->count();

        return response()->json([
            'data' => [
                'total' => Customer::count(),
                'new_this_month' => Customer::where('created_at', '>=', now()->startOfMonth())->count(),
                'registered' => Customer::where('type', 'Registered')->count(),
                'guest' => Customer::where('type', 'Guest')->count(),
                'total_revenue' => $revenue,
                'average_order_value' => $orderCount > 0 ? round($revenue / $orderCount, 2) : 0.0,
            ],
        ]);
    }

    private function rules(?string $ignoreId = null): array
    {
        return [
            'code' => ['nullable', 'string', 'max:32', 'unique:customers,code' . ($ignoreId ? ",{$ignoreId}" : '')],
            'name' => [$ignoreId ? 'sometimes' : 'required', 'string', 'max:255'],
            'type' => ['nullable', 'in:Registered,Guest'],
            'phone' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
