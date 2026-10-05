<?php

namespace App\Support;

/**
 * The one form a Bangladeshi mobile number is stored and matched in.
 *
 * A buyer types `01712345678` on one visit and `+8801712345678` on the next. Matching
 * on the raw digits treats those as two people: two `customers` rows, two risk
 * profiles, and a repeat-order check that never fires. Every place that stores or
 * looks up a phone goes through here so they all agree.
 *
 * Canonical form is the local `01XXXXXXXXX`. A number we do not recognise is returned
 * as bare digits rather than refused: refusing at the point of storage would drop an
 * order that already passed checkout's own validation, and the fraud check's digit
 * minimum still catches anything too short to be real.
 */
final class Phone
{
    public static function canonical(?string $raw): string
    {
        $digits = preg_replace('/\D/', '', (string) $raw) ?? '';

        // +880 1712 345678  →  8801712345678  →  01712345678
        if (str_starts_with($digits, '880') && strlen($digits) === 13) {
            return '0' . substr($digits, 3);
        }

        // 1712345678 (leading zero dropped)  →  01712345678
        if (strlen($digits) === 10 && str_starts_with($digits, '1')) {
            return '0' . $digits;
        }

        return $digits;
    }
}
