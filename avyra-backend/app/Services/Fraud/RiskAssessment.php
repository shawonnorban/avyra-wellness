<?php

namespace App\Services\Fraud;

/**
 * Outcome of a fraud check. Immutable so a controller cannot accidentally
 * downgrade a block after the fact.
 */
final class RiskAssessment
{
    /** Score at or above which the order is refused outright. */
    public const BLOCK_THRESHOLD = 100;

    public function __construct(
        public readonly int $score,
        public readonly array $signals,
        public readonly string $blockMessage,
    ) {}

    public function level(): string
    {
        return match (true) {
            $this->score >= 100 => 'Critical',
            $this->score >= 60 => 'High',
            $this->score >= 30 => 'Medium',
            default => 'Low',
        };
    }

    public function isBlocked(): bool
    {
        return $this->score >= self::BLOCK_THRESHOLD;
    }

    public function action(): string
    {
        return match (true) {
            $this->isBlocked() => 'blocked',
            $this->score >= 30 => 'flagged',
            default => 'allowed',
        };
    }
}
