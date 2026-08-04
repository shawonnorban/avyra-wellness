<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    use HasUuids;

    protected $fillable = ['key', 'value', 'is_public'];

    protected $casts = [
        'value' => 'array',
        'is_public' => 'boolean',
    ];

    protected static function booted(): void
    {
        // Settings are read on nearly every request (delivery charges, fraud config,
        // pixel IDs), so they are cached and busted on write.
        static::saved(fn (Setting $s) => Cache::forget(self::cacheKey($s->key)));
        static::deleted(fn (Setting $s) => Cache::forget(self::cacheKey($s->key)));
    }

    public static function cacheKey(string $key): string
    {
        return 'setting:' . $key;
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        return Cache::rememberForever(
            self::cacheKey($key),
            fn () => static::where('key', $key)->value('value')
        ) ?? $default;
    }

    public static function put(string $key, mixed $value, bool $isPublic = false): self
    {
        return static::updateOrCreate(
            ['key' => $key],
            ['value' => $value, 'is_public' => $isPublic],
        );
    }
}
