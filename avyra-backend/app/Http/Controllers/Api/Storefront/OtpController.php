<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OtpController extends Controller
{
    public function __construct(private readonly OtpService $otp) {}

    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:32'],
        ]);

        [$ok, $message] = $this->otp->send($validated['phone']);

        return response()->json(['sent' => $ok, 'message' => $message], $ok ? 200 : 429);
    }

    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:32'],
            'code' => ['required', 'string', 'max:10'],
        ]);

        [$ok, $message] = $this->otp->verify($validated['phone'], $validated['code']);

        return response()->json(['verified' => $ok, 'message' => $message], $ok ? 200 : 422);
    }
}
