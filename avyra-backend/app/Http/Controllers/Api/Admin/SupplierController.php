<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $suppliers = Supplier::query()
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%' . $request->string('search') . '%';
                $q->where(fn ($sub) => $sub->where('name', 'like', $term)
                    ->orWhere('code', 'like', $term)
                    ->orWhere('contact_phone', 'like', $term));
            })
            ->orderBy('name')
            ->paginate($request->integer('per_page', 25));

        return response()->json($suppliers);
    }

    public function show(Supplier $supplier): JsonResponse
    {
        return response()->json([
            'data' => $supplier->load([
                'purchases' => fn ($q) => $q->latest('order_date')->limit(50),
                'payments' => fn ($q) => $q->latest('payment_date')->limit(50),
            ]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules());

        $validated['code'] ??= 'SUP-' . strtoupper(Str::random(6));

        return response()->json(['data' => Supplier::create($validated)], 201);
    }

    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $supplier->update($request->validate($this->rules($supplier->id)));

        return response()->json(['data' => $supplier->fresh()]);
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        // Retire rather than delete: purchases reference this row.
        $supplier->update(['is_active' => false]);

        return response()->json(['message' => 'Supplier deactivated.']);
    }

    private function rules(?string $ignoreId = null): array
    {
        return [
            'code' => ['nullable', 'string', 'max:32', 'unique:suppliers,code' . ($ignoreId ? ",{$ignoreId}" : '')],
            'name' => [$ignoreId ? 'sometimes' : 'required', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:32'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:1000'],
            'payment_terms' => ['nullable', 'string', 'max:100'],
            'is_active' => ['boolean'],
        ];
    }
}
