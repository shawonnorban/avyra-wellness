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

                // Same for the slider, keeping the authored order. Resolved here
                // rather than in the browser so the storage host stays a
                // server-side detail.
                if ($key === 'campaign_slider' && is_array($value)) {
                    $value['image_urls'] = Media::urls($value['images'] ?? []);
                    unset($value['images']);
                }

                return $value;
            });

        return response()->json(['data' => $settings]);
    }
}
