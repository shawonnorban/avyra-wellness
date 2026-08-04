<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LandingPage extends Model
{
    use HasUuids;

    protected $fillable = [
        'slug', 'title', 'product_id', 'campaign_id', 'headline', 'sub_headline',
        'hero_image_path', 'sections', 'show_header', 'show_footer', 'cta_text',
        'cta_type', 'cta_value', 'countdown_end', 'delivery_charge_inside',
        'delivery_charge_outside', 'meta_title', 'meta_description',
        'is_active', 'created_by',
    ];

    protected $casts = [
        'sections' => 'array',
        'show_header' => 'boolean',
        'show_footer' => 'boolean',
        'is_active' => 'boolean',
        'countdown_end' => 'datetime',
        'delivery_charge_inside' => 'decimal:2',
        'delivery_charge_outside' => 'decimal:2',
    ];

    // No getRouteKeyName() override: the admin routes bind this model by id, and
    // the storefront looks pages up by slug explicitly rather than through binding.

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function visits(): HasMany
    {
        return $this->hasMany(CampaignVisit::class);
    }

    public function scopePublished($query)
    {
        return $query->where('is_active', true);
    }
}
