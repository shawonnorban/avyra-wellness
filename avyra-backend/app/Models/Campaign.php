<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Campaign extends Model
{
    use HasUuids;

    protected $fillable = [
        'campaign_code', 'name', 'type', 'status', 'spend',
        'impressions', 'conversions', 'start_date', 'end_date',
    ];

    protected $casts = [
        'spend' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function landingPages(): HasMany
    {
        return $this->hasMany(LandingPage::class);
    }

    public function visits(): HasMany
    {
        return $this->hasMany(CampaignVisit::class);
    }
}
