<?php

namespace App\Platform\Support;

use App\Platform\Models\RestaurantSetting;
use App\Platform\Models\RestaurantLocationSetting;
use App\Platform\Tenancy\TenantContext;

class TenantSettings
{
    public function __construct(private readonly TenantContext $tenant) {}

    public function get(string $key, mixed $fallback = null, ?int $locationId = null): mixed
    {
        return $this->getForRestaurant($this->tenant->id(), $key, $fallback, $locationId);
    }

    public function integer(string $key, int $fallback = 0, ?int $locationId = null): int
    {
        return (int) $this->get($key, $fallback, $locationId);
    }

    public function boolean(string $key, bool $fallback = false, ?int $locationId = null): bool
    {
        return (bool) $this->get($key, $fallback, $locationId);
    }

    /**
     * Resolve a setting for a specific restaurant without requiring that it is
     * the tenant currently bound to the request. This is used by platform-wide
     * features, such as marketplace discovery, that operate across tenants.
     */
    public function getForRestaurant(int $restaurantId, string $key, mixed $fallback = null, ?int $locationId = null): mixed
    {
        if ($locationId) {
            $location = RestaurantLocationSetting::query()
                ->where('restaurant_id', $restaurantId)
                ->where('location_id', $locationId)
                ->where('key', $key)
                ->first();

            if ($location) {
                return $location->value;
            }
        }

        $record = RestaurantSetting::query()
            ->where('restaurant_id', $restaurantId)
            ->where('key', $key)
            ->first();

        return $record ? $record->value : $fallback;
    }

    public function integerForRestaurant(int $restaurantId, string $key, int $fallback = 0, ?int $locationId = null): int
    {
        return (int)$this->getForRestaurant($restaurantId, $key, $fallback, $locationId);
    }

    public function booleanForRestaurant(int $restaurantId, string $key, bool $fallback = false, ?int $locationId = null): bool
    {
        return (bool)$this->getForRestaurant($restaurantId, $key, $fallback, $locationId);
    }
}
