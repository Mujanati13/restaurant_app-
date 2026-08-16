<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantSubscription extends Model
{
    protected $fillable = [
        'restaurant_id', 'subscription_plan_id', 'status', 'trial_ends_at', 'current_period_ends_at',
    ];

    protected $casts = ['trial_ends_at' => 'datetime', 'current_period_ends_at' => 'datetime'];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }
}
