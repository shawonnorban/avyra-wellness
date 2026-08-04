<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CampaignVisit extends Model
{
    use HasUuids;

    const UPDATED_AT = null;

    protected $fillable = [
        'campaign_id', 'landing_page_id', 'event_type',
        'utm_source', 'utm_medium', 'utm_campaign', 'ip_address', 'user_agent',
    ];

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function landingPage(): BelongsTo
    {
        return $this->belongsTo(LandingPage::class);
    }
}
