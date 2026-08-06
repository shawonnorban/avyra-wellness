<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\CustomerSegmentService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * The customer lists behind Meta Lookalike Audiences.
 *
 * The export is a plain CSV of phone numbers, which is what Ads Manager's
 * customer-list upload takes; Meta hashes them on its side, so nothing is hashed
 * here — a pre-hashed column would simply fail to match.
 */
class CustomerSegmentController extends Controller
{
    public function __construct(private readonly CustomerSegmentService $segments) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => collect(CustomerSegmentService::SEGMENTS)
                ->map(fn ($label, $key) => [
                    'key' => $key,
                    'label' => $label,
                    'count' => 0,
                ])
                ->values()
                ->all(),
            'counts' => $this->segments->counts(),
        ]);
    }

    public function show(string $segment): JsonResponse
    {
        abort_unless(array_key_exists($segment, CustomerSegmentService::SEGMENTS), 404);

        return response()->json([
            'data' => $this->segments->rows($segment),
            'label' => CustomerSegmentService::SEGMENTS[$segment],
        ]);
    }

    public function export(string $segment): StreamedResponse
    {
        abort_unless(array_key_exists($segment, CustomerSegmentService::SEGMENTS), 404);

        $rows = $this->segments->rows($segment);
        $filename = 'avyra-' . str_replace('_', '-', $segment) . '-' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');

            // `phone` is the header Ads Manager recognises for the identifier
            // column; the rest are ignored by the upload but useful to a human.
            fputcsv($handle, ['phone', 'name', 'orders', 'value', 'last_order']);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['phone'],
                    $row['name'],
                    $row['orders'],
                    $row['value'],
                    $row['last_order'],
                ]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }
}
