<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCheckoutRequest;
use App\Models\Coupon;
use App\Models\Setting;
use App\Services\CheckoutService;
use App\Services\Facebook\BrowserTrackingPayload;
use App\Services\Fraud\FraudDetectionService;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly CheckoutService $checkout,
        private readonly FraudDetectionService $fraud,
        private readonly OtpService $otp,
        private readonly BrowserTrackingPayload $tracking,
    ) {}

    public function store(StoreCheckoutRequest $request): JsonResponse
    {
        $data = $request->validated();

        // The client cannot be trusted to report its own IP, so it is read from the
        // connection. Configure trusted proxies before running behind a CDN.
        $attempt = [
            'phone' => $data['phone'],
            'ip' => $request->ip(),
            'device' => $data['device_fingerprint'] ?? null,
            'address' => $data['address'],
        ];

        if ($this->otpRequired() && ! $this->otp->isVerified($data['phone'])) {
            return response()->json([
                'message' => 'Please verify your phone number before placing the order.',
                'code' => 'otp_required',
            ], 422);
        }

        $assessment = $this->fraud->assess($attempt);

        if ($assessment->isBlocked()) {
            $this->fraud->record($assessment, $attempt);

            $company = Setting::get('company', []) ?: [];

            return response()->json([
                'message' => $assessment->blockMessage,
                'code' => 'order_blocked',
                'whatsapp' => $company['whatsapp'] ?? null,
            ], 422);
        }

        $this->fraud->logAllowedAttempt($attempt);

        // Both are read from the connection, never the body, and stored on the order
        // so the later Lead and Purchase events can reuse them for match quality.
        $order = $this->checkout->place($data, $request->ip(), $request->userAgent());

        $this->fraud->record($assessment, $attempt, $order);

        return response()->json([
            'data' => [
                'order_number' => $order->order_number,
                'total' => (float) $order->total,
                'subtotal' => (float) $order->subtotal,
                'discount' => (float) $order->discount,
                'delivery_charge' => (float) $order->delivery_charge,
                'items' => $order->items->map(fn ($i) => [
                    'product_name' => $i->product_name,
                    'variant_label' => $i->variant_label,
                    'quantity' => $i->quantity,
                    'unit_price' => (float) $i->unit_price,
                ]),
                // Everything the browser needs to fire its half of the Lead, with
                // the same event_id the server used. Handed over rather than
                // recomputed on the client: the browser tag is configured in GTM
                // by hand, and a formula both sides must reproduce is exactly what
                // breaks deduplication.
                'tracking' => $this->tracking->leadPayload($order),
            ],
        ], 201);
    }

    /**
     * Pre-validates a coupon so the cart can show the discount before submit.
     */
    public function validateCoupon(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:64'],
            'subtotal' => ['required', 'numeric', 'min:0'],
        ]);

        $coupon = Coupon::whereRaw('LOWER(code) = ?', [mb_strtolower($validated['code'])])->first();
        $subtotal = (float) $validated['subtotal'];

        if (! $coupon || ! $coupon->isRedeemable($subtotal)) {
            return response()->json([
                'valid' => false,
                'message' => 'This coupon is not valid for your order.',
            ], 422);
        }

        return response()->json([
            'valid' => true,
            'code' => $coupon->code,
            'discount' => $coupon->discountFor($subtotal),
        ]);
    }

    private function otpRequired(): bool
    {
        return (bool) (Setting::get('order', [])['require_otp'] ?? false);
    }
}
