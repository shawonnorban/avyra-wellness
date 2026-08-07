<?php

namespace App\Support;

use App\Models\Setting;
use Carbon\CarbonImmutable;

/**
 * The business day, in the timezone the shop actually trades in.
 *
 * Timestamps stay stored in UTC and `app.timezone` stays `UTC`. Pointing that
 * config at Asia/Dhaka would look like the smaller change, but Laravel writes
 * timestamps *in* the app timezone: every row already on disk was written as
 * UTC, and re-reading them as Dhaka time would silently shift the entire
 * history six hours. So the conversion happens here instead, at the one moment
 * it is actually needed — when a report asks what counts as "today".
 *
 * The zone is staff-editable (Settings > Company) because the brand trades in
 * Bangladesh today but the code should not have to change if that stops being
 * true. An unrecognised value falls back rather than throwing: a bad setting
 * should make a report slightly wrong, never take the admin panel down.
 */
final class Clock
{
    public const FALLBACK = 'Asia/Dhaka';

    public static function timezone(): string
    {
        $stored = Setting::get('company', [])['timezone'] ?? null;

        return is_string($stored) && in_array($stored, timezone_identifiers_list(), true)
            ? $stored
            : self::FALLBACK;
    }

    public static function now(): CarbonImmutable
    {
        return CarbonImmutable::now(self::timezone());
    }

    /**
     * The local calendar date, for date columns such as `orders.order_date`.
     *
     * An order placed at 02:00 in Dhaka belongs to that morning, not to the
     * previous day, which is what `now()->toDateString()` on a UTC clock gives.
     */
    public static function today(): string
    {
        return self::now()->toDateString();
    }

    /** The UTC instant the local day began — compare stored timestamps against this. */
    public static function startOfDay(): CarbonImmutable
    {
        return self::now()->startOfDay()->utc();
    }

    /** The UTC instant the local month began. */
    public static function startOfMonth(): CarbonImmutable
    {
        return self::now()->startOfMonth()->utc();
    }

    /** The UTC instant the local month ends. */
    public static function endOfMonth(): CarbonImmutable
    {
        return self::now()->endOfMonth()->utc();
    }

    /**
     * The offset as MySQL's `CONVERT_TZ` target, e.g. `+06:00`.
     *
     * Deliberately a numeric offset and not a zone name: `CONVERT_TZ('…','UTC','Asia/Dhaka')`
     * returns NULL unless the server has the timezone tables loaded, which
     * shared hosting usually does not.
     */
    public static function offset(): string
    {
        return self::now()->format('P');
    }

    /** The same offset as an SQLite date modifier, e.g. `+360 minutes`. */
    public static function sqliteModifier(): string
    {
        return sprintf('%+d minutes', self::now()->utcOffset());
    }
}
