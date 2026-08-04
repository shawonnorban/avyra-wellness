<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    use HasUuids;

    protected $fillable = [
        'code', 'name', 'contact_person', 'contact_phone', 'contact_email',
        'address', 'payment_terms', 'total_pos', 'total_paid', 'outstanding', 'is_active',
    ];

    protected $casts = [
        'total_paid' => 'decimal:2',
        'outstanding' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SupplierPayment::class);
    }

    /**
     * Recalculates the cached PO/payment aggregates shown in the supplier list.
     */
    public function refreshTotals(): void
    {
        $purchased = $this->purchases()->where('status', '!=', 'Cancelled')->sum('total');
        $paid = $this->payments()->sum('amount');

        $this->update([
            'total_pos' => $this->purchases()->count(),
            'total_paid' => $paid,
            'outstanding' => round($purchased - $paid, 2),
        ]);
    }
}
