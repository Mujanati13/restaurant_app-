<?php

namespace App\Platform\Models;

use Igniter\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantMembership extends Model
{
    protected $fillable = ['restaurant_id', 'user_id', 'role', 'restaurant_role_id', 'status', 'location_ids'];

    protected $casts = ['location_ids' => 'array'];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function customRole(): BelongsTo
    {
        return $this->belongsTo(RestaurantRole::class, 'restaurant_role_id');
    }
}
