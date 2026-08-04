<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductStockMovement;
use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function index(): JsonResponse
    {
        $warehouses = Warehouse::withCount('stockMovements')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $warehouses]);
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(['data' => Warehouse::create($request->validate($this->rules()))], 201);
    }

    public function update(Request $request, Warehouse $warehouse): JsonResponse
    {
        $warehouse->update($request->validate($this->rules($warehouse->id)));

        return response()->json(['data' => $warehouse->fresh()]);
    }

    public function destroy(Warehouse $warehouse): JsonResponse
    {
        // Stock movements reference the warehouse, so retire it instead of deleting.
        if (ProductStockMovement::where('warehouse_id', $warehouse->id)->exists()) {
            $warehouse->update(['is_active' => false]);

            return response()->json(['message' => 'Warehouse has stock history and was deactivated.']);
        }

        $warehouse->delete();

        return response()->json(['message' => 'Warehouse deleted.']);
    }

    private function rules(?string $ignoreId = null): array
    {
        return [
            'name' => [$ignoreId ? 'sometimes' : 'required', 'string', 'max:255'],
            'code' => [
                $ignoreId ? 'sometimes' : 'required',
                'string',
                'max:32',
                'unique:warehouses,code' . ($ignoreId ? ",{$ignoreId}" : ''),
            ],
            'address' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ];
    }
}
