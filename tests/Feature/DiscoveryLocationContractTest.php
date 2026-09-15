<?php

namespace Tests\Feature;

use Igniter\Flame\Geolite\Facades\Geocoder;
use Igniter\Flame\Geolite\Model\Location;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Tests\TestCase;

class DiscoveryLocationContractTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(ThrottleRequests::class);
        config(['vondo.marketplace_enabled' => true, 'vondo.google_maps_api_key' => null]);
    }

    public function test_missing_provider_never_invents_an_address(): void
    {
        $this->getJson('/api/v1/discovery/address-lookup?query=Zurich')
            ->assertStatus(503)->assertJsonMissingPath('data.0.latitude');
    }

    public function test_reverse_without_provider_preserves_coordinates_without_inventing_a_city(): void
    {
        $this->getJson('/api/v1/discovery/reverse-lookup?latitude=46.2&longitude=6.1')
            ->assertOk()->assertJsonPath('data.latitude', 46.2)
            ->assertJsonPath('data.longitude', 6.1)->assertJsonPath('data.locality', null)
            ->assertJsonPath('data.country', null);
    }

    public function test_partial_and_invalid_coordinates_are_rejected(): void
    {
        $this->getJson('/api/v1/discovery/restaurants?latitude=47')->assertUnprocessable();
        $this->getJson('/api/v1/discovery/restaurants?latitude=91&longitude=8')->assertUnprocessable();
    }

    public function test_address_search_uses_the_installed_provider_query_contract(): void
    {
        config(['vondo.google_maps_api_key' => 'test-only']);
        $address = (new Location('test'))->setCoordinates(47.3, 8.5)->withFormattedAddress('Verified test address');
        $geocoder = \Mockery::mock();
        $geocoder->shouldReceive('using->geocodeQuery')->once()->andReturn(collect([$address]));
        Geocoder::swap($geocoder);
        $this->getJson('/api/v1/discovery/address-lookup?query=Zurich')
            ->assertOk()->assertJsonPath('data.0.formatted_address', 'Verified test address')
            ->assertJsonPath('data.0.latitude', 47.3);
    }

    public function test_feature_flag_disables_all_discovery_routes(): void
    {
        config(['vondo.marketplace_enabled' => false]);
        foreach (['restaurants', 'cuisines', 'address-lookup?query=Zurich', 'reverse-lookup?latitude=47&longitude=8'] as $path) {
            $this->getJson('/api/v1/discovery/'.$path)->assertNotFound();
        }
    }
}
