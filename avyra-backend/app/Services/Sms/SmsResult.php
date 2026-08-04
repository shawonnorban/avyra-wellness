<?php

namespace App\Services\Sms;

final class SmsResult
{
    public function __construct(
        public readonly bool $success,
        public readonly ?string $responseCode = null,
        public readonly ?string $errorReason = null,
        public readonly ?string $detail = null,
    ) {}

    public static function ok(?string $code = null, ?string $detail = null): self
    {
        return new self(true, $code, null, $detail);
    }

    public static function fail(string $reason, ?string $code = null, ?string $detail = null): self
    {
        return new self(false, $code, $reason, $detail);
    }
}
