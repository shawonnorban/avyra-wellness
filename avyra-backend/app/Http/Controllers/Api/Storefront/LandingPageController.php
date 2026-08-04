<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\CampaignVisit;
use App\Models\LandingPage;
use App\Support\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LandingPageController extends Controller
{
    public function show(string $slug): JsonResponse
    {
        $page = LandingPage::published()
            ->where('slug', $slug)
            ->with(['product.variants' => fn ($q) => $q->where('is_active', true)])
            ->firstOrFail();

        return response()->json([
            'data' => [
                'id' => $page->id,
                'slug' => $page->slug,
                'title' => $page->title,
                'headline' => $page->headline,
                'sub_headline' => $page->sub_headline,
                'hero_image' => Media::url($page->hero_image_path),
                'sections' => $this->resolveSectionImages($page->sections ?? []),
                'show_header' => $page->show_header,
                'show_footer' => $page->show_footer,
                'cta_text' => $page->cta_text,
                'cta_type' => $page->cta_type,
                'cta_value' => $page->cta_value,
                'countdown_end' => $page->countdown_end?->toIso8601String(),
                'delivery_charge_inside' => $page->delivery_charge_inside !== null ? (float) $page->delivery_charge_inside : null,
                'delivery_charge_outside' => $page->delivery_charge_outside !== null ? (float) $page->delivery_charge_outside : null,
                'meta_title' => $page->meta_title,
                'meta_description' => $page->meta_description,
                'product' => $page->product ? ProductResource::detailed($page->product) : null,
            ],
        ]);
    }

    /**
     * Section blocks store image paths; the renderer needs public URLs.
     * `image` is a single path, `images` an array of them.
     *
     * @param  array<int, array<string, mixed>>  $sections
     * @return array<int, array<string, mixed>>
     */
    private function resolveSectionImages(array $sections): array
    {
        return collect($sections)->map(function (array $section) {
            if (isset($section['image']) && is_string($section['image'])) {
                $section['image'] = Media::url($section['image']);
            }

            if (isset($section['images']) && is_array($section['images'])) {
                $section['images'] = Media::urls($section['images']);
            }

            return $section;
        })->all();
    }

    /**
     * Customer-review screenshots collected from every published landing page.
     * The storefront home page renders these, so it must not have to fetch each
     * landing page separately.
     */
    public function reviews(): JsonResponse
    {
        $images = LandingPage::published()
            ->whereNotNull('sections')
            ->latest('updated_at')
            ->limit(20)
            ->pluck('sections')
            ->flatMap(function (?array $sections) {
                return collect($sections ?? [])
                    ->where('type', 'reviews')
                    ->flatMap(fn (array $section) => $section['images'] ?? []);
            })
            ->filter()
            ->unique()
            ->values();

        return response()->json(["data" => Media::urls($images->all())]);
    }

    /**
     * Records a view or CTA click for campaign reporting. Fire-and-forget from the
     * client: a failure here must never block the page.
     */
    public function trackVisit(Request $request, string $slug): JsonResponse
    {
        $page = LandingPage::published()->where('slug', $slug)->firstOrFail();

        $validated = $request->validate([
            'event_type' => ['nullable', 'in:view,cta_click,order'],
            'utm_source' => ['nullable', 'string', 'max:255'],
            'utm_medium' => ['nullable', 'string', 'max:255'],
            'utm_campaign' => ['nullable', 'string', 'max:255'],
        ]);

        CampaignVisit::create([
            'campaign_id' => $page->campaign_id,
            'landing_page_id' => $page->id,
            'event_type' => $validated['event_type'] ?? 'view',
            'utm_source' => $validated['utm_source'] ?? null,
            'utm_medium' => $validated['utm_medium'] ?? null,
            'utm_campaign' => $validated['utm_campaign'] ?? null,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
        ]);

        return response()->json(['recorded' => true]);
    }
}
