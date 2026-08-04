<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Coupon;
use App\Models\ShopBanner;
use App\Rules\StoredImagePath;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Campaigns, coupons and shop banners — the three small CRUD surfaces under Marketing.
 * Landing pages are large enough to warrant their own controller.
 */
class MarketingController extends Controller
{
    // --- Campaigns -------------------------------------------------------

    public function campaigns(Request $request): JsonResponse
    {
        $campaigns = Campaign::withCount([
            'visits as views' => fn ($q) => $q->where('event_type', 'view'),
        ])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->latest('created_at')
            ->paginate($request->integer('per_page', 25));

        return response()->json($campaigns);
    }

    public function storeCampaign(Request $request): JsonResponse
    {
        $validated = $request->validate($this->campaignRules());

        $validated['campaign_code'] ??= 'CMP-' . strtoupper(Str::random(6));

        return response()->json(['data' => Campaign::create($validated)], 201);
    }

    public function updateCampaign(Request $request, Campaign $campaign): JsonResponse
    {
        $campaign->update($request->validate($this->campaignRules($campaign->id)));

        return response()->json(['data' => $campaign->fresh()]);
    }

    public function destroyCampaign(Campaign $campaign): JsonResponse
    {
        $campaign->delete();

        return response()->json(['message' => 'Campaign deleted.']);
    }

    // --- Coupons ---------------------------------------------------------

    public function coupons(Request $request): JsonResponse
    {
        $coupons = Coupon::query()
            ->when($request->filled('search'), fn ($q) => $q->where('code', 'like', '%' . $request->string('search') . '%'))
            ->latest('created_at')
            ->paginate($request->integer('per_page', 25));

        return response()->json($coupons);
    }

    public function storeCoupon(Request $request): JsonResponse
    {
        $validated = $request->validate($this->couponRules());
        $validated['code'] = strtoupper($validated['code']);

        return response()->json(['data' => Coupon::create($validated)], 201);
    }

    public function updateCoupon(Request $request, Coupon $coupon): JsonResponse
    {
        $validated = $request->validate($this->couponRules($coupon->id));

        if (isset($validated['code'])) {
            $validated['code'] = strtoupper($validated['code']);
        }

        $coupon->update($validated);

        return response()->json(['data' => $coupon->fresh()]);
    }

    public function destroyCoupon(Coupon $coupon): JsonResponse
    {
        $coupon->delete();

        return response()->json(['message' => 'Coupon deleted.']);
    }

    // --- Shop banners ----------------------------------------------------

    public function banners(): JsonResponse
    {
        return response()->json(['data' => ShopBanner::orderBy('sort_order')->get()]);
    }

    public function storeBanner(Request $request): JsonResponse
    {
        return response()->json(['data' => ShopBanner::create($request->validate($this->bannerRules()))], 201);
    }

    public function updateBanner(Request $request, ShopBanner $banner): JsonResponse
    {
        $banner->update($request->validate($this->bannerRules(true)));

        return response()->json(['data' => $banner->fresh()]);
    }

    public function destroyBanner(ShopBanner $banner): JsonResponse
    {
        $banner->delete();

        return response()->json(['message' => 'Banner deleted.']);
    }

    private function campaignRules(?string $ignoreId = null): array
    {
        return [
            'campaign_code' => ['nullable', 'string', 'max:32', 'unique:campaigns,campaign_code' . ($ignoreId ? ",{$ignoreId}" : '')],
            'name' => [$ignoreId ? 'sometimes' : 'required', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'in:Draft,Active,Paused,Completed'],
            'spend' => ['nullable', 'numeric', 'min:0'],
            'impressions' => ['nullable', 'integer', 'min:0'],
            'conversions' => ['nullable', 'integer', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ];
    }

    private function couponRules(?string $ignoreId = null): array
    {
        return [
            'code' => [$ignoreId ? 'sometimes' : 'required', 'string', 'max:64', 'unique:coupons,code' . ($ignoreId ? ",{$ignoreId}" : '')],
            'discount_type' => ['required_without:code', 'sometimes', 'in:percent,fixed'],
            'discount_value' => ['required_without:code', 'sometimes', 'numeric', 'min:0'],
            'min_order_total' => ['nullable', 'numeric', 'min:0'],
            'max_discount' => ['nullable', 'numeric', 'min:0'],
            'max_usage' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after:starts_at'],
            'is_active' => ['boolean'],
        ];
    }

    private function bannerRules(bool $partial = false): array
    {
        return [
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'image_path' => [$partial ? 'sometimes' : 'required', new StoredImagePath()],
            'link_url' => ['nullable', 'string', 'max:500'],
            'button_text' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }
}
