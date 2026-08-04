<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourierConsignment;
use App\Models\Setting;
use App\Services\Courier\CourierService;
use App\Services\Courier\CourierStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CourierWebhookController extends Controller
{
    public function __construct(private readonly CourierService $courier) {}

    /**
     * Inbound status push from Steadfast. Authenticated with a shared bearer token
     * configured under Settings → Courier; requests without it are rejected before
     * anything is read from the body.
     */
    public function steadfast(Request $request): JsonResponse
    {
        $expected = (string) (Setting::get('courier_steadfast', [])['webhook_token'] ?? '');

        if ($expected === '' || ! hash_equals($expected, (string) $request->bearerToken())) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $validated = $request->validate([
            'consignment_id' => ['nullable'],
            'invoice' => ['nullable', 'string', 'max:64'],
            'status' => ['required', 'string', 'max:64'],
            'notification_type' => ['nullable', 'string', 'max:64'],
        ]);

        $consignment = CourierConsignment::query()
            ->when(
                filled($validated['consignment_id'] ?? null),
                fn ($q) => $q->where('consignment_id', (string) $validated['consignment_id']),
                fn ($q) => $q->where('invoice', $validated['invoice'] ?? '__none__'),
            )
            ->first();

        if (! $consignment) {
            // Answer 200 so the courier does not retry forever on an order we do not
            // have; the log is enough to investigate.
            Log::warning('Steadfast webhook for unknown consignment', $validated);

            return response()->json(['message' => 'No matching consignment.']);
        }

        $this->courier->applyStatus(
            $consignment,
            CourierStatus::fromSteadfast($validated['status']),
            $validated['status'],
            'webhook',
        );

        return response()->json(['message' => 'Applied.']);
    }
}
