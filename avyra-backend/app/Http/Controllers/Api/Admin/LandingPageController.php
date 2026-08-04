<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CampaignVisit;
use App\Models\LandingPage;
use App\Rules\StoredImagePath;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LandingPageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $pages = LandingPage::with(['product:id,name', 'campaign:id,name'])
            ->withCount([
                'visits as views' => fn ($q) => $q->where('event_type', 'view'),
                'visits as orders' => fn ($q) => $q->where('event_type', 'order'),
            ])
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%' . $request->string('search') . '%';
                $q->where(fn ($sub) => $sub->where('title', 'like', $term)->orWhere('slug', 'like', $term));
            })
            ->latest('created_at')
            ->paginate($request->integer('per_page', 25));

        return response()->json($pages);
    }

    public function show(LandingPage $landingPage): JsonResponse
    {
        return response()->json(['data' => $landingPage->load('product', 'campaign')]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules());
        $validated = $this->withRawSections($request, $validated);

        $validated['slug'] = $this->uniqueSlug($validated['slug'] ?? $validated['title']);
        $validated['created_by'] = $request->user()->id;

        $page = LandingPage::create($validated);

        return response()->json(['data' => $page], 201);
    }

    /**
     * `validate()` returns only the keys the rules name, which would strip every
     * block property that has no rule of its own (heading, items, html, …). The
     * rules exist to police the image fields, so the blocks are re-attached from
     * the raw input once they have passed.
     */
    private function withRawSections(Request $request, array $validated): array
    {
        if ($request->has('sections')) {
            $validated['sections'] = $request->input('sections') ?? [];
        }

        return $validated;
    }

    public function update(Request $request, LandingPage $landingPage): JsonResponse
    {
        $validated = $request->validate($this->rules($landingPage->id));
        $validated = $this->withRawSections($request, $validated);

        if (isset($validated['slug'])) {
            $validated['slug'] = $this->uniqueSlug($validated['slug'], $landingPage->id);
        }

        $landingPage->update($validated);

        return response()->json(['data' => $landingPage->fresh()]);
    }

    /**
     * Copies a page under a new slug — the usual way a new campaign starts.
     */
    public function duplicate(Request $request, LandingPage $landingPage): JsonResponse
    {
        $copy = $landingPage->replicate(['created_at', 'updated_at']);
        $copy->title = $landingPage->title . ' (copy)';
        $copy->slug = $this->uniqueSlug($landingPage->slug);
        $copy->is_active = false; // never publish a copy by accident
        $copy->created_by = $request->user()->id;
        $copy->save();

        return response()->json(['data' => $copy], 201);
    }

    public function destroy(LandingPage $landingPage): JsonResponse
    {
        $landingPage->delete();

        return response()->json(['message' => 'Landing page deleted.']);
    }

    /**
     * Funnel numbers for the page: views → CTA clicks → orders.
     */
    public function stats(LandingPage $landingPage): JsonResponse
    {
        $counts = CampaignVisit::where('landing_page_id', $landingPage->id)
            ->selectRaw('event_type, count(*) as total')
            ->groupBy('event_type')
            ->pluck('total', 'event_type');

        $views = (int) ($counts['view'] ?? 0);
        $orders = (int) ($counts['order'] ?? 0);

        return response()->json([
            'data' => [
                'views' => $views,
                'cta_clicks' => (int) ($counts['cta_click'] ?? 0),
                'orders' => $orders,
                'conversion_rate' => $views > 0 ? round($orders / $views * 100, 2) : 0.0,
            ],
        ]);
    }

    private function rules(?string $ignoreId = null): array
    {
        return [
            'title' => [$ignoreId ? 'sometimes' : 'required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/'],
            'product_id' => ['nullable', 'uuid', 'exists:products,id'],
            'campaign_id' => ['nullable', 'uuid', 'exists:campaigns,id'],
            'headline' => ['nullable', 'string', 'max:255'],
            'sub_headline' => ['nullable', 'string', 'max:255'],
            'hero_image_path' => ['nullable', new StoredImagePath()],
            'sections' => ['nullable', 'array'],
            'sections.*.type' => ['required_with:sections', 'string', 'max:50'],
            // Block images are upload paths too, so a section cannot smuggle in a URL.
            'sections.*.image' => ['nullable', new StoredImagePath()],
            'sections.*.images' => ['nullable', 'array', 'max:30'],
            'sections.*.images.*' => [new StoredImagePath()],
            'show_header' => ['boolean'],
            'show_footer' => ['boolean'],
            'cta_text' => ['nullable', 'string', 'max:100'],
            'cta_type' => ['nullable', 'in:order_form,add_to_cart,phone,link'],
            'cta_value' => ['nullable', 'string', 'max:500'],
            'countdown_end' => ['nullable', 'date'],
            'delivery_charge_inside' => ['nullable', 'numeric', 'min:0'],
            'delivery_charge_outside' => ['nullable', 'numeric', 'min:0'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
        ];
    }

    private function uniqueSlug(string $source, ?string $ignoreId = null): string
    {
        $base = Str::slug($source) ?: 'page';
        $slug = $base;
        $n = 2;

        while (LandingPage::where('slug', $slug)->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))->exists()) {
            $slug = "{$base}-{$n}";
            $n++;
        }

        return $slug;
    }
}
