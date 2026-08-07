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
        'campaign_id', 'landing_page_id', 'event_type', 'path', 'referrer',
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'ip_address', 'user_agent', 'device', 'browser', 'os',
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
