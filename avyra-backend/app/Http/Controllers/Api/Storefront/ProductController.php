<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\ShopBanner;
use App\Support\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $products = Product::query()
            ->where('is_active', true)
            ->with(['variants' => fn ($q) => $q->where('is_active', true)])
            ->when($request->filled('category'), fn ($q) => $q->where('category', $request->string('category')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%' . $request->string('search') . '%';
                $q->where(fn ($sub) => $sub->where('name', 'like', $term)->orWhere('short_description', 'like', $term));
            })
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 24));

        return ProductResource::collection($products);
    }

    public function show(string $slug): JsonResponse
    {
        // Accept either the slug or the id so links keep working if a slug changes.
        $product = Product::query()
            ->where('is_active', true)
            ->where(fn ($q) => $q->where('slug', $slug)->orWhere('id', $slug))
            ->with(['variants' => fn ($q) => $q->where('is_active', true)])
            ->firstOrFail();

        return response()->json(['data' => ProductResource::detailed($product)]);
    }

    public function banners(): JsonResponse
    {
        $banners = ShopBanner::active()
            ->get(['id', 'title', 'subtitle', 'image_path', 'link_url', 'button_text'])
            ->map(fn (ShopBanner $banner) => [
                'id' => $banner->id,
                'title' => $banner->title,
                'subtitle' => $banner->subtitle,
                'image_url' => Media::url($banner->image_path),
                'link_url' => $banner->link_url,
                'button_text' => $banner->button_text,
            ]);

        return response()->json(['data' => $banners]);
    }
}
