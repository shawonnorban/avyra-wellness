<?php

namespace App\Services\Fraud;

use App\Enums\OrderStatus;
use App\Models\BlockedDevice;
use App\Models\BlockedIp;
use App\Models\BlockedPhone;
use App\Models\CustomerRiskProfile;
use App\Models\FraudAttemptLog;
use App\Models\Order;
use App\Models\OrderRiskScore;
use App\Models\Setting;

/**
 * Scores a checkout attempt before the order is created.
 *
 * Scoring follows the rules the previous system documented: any single hard signal
 * contributes 100 and therefore blocks on its own, while soft signals accumulate.
 * Levels: Low <30, Medium 30-59, High 60-99, Critical >=100 (blocked).
 */
class FraudDetectionService
{
    private const HARD_BLOCK = 100;

    private array $config;

    public function __construct()
    {
        $this->config = array_merge([
            'enabled' => true,
            'phone_block_minutes' => 60,
            'ip_block_minutes' => 30,
            'device_fingerprinting' => true,
            'min_phone_digits' => 11,
            'min_address_length' => 15,
            'delivery_success_threshold' => 40,
            'block_message' => 'দুঃখিত, আপনার অর্ডারটি এই মুহূর্তে সম্পন্ন করা যাচ্ছে না।',
        ], Setting::get('fraud_detection', []) ?: []);
    }

    /**
     * @param  array{phone:string, ip:?string, device:?string, address:?string}  $attempt
     */
    public function assess(array $attempt): RiskAssessment
    {
        $message = (string) $this->config['block_message'];

        if (! $this->config['enabled']) {
            return new RiskAssessment(0, [], $message);
        }

        $phone = $this->normalizePhone($attempt['phone'] ?? '');
        $ip = $attempt['ip'] ?? null;
        $device = $attempt['device'] ?? null;
        $address = trim((string) ($attempt['address'] ?? ''));

        $whitelisted = $phone !== ''
            && CustomerRiskProfile::where('phone', $phone)->value('is_whitelisted');

        $signals = [];

        // --- Manual blocklists. These apply even to whitelisted numbers. ---
        if ($phone !== '' && BlockedPhone::where('phone', $phone)->where('is_active', true)->exists()) {
            $signals[] = $this->signal('phone_blocked', 'Phone number is on the blocklist', self::HARD_BLOCK);
        }

        if ($ip && BlockedIp::where('ip_address', $ip)->where('is_active', true)->exists()) {
            $signals[] = $this->signal('ip_blocked', 'IP address is on the blocklist', self::HARD_BLOCK);
        }

        if ($device && BlockedDevice::where('device_fingerprint', $device)->where('is_active', true)->exists()) {
            $signals[] = $this->signal('device_blocked', 'Device is on the blocklist', self::HARD_BLOCK);
        }

        // --- Repeat-attempt windows. ---
        $phoneWindow = (int) $this->config['phone_block_minutes'];
        if (! $whitelisted && $phone !== '' && $phoneWindow > 0) {
            $recent = Order::where('phone', $phone)
                ->where('created_at', '>=', now()->subMinutes($phoneWindow))
                ->exists();

            if ($recent) {
                $signals[] = $this->signal(
                    'phone_repeat',
                    "Another order from this phone within {$phoneWindow} min",
                    self::HARD_BLOCK,
                );
            }
        }

        // Whitelisting is an explicit "stop auto-blocking this buyer" decision, so it
        // clears the IP and device windows too — otherwise a repeat customer ordering
        // from the same home connection stays blocked and the flag does nothing.
        // The manual blocklists above are unaffected.
        $ipWindow = (int) $this->config['ip_block_minutes'];
        if (! $whitelisted && $ip && $ipWindow > 0) {
            $recent = FraudAttemptLog::where('ip_address', $ip)
                ->where('created_at', '>=', now()->subMinutes($ipWindow))
                ->exists();

            if ($recent) {
                $signals[] = $this->signal(
                    'ip_repeat',
                    "Another checkout from this IP within {$ipWindow} min",
                    self::HARD_BLOCK,
                );
            }
        }

        // Device repeat uses the phone window: it is the stricter of the two and
        // catches the VPN case where the IP changes but the browser does not.
        if (! $whitelisted && $this->config['device_fingerprinting'] && $device && $phoneWindow > 0) {
            $recent = FraudAttemptLog::where('device_fingerprint', $device)
                ->where('created_at', '>=', now()->subMinutes($phoneWindow))
                ->exists();

            if ($recent) {
                $signals[] = $this->signal(
                    'device_repeat',
                    'Another checkout from this device within the block window',
                    self::HARD_BLOCK,
                );
            }
        }

        // --- History signals. Skipped for whitelisted customers. ---
        if (! $whitelisted && $phone !== '') {
            $lastStatus = Order::where('phone', $phone)->latest('created_at')->value('status');
            $lastStatus = $lastStatus instanceof OrderStatus ? $lastStatus : OrderStatus::tryFrom((string) $lastStatus);

            if ($lastStatus && $lastStatus === OrderStatus::Cancel) {
                $signals[] = $this->signal('previous_failed', 'Previous order was cancelled or returned', 40);
            }

            $profile = CustomerRiskProfile::where('phone', $phone)->first();
            $settled = $profile ? $profile->delivered + $profile->failed : 0;

            // Only meaningful once there is a real history to judge.
            if ($profile && $settled >= 3) {
                $successRate = $profile->delivered / $settled * 100;

                if ($successRate < (float) $this->config['delivery_success_threshold']) {
                    $signals[] = $this->signal(
                        'low_delivery_rate',
                        sprintf('Delivery success rate %.0f%% is below threshold', $successRate),
                        60,
                    );
                }
            }
        }

        // --- Data-quality signals. ---
        if (strlen($phone) < (int) $this->config['min_phone_digits']) {
            $signals[] = $this->signal('short_phone', 'Phone number is too short to be valid', 50);
        }

        if ($address !== '' && mb_strlen($address) < (int) $this->config['min_address_length']) {
            $signals[] = $this->signal('short_address', 'Delivery address is implausibly short', 30);
        }

        $score = array_sum(array_column($signals, 'score'));

        return new RiskAssessment($score, $signals, $message);
    }

    /**
     * Records the attempt so the next request can detect a repeat. Only allowed
     * attempts are logged — a blocked attempt must not extend its own window.
     */
    public function logAllowedAttempt(array $attempt): void
    {
        FraudAttemptLog::create([
            'phone' => $this->normalizePhone($attempt['phone'] ?? ''),
            'ip_address' => $attempt['ip'] ?? null,
            'device_fingerprint' => $attempt['device'] ?? null,
        ]);
    }

    /**
     * Persists the assessment for the Fraud → Blocked Orders screen.
     * `$order` is null when the attempt was refused before an order existed.
     */
    public function record(RiskAssessment $assessment, array $attempt, ?Order $order = null): OrderRiskScore
    {
        return OrderRiskScore::create([
            'order_id' => $order?->id,
            'phone' => $this->normalizePhone($attempt['phone'] ?? ''),
            'ip_address' => $attempt['ip'] ?? null,
            'device_fingerprint' => $attempt['device'] ?? null,
            'risk_score' => $assessment->score,
            'risk_level' => $assessment->level(),
            'signals' => $assessment->signals,
            'action_taken' => $assessment->action(),
        ]);
    }

    public function normalizePhone(string $phone): string
    {
        return preg_replace('/\D/', '', $phone) ?? '';
    }

    private function signal(string $code, string $label, int $score): array
    {
        return ['code' => $code, 'label' => $label, 'score' => $score];
    }
}
