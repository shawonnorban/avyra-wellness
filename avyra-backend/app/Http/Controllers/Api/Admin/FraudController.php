<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlockedDevice;
use App\Models\BlockedIp;
use App\Models\BlockedPhone;
use App\Models\CustomerRiskProfile;
use App\Models\OrderRiskScore;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FraudController extends Controller
{
    public function settings(): JsonResponse
    {
        return response()->json(['data' => Setting::get('fraud_detection', [])]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
            'phone_block_minutes' => ['required', 'integer', 'min:0', 'max:10080'],
            'ip_block_minutes' => ['required', 'integer', 'min:0', 'max:10080'],
            'device_fingerprinting' => ['required', 'boolean'],
            'min_phone_digits' => ['required', 'integer', 'min:0', 'max:20'],
            'min_address_length' => ['required', 'integer', 'min:0', 'max:500'],
            'delivery_success_threshold' => ['required', 'numeric', 'min:0', 'max:100'],
            'block_message' => ['required', 'string', 'max:1000'],
        ]);

        Setting::put('fraud_detection', $validated);

        return response()->json(['data' => $validated]);
    }

    /**
     * Attempts the scoring engine refused or flagged, newest first.
     */
    public function blockedOrders(Request $request): JsonResponse
    {
        $scores = OrderRiskScore::with('order')
            ->when(
                $request->filled('level'),
                fn ($q) => $q->where('risk_level', $request->string('level')),
                fn ($q) => $q->whereIn('action_taken', ['blocked', 'flagged']),
            )
            ->latest('created_at')
            ->paginate($request->integer('per_page', 25));

        return response()->json($scores);
    }

    public function riskProfiles(Request $request): JsonResponse
    {
        $profiles = CustomerRiskProfile::query()
            ->when($request->filled('search'), fn ($q) => $q->where('phone', 'like', '%' . $request->string('search') . '%'))
            ->when($request->filled('flag'), fn ($q) => $q->where('risk_flag', $request->string('flag')))
            ->orderByDesc('failure_rate')
            ->paginate($request->integer('per_page', 25));

        return response()->json($profiles);
    }

    public function toggleWhitelist(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:32'],
            'is_whitelisted' => ['required', 'boolean'],
        ]);

        $phone = preg_replace('/\D/', '', $validated['phone']);

        $profile = CustomerRiskProfile::firstOrNew(['phone' => $phone]);
        $profile->is_whitelisted = $validated['is_whitelisted'];
        $profile->save();

        return response()->json(['data' => $profile]);
    }

    public function blocklist(Request $request): JsonResponse
    {
        return response()->json([
            'data' => [
                'phones' => BlockedPhone::latest('created_at')->get(),
                'ips' => BlockedIp::latest('created_at')->get(),
                'devices' => BlockedDevice::latest('created_at')->get(),
            ],
        ]);
    }

    public function block(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:phone,ip,device'],
            'value' => ['required', 'string', 'max:255'],
            'reason' => ['nullable', 'string', 'max:255'],
            'device_info' => ['nullable', 'string', 'max:255'],
        ]);

        $userId = $request->user()->id;

        $record = match ($validated['type']) {
            'phone' => BlockedPhone::updateOrCreate(
                ['phone' => preg_replace('/\D/', '', $validated['value'])],
                ['reason' => $validated['reason'] ?? null, 'is_active' => true, 'blocked_by' => $userId],
            ),
            'ip' => BlockedIp::updateOrCreate(
                ['ip_address' => $validated['value']],
                ['reason' => $validated['reason'] ?? null, 'is_active' => true, 'blocked_by' => $userId],
            ),
            'device' => BlockedDevice::updateOrCreate(
                ['device_fingerprint' => $validated['value']],
                [
                    'reason' => $validated['reason'] ?? null,
                    'device_info' => $validated['device_info'] ?? null,
                    'is_active' => true,
                    'blocked_by' => $userId,
                ],
            ),
        };

        return response()->json(['data' => $record], 201);
    }

    public function unblock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:phone,ip,device'],
            'id' => ['required', 'uuid'],
        ]);

        // Deactivate rather than delete so the block history survives.
        $model = match ($validated['type']) {
            'phone' => BlockedPhone::findOrFail($validated['id']),
            'ip' => BlockedIp::findOrFail($validated['id']),
            'device' => BlockedDevice::findOrFail($validated['id']),
        };

        $model->update(['is_active' => false]);

        return response()->json(['message' => 'Unblocked.']);
    }

    public function stats(): JsonResponse
    {
        return response()->json([
            'data' => [
                'blocked_today' => OrderRiskScore::blocked()->whereDate('created_at', today())->count(),
                'blocked_total' => OrderRiskScore::blocked()->count(),
                'flagged_total' => OrderRiskScore::where('action_taken', 'flagged')->count(),
                'blocked_phones' => BlockedPhone::where('is_active', true)->count(),
                'blocked_ips' => BlockedIp::where('is_active', true)->count(),
                'blocked_devices' => BlockedDevice::where('is_active', true)->count(),
                'high_risk_customers' => CustomerRiskProfile::whereIn('risk_flag', ['High', 'Critical'])->count(),
            ],
        ]);
    }
}
