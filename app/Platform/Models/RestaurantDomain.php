<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantDomain extends Model
{
    protected $fillable = ['restaurant_id', 'host', 'is_primary', 'verification_token', 'verified_at',
        'verification_checked_at', 'verification_error', 'tls_status', 'tls_provider', 'tls_provisioned_at',
        'certificate_expires_at', 'tls_error'];

    protected $casts = ['is_primary' => 'boolean', 'verified_at' => 'datetime', 'verification_checked_at' => 'datetime',
        'tls_provisioned_at' => 'datetime', 'certificate_expires_at' => 'datetime'];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
