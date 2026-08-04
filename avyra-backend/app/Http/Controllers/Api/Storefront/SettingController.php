<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Support\Media;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    /**
     * Bootstrap payload for the storefront: only settings explicitly flagged public.
     * Courier keys, SMS credentials and the CAPI token are never public, so they
     * cannot leak through this endpoint even if a new key is added later.
     */
    public function index(): JsonResponse
    {
        $settings = Setting::where('is_public', true)
            ->pluck('value', 'key')
            ->map(function ($value, $key) {
                // The logo is stored as an upload path; the browser needs a URL.
                if ($key === 'company' && is_array($value)) {
                    $value['logo_url'] = Media::url($value['logo_path'] ?? null);
                    unset($value['logo_path']);
                }

                return $value;
            });

        return response()->json(['data' => $settings]);
    }
}
