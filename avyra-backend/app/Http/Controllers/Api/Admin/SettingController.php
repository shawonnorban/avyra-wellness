<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Rules\StoredImagePath;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Keys whose secrets are masked on read. The admin UI shows a placeholder and
     * sends the field back only when it is actually changed.
     */
    private const SECRET_FIELDS = [
        'courier_steadfast' => ['api_key', 'secret_key', 'webhook_token'],
        'sms' => ['api_key'],
        'meta_capi' => ['access_token'],
    ];

    public function index(): JsonResponse
    {
        $settings = Setting::all()
            ->mapWithKeys(fn (Setting $s) => [$s->key => $this->mask($s->key, $s->value)]);

        return response()->json(['data' => $settings]);
    }

    public function show(string $key): JsonResponse
    {
        $setting = Setting::where('key', $key)->firstOrFail();

        return response()->json(['data' => $this->mask($setting->key, $setting->value)]);
    }

    public function update(Request $request, string $key): JsonResponse
    {
        $setting = Setting::where('key', $key)->firstOrFail();

        $rules = ['value' => ['required', 'array']];

        // The company logo is an upload path, never a pasted URL.
        if ($key === 'company') {
            $rules['value.logo_path'] = ['nullable', new StoredImagePath()];
        }

        // Every slide likewise: a registered upload, not a link to somewhere else.
        if ($key === 'campaign_slider') {
            $rules['value.images'] = ['sometimes', 'array', 'max:12'];
            $rules['value.images.*'] = [new StoredImagePath()];
        }

        $request->validate($rules);

        // Read the raw input, not validated(): naming `value.logo_path` in the rules
        // makes validated() return *only* that sub-key, which would drop every other
        // company field. Merged rather than replaced so a form that renders a subset
        // of a group cannot wipe the rest.
        $value = $this->mergeSetting($setting->value ?? [], $request->input('value', []));

        // Re-attach any secret the client sent back masked, so saving the form
        // without retyping a key does not blank it.
        foreach (self::SECRET_FIELDS[$key] ?? [] as $field) {
            if (($value[$field] ?? null) === self::maskToken()) {
                $value[$field] = $setting->value[$field] ?? '';
            }
        }

        $setting->update(['value' => $value]);

        return response()->json(['data' => $this->mask($key, $setting->fresh()->value)]);
    }

    /**
     * Merges an incoming settings patch over the stored value.
     *
     * Nested maps (`company.social`) merge key by key, so a tab that renders only
     * some of them cannot blank the others. Lists are replaced outright — an
     * ordered array is a single value, not something to append to.
     */
    private function mergeSetting(array $stored, array $patch): array
    {
        foreach ($patch as $key => $value) {
            $existing = $stored[$key] ?? null;

            $stored[$key] = is_array($value) && is_array($existing) && ! array_is_list($value)
                ? $this->mergeSetting($existing, $value)
                : $value;
        }

        return $stored;
    }

    private function mask(string $key, mixed $value): mixed
    {
        if (! is_array($value)) {
            return $value;
        }

        foreach (self::SECRET_FIELDS[$key] ?? [] as $field) {
            if (! empty($value[$field])) {
                $value[$field] = self::maskToken();
            }
        }

        return $value;
    }

    private static function maskToken(): string
    {
        return '********';
    }
}
