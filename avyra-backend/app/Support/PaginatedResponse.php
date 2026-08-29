<?php

namespace App\Support;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The one shape every paginated admin endpoint returns.
 *
 * Ten of the twelve already looked like this, because they hand the paginator
 * straight to `response()->json()` and Laravel serialises it flat. The two that
 * used `SomeResource::collection($paginator)` did not: a resource collection
 * nests the counts under `meta`, so `last_page` sat one level deeper than the
 * admin was looking for it.
 *
 * Nothing failed — `undefined > 1` is simply false — so the Previous/Next
 * controls rendered nothing at all and the orders list quietly stopped at 25
 * rows with no way to reach the rest.
 *
 * Resolving the resources by hand rather than returning the collection is what
 * keeps the shape flat, and keeps it identical to the other ten.
 */
final class PaginatedResponse
{
    /**
     * @param  class-string<JsonResource>  $resource
     */
    public static function of(LengthAwarePaginator $page, string $resource): JsonResponse
    {
        return response()->json([
            'data' => $resource::collection($page->getCollection())->resolve(),
            'current_page' => $page->currentPage(),
            'last_page' => $page->lastPage(),
            'per_page' => $page->perPage(),
            'total' => $page->total(),
        ]);
    }
}
