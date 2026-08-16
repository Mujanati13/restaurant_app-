<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RestaurantRole extends Model
{
    protected $fillable = ['restaurant_id', 'name', 'slug', 'base_role', 'permissions'];

    protected $casts = ['permissions' => 'array'];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(RestaurantMembership::class);
    }
}
