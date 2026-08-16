<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class RestaurantInvitation extends Model
{
    protected $fillable = [
        'public_id', 'restaurant_id', 'restaurant_role_id', 'invited_by', 'name', 'email',
        'base_role', 'location_ids', 'token_hash', 'status', 'expires_at', 'accepted_at',
    ];

    protected $casts = ['location_ids' => 'array', 'expires_at' => 'datetime', 'accepted_at' => 'datetime'];

    protected static function booted(): void
    {
        static::creating(function (RestaurantInvitation $invitation): void {
            $invitation->public_id ??= (string) Str::uuid();
        });
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(RestaurantRole::class, 'restaurant_role_id');
    }
}
