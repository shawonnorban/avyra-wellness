<?php

namespace App\Support;

/**
 * Reads device, browser and OS out of a user-agent string.
 *
 * Deliberately small: a full UA database would classify bots and obscure devices
 * better, but this only has to answer "phone or desktop, which browser, which
 * OS" for a traffic dashboard. Anything it cannot place becomes `Unknown` rather
 * than a wrong guess.
 *
 * Called once when the visit is written, never when reporting — the visits table
 * is never pruned, so matching patterns against the raw string on every dashboard
 * load would get slower for as long as the site is up.
 */
final class UserAgent
{
    /** @return array{device: string, browser: string, os: string} */
    public static function parse(?string $agent): array
    {
        $ua = mb_strtolower((string) $agent);

        if ($ua === '') {
            return ['device' => 'Unknown', 'browser' => 'Unknown', 'os' => 'Unknown'];
        }

        return [
            'device' => self::device($ua),
            'browser' => self::browser($ua),
            'os' => self::os($ua),
        ];
    }

    private static function device(string $ua): string
    {
        // Tablet first: an iPad's UA also contains "mobile" on some versions.
        if (preg_match('/ipad|tablet|playbook|silk/', $ua)) {
            return 'Tablet';
        }

        if (preg_match('/mobi|android|iphone|ipod|windows phone/', $ua)) {
            return 'Mobile';
        }

        return 'Desktop';
    }

    private static function browser(string $ua): string
    {
        // Order matters throughout: Edge and Opera both claim to be Chrome, and
        // Chrome claims to be Safari, so the most specific name has to win.
        return match (true) {
            str_contains($ua, 'edg/') || str_contains($ua, 'edga/') => 'Edge',
            str_contains($ua, 'opr/') || str_contains($ua, 'opera') => 'Opera',
            str_contains($ua, 'samsungbrowser') => 'Samsung Internet',
            str_contains($ua, 'ucbrowser') => 'UC Browser',
            str_contains($ua, 'fban') || str_contains($ua, 'fbav') => 'Facebook',
            str_contains($ua, 'instagram') => 'Instagram',
            str_contains($ua, 'firefox') => 'Firefox',
            str_contains($ua, 'chrome') || str_contains($ua, 'crios') => 'Chrome',
            str_contains($ua, 'safari') => 'Safari',
            default => 'Unknown',
        };
    }

    private static function os(string $ua): string
    {
        return match (true) {
            str_contains($ua, 'windows') => 'Windows',
            str_contains($ua, 'android') => 'Android',
            // Before "mac": an iPhone UA contains "like Mac OS X".
            preg_match('/iphone|ipad|ipod/', $ua) === 1 => 'iOS',
            str_contains($ua, 'mac os') => 'macOS',
            str_contains($ua, 'linux') => 'Linux',
            default => 'Unknown',
        };
    }
}
