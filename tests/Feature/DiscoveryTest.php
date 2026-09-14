<?php

namespace Tests\Feature;

use App\Platform\Models\Restaurant;
use App\Platform\Models\RestaurantBrandRevision;
use App\Platform\Models\RestaurantDomain;
use App\Platform\Models\RestaurantLocationSetting;
use App\Platform\Models\RestaurantMembership;
use App\Platform\Models\RestaurantSetting;
use Igniter\Cart\Models\Category;
use Igniter\Cart\Models\Menu;
use Igniter\Local\Models\Location;
use Igniter\User\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Str;
use Tests\TestCase;

class DiscoveryTest extends TestCase
{
    use DatabaseTransactions;

    private Restaurant $restaurantZurich;
    private Restaurant $restaurantBern;
    private Restaurant $restaurantDisabled;
    private Location $locationZurich;
    private Location $locationBern;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(ThrottleRequests::class);
        config()->set('vondo.marketplace_enabled', true);
        config()->set('vondo.allow_tenant_header', true);

        // 1. Create Zurich Restaurant (Active, Discovery Enabled, Swiss Coords)
        $this->restaurantZurich = Restaurant::query()->create([
            'name' => 'Pizzeria Napoletana Zürich',
            'slug' => 'pizzeria-zurich-' . Str::lower(Str::random(6)),
            'status' => 'active',
            'timezone' => 'Europe/Zurich',
            'currency_code' => 'CHF',
            'discovery_enabled' => true,
            'cuisine_tags' => ['Pizza', 'Italian'],
            'listing_description' => 'Authentic wood-fired Neapolitan pizza in the heart of Zürich.',
        ]);

        RestaurantBrandRevision::query()->create([
            'restaurant_id' => $this->restaurantZurich->getKey(),
            'version' => 1,
            'published_at' => now(),
            'configuration' => [
                'identity' => ['name' => 'Pizzeria Napoletana Zürich', 'tagline' => 'Fresh Neapolitan Pizza'],
                'theme' => ['primary' => '#c95028'],
                'content' => ['hero_image_url' => 'https://images.unsplash.com/photo-1513104890138-7c749659a591'],
                'navigation' => [],
                'sections' => [],
            ],
        ]);

        $this->locationZurich = Location::query()->create([
            'restaurant_id' => $this->restaurantZurich->getKey(),
            'location_name' => 'Zürich City',
            'location_address_1' => 'Bahnhofstrasse 10',
            'location_city' => 'Zürich',
            'location_postcode' => '8001',
            'location_lat' => 47.3769,
            'location_lng' => 8.5417,
            'location_status' => true,
            'is_default' => true,
        ]);

        RestaurantLocationSetting::query()->create([
            'restaurant_id' => $this->restaurantZurich->getKey(),
            'location_id' => $this->locationZurich->getKey(),
            'key' => 'min_delivery_order',
            'value' => 25.0,
        ]);
        RestaurantLocationSetting::query()->create([
            'restaurant_id' => $this->restaurantZurich->getKey(),
            'location_id' => $this->locationZurich->getKey(),
            'key' => 'delivery_charge',
            'value' => 3.5,
        ]);
        RestaurantLocationSetting::query()->create([
            'restaurant_id' => $this->restaurantZurich->getKey(),
            'location_id' => $this->locationZurich->getKey(),
            'key' => 'delivery_radius_km',
            'value' => 15.0,
        ]);

        // 2. Create Bern Restaurant (Active, Discovery Enabled, Bern Coords)
        $this->restaurantBern = Restaurant::query()->create([
            'name' => 'Bern Burger Craft',
            'slug' => 'bern-burgers-' . Str::lower(Str::random(6)),
            'status' => 'active',
            'timezone' => 'Europe/Zurich',
            'currency_code' => 'CHF',
            'discovery_enabled' => true,
            'cuisine_tags' => ['Burgers', 'American'],
            'listing_description' => 'Artisanal burgers and hand-cut fries in Bern.',
        ]);

        RestaurantBrandRevision::query()->create([
            'restaurant_id' => $this->restaurantBern->getKey(),
            'version' => 1,
            'published_at' => now(),
            'configuration' => [
                'identity' => ['name' => 'Bern Burger Craft', 'tagline' => 'Best Burgers in Bern'],
                'theme' => ['primary' => '#29231f'],
                'content' => ['hero_image_url' => 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd'],
                'navigation' => [],
                'sections' => [],
            ],
        ]);

        $this->locationBern = Location::query()->create([
            'restaurant_id' => $this->restaurantBern->getKey(),
            'location_name' => 'Bern Old Town',
            'location_address_1' => 'Kramgasse 25',
            'location_city' => 'Bern',
            'location_postcode' => '3011',
            'location_lat' => 46.9480,
            'location_lng' => 7.4474,
            'location_status' => true,
            'is_default' => true,
        ]);

        // 3. Create Disabled Restaurant (discovery_enabled = false)
        $this->restaurantDisabled = Restaurant::query()->create([
            'name' => 'Hidden Restaurant',
            'slug' => 'hidden-' . Str::lower(Str::random(6)),
            'status' => 'active',
            'timezone' => 'Europe/Zurich',
            'currency_code' => 'CHF',
            'discovery_enabled' => false,
        ]);
    }

    public function test_discovery_restaurants_returns_active_partners(): void
    {
        $response = $this->getJson('/api/v1/discovery/restaurants');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id', 'slug', 'name', 'cuisine_tags', 'listing_description',
                    'cover_photo_url', 'subdomain_url', 'currency_code', 'currency_symbol',
                    'selected_location' => [
                        'id', 'name', 'address', 'latitude', 'longitude',
                        'distance_km', 'delivery_charge', 'min_delivery_order',
                        'estimated_minutes', 'offer_delivery', 'offer_collection', 'is_open',
                    ],
                ],
            ],
            'meta' => ['page', 'limit', 'total', 'last_page'],
        ]);

        $slugs = collect($response->json('data'))->pluck('slug')->all();
        $this->assertContains($this->restaurantZurich->slug, $slugs);
        $this->assertContains($this->restaurantBern->slug, $slugs);
        $this->assertNotContains($this->restaurantDisabled->slug, $slugs);
    }

    public function test_discovery_restaurants_sorts_by_distance_nearest_first(): void
    {
        // Query from Zurich coordinates (47.3769, 8.5417)
        $response = $this->getJson('/api/v1/discovery/restaurants?latitude=47.3769&longitude=8.5417&order_type=delivery');

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertNotEmpty($data);
        // First restaurant must be Zurich (closest to 47.3769, 8.5417)
        $this->assertEquals($this->restaurantZurich->slug, $data[0]['slug']);
        $this->assertNotNull($data[0]['selected_location']['distance_km']);
        $this->assertLessThan(1.0, (float)$data[0]['selected_location']['distance_km']);
        $this->assertSame(3.5, (float)$data[0]['selected_location']['delivery_charge']);
        $this->assertSame(25.0, (float)$data[0]['selected_location']['min_delivery_order']);
    }

    public function test_discovery_cuisine_filter(): void
    {
        $response = $this->getJson('/api/v1/discovery/restaurants?cuisine=Pizza');

        $response->assertStatus(200);
        $slugs = collect($response->json('data'))->pluck('slug')->all();

        $this->assertContains($this->restaurantZurich->slug, $slugs);
        $this->assertNotContains($this->restaurantBern->slug, $slugs);
    }

    public function test_discovery_search_filter(): void
    {
        $response = $this->getJson('/api/v1/discovery/restaurants?search=Burger');

        $response->assertStatus(200);
        $slugs = collect($response->json('data'))->pluck('slug')->all();

        $this->assertContains($this->restaurantBern->slug, $slugs);
        $this->assertNotContains($this->restaurantZurich->slug, $slugs);
    }

    public function test_discovery_address_lookup(): void
    {
        $response = $this->getJson('/api/v1/discovery/address-lookup?query=Zurich');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['formatted_address', 'latitude', 'longitude', 'country'],
            ],
        ]);
        $this->assertEquals('CH', $response->json('data.0.country'));
    }

    public function test_discovery_reverse_lookup(): void
    {
        $response = $this->getJson('/api/v1/discovery/reverse-lookup?latitude=47.3769&longitude=8.5417');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => ['formatted_address', 'latitude', 'longitude', 'locality', 'country'],
        ]);
        $this->assertEquals('CH', $response->json('data.country'));
    }

    public function test_discovery_cuisines_list(): void
    {
        $response = $this->getJson('/api/v1/discovery/cuisines');

        $response->assertStatus(200);
        $names = collect($response->json('data'))->pluck('name')->all();

        $this->assertContains('Pizza', $names);
        $this->assertContains('Burgers', $names);
        $this->assertContains('Italian', $names);
    }

    public function test_marketplace_root_domain_does_not_load_default_restaurant(): void
    {
        // When visiting the marketplace host deliveriano.ch without tenant param
        config()->set('vondo.base_domain', 'deliveriano.ch');
        config()->set('vondo.marketplace_enabled', true);

        // Storefront tenant-scoped route without restaurant resolution should 404 (not default to a random restaurant)
        $response = $this->withHeaders(['Host' => 'deliveriano.ch'])
            ->getJson('/api/v1/storefront/bootstrap');

        $response->assertStatus(404);
    }

    public function test_subdomain_resolves_restaurant_over_cookie(): void
    {
        config()->set('vondo.base_domain', 'deliveriano.ch');

        // Subdomain for Zurich restaurant with an old cookie for Bern restaurant
        $response = $this->withHeaders([
            'Host' => $this->restaurantZurich->slug . '.deliveriano.ch',
        ])->withCookies([
            'vondo-restaurant' => $this->restaurantBern->slug,
        ])->getJson('/api/v1/storefront/bootstrap');

        $response->assertStatus(200);
        // Must resolve Zurich from subdomain, NOT Bern from cookie
        $this->assertEquals($this->restaurantZurich->public_id, $response->json('data.restaurant.id'));
    }

    public function test_owner_can_manage_discovery_settings_and_see_diagnostics(): void
    {
        $user = User::query()->create([
            'name' => 'Owner Test',
            'email' => 'owner-' . Str::lower(Str::random(8)) . '@example.test',
            'username' => 'owner' . Str::lower(Str::random(6)),
            'password' => bcrypt('Secret!1234'),
            'status' => true,
        ]);

        RestaurantMembership::query()->create([
            'restaurant_id' => $this->restaurantZurich->getKey(),
            'user_id' => $user->getKey(),
            'role' => 'owner',
            'status' => 'active',
        ]);

        // Create location without coordinates to test diagnostic warning
        Location::query()->create([
            'restaurant_id' => $this->restaurantZurich->getKey(),
            'location_name' => 'New Branch Without Coordinates',
            'location_address_1' => 'Somewhere in Zurich',
            'location_lat' => null,
            'location_lng' => null,
            'location_status' => true,
        ]);

        $this->actingAs($user);

        $response = $this->withTenant($this->restaurantZurich)
            ->getJson('/api/v1/owner/restaurant');

        $response->assertStatus(200);
        $this->assertFalse($response->json('data.discovery_setup.all_locations_have_coordinates'));
        $this->assertNotEmpty($response->json('data.discovery_setup.missing_locations'));
        $this->assertNotNull($response->json('data.discovery_setup.warning'));

        // Test updating discovery settings
        $updateResponse = $this->withTenant($this->restaurantZurich)
            ->patchJson('/api/v1/owner/restaurant', [
                'discovery_enabled' => true,
                'cuisine_tags' => ['Pizza', 'Italian', 'Pasta'],
                'listing_description' => 'Updated Italian kitchen description',
            ]);

        $updateResponse->assertStatus(200);
        $this->assertEquals(['Pizza', 'Italian', 'Pasta'], $updateResponse->json('data.cuisine_tags'));
        $this->assertEquals('Updated Italian kitchen description', $updateResponse->json('data.listing_description'));
    }
}
