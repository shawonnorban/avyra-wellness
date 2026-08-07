<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\CampaignVisit;
use App\Models\LandingPage;
use App\Support\UserAgent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Records a page view from anywhere on the public site.
 *
 * The landing-page tracker it sits beside only accepts a `landing_pages` slug, so
 * the storefront, the shop and the standalone campaign page were never counted.
 * This one takes a path and works for all of them; the slug is optional and only
 * links the row back to a campaign when there is one.
 *
 * Unauthenticated by design — it is the public site reporting on itself. It
 * therefore writes nothing a visitor controls without bounding it, and takes the
 * IP and user agent from the connection rather than the body.
 */
class VisitController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'path' => ['required', 'string', 'max:512'],
            'referrer' => ['nullable', 'string', 'max:512'],
            'landing_page_slug' => ['nullable', 'string', 'max:255'],
            'utm_source' => ['nullable', 'string', 'max:255'],
            'utm_medium' => ['nullable', 'string', 'max:255'],
            'utm_campaign' => ['nullable', 'string', 'max:255'],
            'utm_term' => ['nullable', 'string', 'max:255'],
            'utm_content' => ['nullable', 'string', 'max:255'],
        ]);

        // Admin traffic is not site traffic. Also guarded on the client, but a
        // stale bundle or a hand-made request should not be able to skew the
        // numbers either.
        if ($this->isPrivate($validated['path'])) {
            return response()->json(['recorded' => false]);
        }

        $page = filled($validated['landing_page_slug'] ?? null)
            ? LandingPage::where('slug', $validated['landing_page_slug'])->first()
            : null;

        $agent = $request->userAgent();

        CampaignVisit::create([
            'campaign_id' => $page?->campaign_id,
            'landing_page_id' => $page?->id,
            'event_type' => 'pageview',
            'path' => $validated['path'],
            'referrer' => $validated['referrer'] ?? null,
            'utm_source' => $validated['utm_source'] ?? null,
            'utm_medium' => $validated['utm_medium'] ?? null,
            'utm_campaign' => $validated['utm_campaign'] ?? null,
            'utm_term' => $validated['utm_term'] ?? null,
            'utm_content' => $validated['utm_content'] ?? null,
            // Read from the connection, never the body — the same rule the fraud
            // checks follow. Needs trusted proxies set behind a CDN.
            'ip_address' => $request->ip(),
            'user_agent' => mb_substr((string) $agent, 0, 500),
            ...UserAgent::parse($agent),
        ]);

        return response()->json(['recorded' => true], 201);
    }

    private function isPrivate(string $path): bool
    {
        foreach (['/admin', '/login', '/auth'] as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return true;
            }
        }

        return false;
    }
}
