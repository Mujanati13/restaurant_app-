<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Restaurant extends Model
{
    protected $fillable = ['public_id', 'name', 'slug', 'status', 'timezone', 'currency_code', 'onboarding_completed_at'];

    protected $casts = ['onboarding_completed_at' => 'datetime'];

    protected static function booted(): void
    {
        static::creating(function (Restaurant $restaurant): void {
            $restaurant->public_id ??= (string)Str::uuid();
        });
    }

    public function domains(): HasMany
    {
        return $this->hasMany(RestaurantDomain::class);
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(RestaurantMembership::class);
    }

    public function roles(): HasMany
    {
        return $this->hasMany(RestaurantRole::class);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(RestaurantInvitation::class);
    }

    public function brandRevisions(): HasMany
    {
        return $this->hasMany(RestaurantBrandRevision::class);
    }

    public function features(): HasMany
    {
        return $this->hasMany(RestaurantFeature::class);
    }

    public function settings(): HasMany
    {
        return $this->hasMany(RestaurantSetting::class);
    }

    public function pages(): HasMany
    {
        return $this->hasMany(RestaurantPage::class);
    }

    public function mediaAssets(): HasMany
    {
        return $this->hasMany(PlatformMediaAsset::class);
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(RestaurantSubscription::class)->latestOfMany();
    }

    public function pushSubscriptions(): HasMany
    {
        return $this->hasMany(MobilePushSubscription::class);
    }

    public function publishedBrand(): ?RestaurantBrandRevision
    {
        return $this->brandRevisions()->whereNotNull('published_at')->latest('published_at')->first();
    }
}
