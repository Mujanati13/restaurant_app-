<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    protected $fillable = ['code', 'name', 'price_minor', 'currency_code', 'features', 'active'];

    protected $casts = ['price_minor' => 'integer', 'features' => 'array', 'active' => 'boolean'];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(RestaurantSubscription::class);
    }
}
