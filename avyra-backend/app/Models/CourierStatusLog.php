<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourierStatusLog extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = ['consignment_id', 'status', 'raw_status', 'source', 'note', 'logged_at'];

    protected $casts = ['logged_at' => 'datetime'];

    public function consignment(): BelongsTo
    {
        return $this->belongsTo(CourierConsignment::class, 'consignment_id');
    }
}
