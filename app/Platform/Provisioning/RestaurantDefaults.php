<?php

namespace App\Platform\Provisioning;

use App\Platform\Models\Restaurant;
use Igniter\System\Models\Country;

class RestaurantDefaults
{
    public function apply(Restaurant $restaurant): void
    {
        $settings = [
            'default_country_id' => Country::getDefaultKey(),
            'default_order_status_id' => (int) setting('default_order_status'),
            'default_reservation_status_id' => (int) setting('default_reservation_status'),
            'orders_enabled' => true,
            'reservations_enabled' => true,
            'collection_enabled' => true,
            'delivery_enabled' => true,
        ];
        foreach ($settings as $key => $value) {
            $restaurant->settings()->firstOrCreate(['key' => $key], ['value' => $value]);
        }

        foreach (['online_ordering', 'reservations', 'customer_accounts', 'mobile_apps', 'custom_domain'] as $feature) {
            $restaurant->features()->firstOrCreate(['feature' => $feature], ['enabled' => true]);
        }

        $home = $restaurant->pages()->firstOrCreate(
            ['slug' => 'home'],
            ['title' => 'Home', 'is_home' => true],
        );
        $sections = [
            ['stable_id' => 'hero', 'type' => 'hero', 'position' => 10],
            ['stable_id' => 'categories', 'type' => 'categories', 'position' => 20],
            ['stable_id' => 'featured', 'type' => 'featured_dishes', 'position' => 30],
            ['stable_id' => 'reservation', 'type' => 'reservation_cta', 'position' => 40],
        ];
        foreach ($sections as $section) {
            $home->sections()->firstOrCreate(
                ['stable_id' => $section['stable_id']],
                [...$section, 'visible' => true, 'content' => []],
            );
        }
    }
}
