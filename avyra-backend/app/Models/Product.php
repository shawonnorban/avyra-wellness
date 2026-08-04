<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasUuids;

    protected $fillable = [
        'sku', 'slug', 'name', 'tagline', 'product_label', 'facility_label',
        'category', 'short_description', 'description', 'long_description',
        'images', 'gallery_images', 'pack_options', 'ingredients', 'nutrition',
        'benefits_section', 'trust_section', 'suitability', 'certificates',
        'faqs', 'delivery_info', 'terms_conditions', 'meta_title', 'meta_description',
        'warehouse', 'quantity', 'min_stock', 'cost_price',
        'sell_price', 'compare_at_price', 'last_sale_date', 'is_active',
    ];

    protected $casts = [
        'images' => 'array',
        'gallery_images' => 'array',
        'pack_options' => 'array',
        'ingredients' => 'array',
        'nutrition' => 'array',
        'benefits_section' => 'array',
        'trust_section' => 'array',
        'suitability' => 'array',
        'certificates' => 'array',
        'faqs' => 'array',
        'delivery_info' => 'array',
        'last_sale_date' => 'date',
        'is_active' => 'boolean',
        'cost_price' => 'decimal:2',
        'sell_price' => 'decimal:2',
        'compare_at_price' => 'decimal:2',
    ];

    // Mirrors the generated "status" column from the old schema
    protected $appends = ['status'];

    public function getStatusAttribute(): string
    {
        if ($this->quantity == 0) {
            return 'Out of Stock';
        }
        if ($this->quantity <= $this->min_stock) {
            return 'Low Stock';
        }
        return 'In Stock';
    }

    /**
     * Ordered dearest first so the largest pack leads the picker and is the one
     * preselected on campaign pages.
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->orderByDesc('sell_price');
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(ProductStockMovement::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    // Scope for the "Vital Plus" category page
    public function scopeCategory($query, string $category)
    {
        return $query->where('category', $category)->where('is_active', true);
    }
}
