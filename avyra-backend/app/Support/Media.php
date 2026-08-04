<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

/**
 * Image fields are stored as disk-relative paths; the public URL is derived on the
 * way out. Keeping the path (not a URL) in the database means the storage host can
 * change without a data migration.
 */
final class Media
{
    public static function url(?string $path): ?string
    {
        if (blank($path)) {
            return null;
        }

        return Storage::disk('public')->url($path);
    }

    /**
     * @param  array<int, string>|null  $paths
     * @return array<int, string>
     */
    public static function urls(?array $paths): array
    {
        return collect($paths ?? [])
            ->map(fn ($path) => self::url(is_string($path) ? $path : null))
            ->filter()
            ->values()
            ->all();
    }

    /** Thumbnail path for a stored image, falling back to the full-size one. */
    public static function thumbnailUrl(?string $path): ?string
    {
        if (blank($path)) {
            return null;
        }

        $thumbnail = preg_replace('/(\.\w+)$/', '_thumb$1', $path);

        return Storage::disk('public')->exists($thumbnail)
            ? self::url($thumbnail)
            : self::url($path);
    }
}
