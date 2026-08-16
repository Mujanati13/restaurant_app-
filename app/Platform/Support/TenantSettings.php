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
        if ($locationId) {
            $location = RestaurantLocationSetting::query()
                ->where('restaurant_id', $this->tenant->id())->where('location_id', $locationId)
                ->where('key', $key)->first();
            if ($location) return $location->value;
        }
        $record = RestaurantSetting::query()
            ->where('restaurant_id', $this->tenant->id())
            ->where('key', $key)
            ->first();

        return $record ? $record->value : $fallback;
    }

    public function integer(string $key, int $fallback = 0, ?int $locationId = null): int
    {
        return (int) $this->get($key, $fallback, $locationId);
    }

    public function boolean(string $key, bool $fallback = false, ?int $locationId = null): bool
    {
        return (bool) $this->get($key, $fallback, $locationId);
    }
}
