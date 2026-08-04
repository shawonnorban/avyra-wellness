<?php

namespace App\Services;

use App\Models\OtpLog;
use App\Models\OtpVerification;
use App\Models\Setting;
use App\Services\Sms\SmsManager;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class OtpService
{
    public function __construct(private readonly SmsManager $sms) {}

    /**
     * Issues a code and sends it. Returns [ok, message].
     * Rate limited per phone so the endpoint cannot be used to burn SMS credit.
     */
    public function send(string $phone): array
    {
        $phone = $this->normalize($phone);
        $config = $this->config();

        $limiterKey = 'otp-send:' . $phone;
        if (RateLimiter::tooManyAttempts($limiterKey, 3)) {
            $seconds = RateLimiter::availableIn($limiterKey);

            return [false, "Please wait {$seconds} seconds before requesting another code."];
        }
        RateLimiter::hit($limiterKey, 600); // 3 sends per 10 minutes

        $code = (string) random_int(100000, 999999);

        // Supersede any outstanding code for this number so only the newest works.
        OtpVerification::where('phone', $phone)->where('verified', false)->delete();

        OtpVerification::create([
            'phone' => $phone,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes((int) $config['otp_expiry_minutes']),
        ]);

        $message = str_replace('{otp}', $code, (string) $config['otp_template']);
        $gateway = $this->sms->gateway();
        $result = $gateway->send($phone, $message);

        OtpLog::create([
            'phone' => $phone,
            'provider' => $gateway->name(),
            'success' => $result->success,
            'response_code' => $result->responseCode,
            'error_reason' => $result->errorReason,
            'detail' => $result->detail,
        ]);

        return $result->success
            ? [true, 'A verification code has been sent.']
            : [false, 'Could not send the verification code. Please try again.'];
    }

    /**
     * Checks a submitted code. Returns [ok, message].
     */
    public function verify(string $phone, string $code): array
    {
        $phone = $this->normalize($phone);
        $config = $this->config();

        $otp = OtpVerification::where('phone', $phone)
            ->where('verified', false)
            ->latest('created_at')
            ->first();

        if (! $otp) {
            return [false, 'No verification code is pending for this number.'];
        }

        if ($otp->isExpired()) {
            return [false, 'This verification code has expired. Please request a new one.'];
        }

        if ($otp->attempts >= (int) $config['otp_max_attempts']) {
            return [false, 'Too many incorrect attempts. Please request a new code.'];
        }

        // Count the attempt before checking, so a wrong guess always costs one.
        $otp->increment('attempts');

        if (! Hash::check($code, $otp->code_hash)) {
            return [false, 'The verification code is incorrect.'];
        }

        $otp->update(['verified' => true, 'verified_at' => now()]);

        return [true, 'Phone number verified.'];
    }

    /**
     * True when this phone completed verification recently enough to place an order.
     */
    public function isVerified(string $phone): bool
    {
        return OtpVerification::where('phone', $this->normalize($phone))
            ->where('verified', true)
            ->where('verified_at', '>=', now()->subMinutes(30))
            ->exists();
    }

    private function config(): array
    {
        return array_merge([
            'otp_template' => 'Your Avyra verification code is {otp}',
            'otp_expiry_minutes' => 5,
            'otp_max_attempts' => 5,
        ], Setting::get('sms', []) ?: []);
    }

    private function normalize(string $phone): string
    {
        return preg_replace('/\D/', '', $phone) ?? '';
    }
}
