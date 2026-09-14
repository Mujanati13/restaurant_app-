<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Branding\BrandConfiguration;
use App\Platform\Models\Restaurant;
use App\Platform\Support\TenantSettings;
use Igniter\Flame\Geolite\Facades\Geocoder;
use Igniter\Flame\Geolite\Model\Coordinates;
use Igniter\Local\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Collection;
use Throwable;

class DiscoveryController extends Controller
{
    public function __construct(private readonly TenantSettings $settings) {}

    public function restaurants(Request $request): JsonResponse
    {
        abort_unless(config('vondo.marketplace_enabled', true), 404, 'Marketplace discovery is disabled.');

        $validated = $request->validate([
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'order_type' => ['nullable', 'string', 'in:delivery,collection'],
            'search' => ['nullable', 'string', 'max:100'],
            'cuisine' => ['nullable', 'string', 'max:50'],
            'radius_km' => ['nullable', 'numeric', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $latitude = isset($validated['latitude']) ? (float)$validated['latitude'] : null;
        $longitude = isset($validated['longitude']) ? (float)$validated['longitude'] : null;
        $hasCoordinates = $latitude !== null && $longitude !== null;
        $orderType = $validated['order_type'] ?? 'delivery';
        $search = isset($validated['search']) ? trim(mb_strtolower((string)$validated['search'])) : null;
        $cuisine = isset($validated['cuisine']) ? trim(mb_strtolower((string)$validated['cuisine'])) : null;
        $radiusKm = isset($validated['radius_km']) ? (float)$validated['radius_km'] : ($orderType === 'collection' ? 10.0 : 30.0);
        $page = (int)($validated['page'] ?? 1);
        $limit = (int)($validated['limit'] ?? 12);

        // Fetch active restaurants with discovery enabled
        $restaurants = Restaurant::query()
            ->where('status', 'active')
            ->where('discovery_enabled', true)
            ->with(['brandRevisions' => fn($q) => $q->whereNotNull('published_at')->latest('published_at')])
            ->get();

        $baseDomain = strtolower((string)config('vondo.base_domain', 'deliveriano.ch'));
        $results = collect();

        foreach ($restaurants as $restaurant) {
            // Must have published brand revision
            $revision = $restaurant->publishedBrand() ?: $restaurant->brandRevisions->first();
            if (!$revision) {
                continue;
            }

            // Cuisine tags
            $cuisineTags = is_array($restaurant->cuisine_tags)
                ? $restaurant->cuisine_tags
                : (json_decode((string)$restaurant->cuisine_tags, true) ?: []);

            if ($cuisine && !empty($cuisineTags)) {
                $matchesCuisine = collect($cuisineTags)->contains(fn($tag) => mb_strtolower((string)$tag) === $cuisine);
                if (!$matchesCuisine) {
                    continue;
                }
            }

            // Search filter
            if ($search && !empty($search)) {
                $nameMatch = str_contains(mb_strtolower($restaurant->name), $search);
                $descMatch = str_contains(mb_strtolower((string)$restaurant->listing_description), $search);
                $cuisineMatch = collect($cuisineTags)->contains(fn($tag) => str_contains(mb_strtolower((string)$tag), $search));
                if (!$nameMatch && !$descMatch && !$cuisineMatch) {
                    continue;
                }
            }

            // Find valid locations for this restaurant with coordinates
            $locations = Location::query()
                ->where('restaurant_id', $restaurant->getKey())
                ->where('location_status', true)
                ->whereNotNull('location_lat')
                ->whereNotNull('location_lng')
                ->where('location_lat', '!=', 0)
                ->where('location_lng', '!=', 0)
                ->with(['delivery_areas', 'working_hours'])
                ->get();

            if ($locations->isEmpty()) {
                continue;
            }

            // Find nearest eligible location
            $eligibleLocations = collect();

            foreach ($locations as $loc) {
                $locId = (int)$loc->getKey();
                $restaurantId = (int)$restaurant->getKey();
                $locLat = (float)$loc->location_lat;
                $locLng = (float)$loc->location_lng;

                // Fulfilment capability check
                $offersDelivery = $this->settings->booleanForRestaurant($restaurantId, 'delivery_enabled', true, $locId);
                $offersCollection = $this->settings->booleanForRestaurant($restaurantId, 'collection_enabled', true, $locId);

                if ($orderType === 'delivery' && !$offersDelivery) {
                    continue;
                }
                if ($orderType === 'collection' && !$offersCollection) {
                    continue;
                }

                $distanceKm = null;
                $inRange = true;

                if ($hasCoordinates) {
                    $distanceKm = $this->calculateHaversineDistance($latitude, $longitude, $locLat, $locLng);

                    if ($orderType === 'delivery') {
                        $maxRadius = (float)$this->settings->getForRestaurant($restaurantId, 'delivery_radius_km', 10.0, $locId);
                        // Check delivery areas if configured
                        if ($loc->delivery_areas->isNotEmpty()) {
                            $coords = new Coordinates($latitude, $longitude);
                            $matchedArea = $loc->searchDeliveryArea($coords);
                            $inRange = $matchedArea !== null;
                        } else {
                            $inRange = $distanceKm <= $maxRadius;
                        }
                    } elseif ($orderType === 'collection') {
                        $inRange = $distanceKm <= $radiusKm;
                    }
                }

                if ($inRange) {
                    $eligibleLocations->push([
                        'location' => $loc,
                        'distance_km' => $distanceKm,
                        'offers_delivery' => $offersDelivery,
                        'offers_collection' => $offersCollection,
                    ]);
                }
            }

            if ($eligibleLocations->isEmpty()) {
                continue;
            }

            // Pick nearest location if coordinates provided, otherwise default/first
            $bestCandidate = $hasCoordinates
                ? $eligibleLocations->sortBy('distance_km')->first()
                : ($eligibleLocations->first(fn($e) => (bool)$e['location']->is_default) ?? $eligibleLocations->first());

            /** @var Location $location */
            $location = $bestCandidate['location'];
            $locationId = (int)$location->getKey();
            $dist = $bestCandidate['distance_km'] !== null ? round($bestCandidate['distance_km'], 1) : null;

            // Brand configuration and photography
            $brandConfig = $revision->configuration ?? BrandConfiguration::defaults($restaurant->name);
            $publicBrand = BrandConfiguration::publicPayload($brandConfig);

            $coverPhoto = $restaurant->cover_photo_url
                ?: ($publicBrand['content']['hero_image_url'] ?? null);

            // Fallback to menu photo if available
            if (!$coverPhoto) {
                $menuItem = \Igniter\Cart\Models\Menu::query()
                    ->where('restaurant_id', $restaurant->getKey())
                    ->where('menu_status', true)
                    ->whereHas('media')
                    ->first();
                if ($menuItem && $menuItem->hasMedia()) {
                    $coverPhoto = $menuItem->getThumb();
                }
            }

            $logoUrl = $publicBrand['identity']['logo_url'] ?? null;

            // Working hours / availability
            $isOpen = true;
            try {
                if (method_exists($location, 'working_schedule')) {
                    $schedule = $location->working_schedule();
                    if ($schedule && method_exists($schedule, 'isOpen')) {
                        $isOpen = $schedule->isOpen();
                    }
                }
            } catch (Throwable) {
                $isOpen = true;
            }

            $restaurantId = (int)$restaurant->getKey();
            $prepTime = $this->settings->integerForRestaurant($restaurantId, 'prep_time_minutes', 20, $locationId);
            $deliveryLeadTime = $this->settings->integerForRestaurant($restaurantId, 'delivery_lead_time_minutes', 35, $locationId);
            $deliveryCharge = (float)$this->settings->getForRestaurant($restaurantId, 'delivery_charge', 0.0, $locationId);
            $minDeliveryOrder = (float)$this->settings->getForRestaurant($restaurantId, 'min_delivery_order', 0.0, $locationId);

            $results->push([
                'id' => $restaurant->public_id,
                'slug' => $restaurant->slug,
                'name' => $restaurant->name,
                'cuisine_tags' => $cuisineTags,
                'listing_description' => $restaurant->listing_description ?: ($publicBrand['identity']['tagline'] ?? null),
                'cover_photo_url' => $coverPhoto,
                'logo_url' => $logoUrl,
                'subdomain_url' => 'https://' . $restaurant->slug . '.' . $baseDomain,
                'currency_code' => $restaurant->currency_code ?: 'CHF',
                'currency_symbol' => $restaurant->currency_code === 'EUR' ? '€' : 'CHF ',
                'selected_location' => [
                    'id' => $locationId,
                    'name' => $location->location_name,
                    'address' => trim(implode(', ', array_filter([$location->location_address_1, $location->location_city, $location->location_postcode]))),
                    'latitude' => (float)$location->location_lat,
                    'longitude' => (float)$location->location_lng,
                    'distance_km' => $dist,
                    'delivery_charge' => $deliveryCharge,
                    'min_delivery_order' => $minDeliveryOrder,
                    'prep_time_minutes' => $prepTime,
                    'delivery_lead_time_minutes' => $deliveryLeadTime,
                    'estimated_minutes' => $orderType === 'delivery' ? ($prepTime + $deliveryLeadTime) : $prepTime,
                    'offer_delivery' => $bestCandidate['offers_delivery'],
                    'offer_collection' => $bestCandidate['offers_collection'],
                    'is_open' => $isOpen,
                ],
            ]);
        }

        // Sort: nearest-first if coordinates available, otherwise by name
        if ($hasCoordinates) {
            $sorted = $results->sortBy('selected_location.distance_km')->values();
        } else {
            $sorted = $results->sortBy('name')->values();
        }

        // Paginate in-memory collection
        $total = $sorted->count();
        $lastPage = max((int)ceil($total / $limit), 1);
        $offset = ($page - 1) * $limit;
        $items = $sorted->slice($offset, $limit)->values();

        return response()->json([
            'data' => $items,
            'meta' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'last_page' => $lastPage,
                'order_type' => $orderType,
                'has_coordinates' => $hasCoordinates,
                'radius_km' => $radiusKm,
            ],
        ]);
    }

    public function addressLookup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => ['required', 'string', 'between:2,255'],
        ]);

        $query = trim((string)$validated['query']);
        $googleKey = config('vondo.google_maps_api_key');

        // Test environment or fallback coordinates for verification when key is absent
        if (empty($googleKey) || app()->environment('testing')) {
            $matches = $this->mockSwissAddressMatches($query);
            return response()->json(['data' => $matches]);
        }

        try {
            config(['igniter-geocoder.providers.google.apiKey' => $googleKey]);
            config(['igniter-geocoder.providers.google.region' => 'CH']);
            config(['igniter-geocoder.providers.google.locale' => 'de-CH']);

            $results = Geocoder::using('google')->geocode($query . ', Switzerland');

            $matches = collect($results)->map(fn($item) => [
                'formatted_address' => $item->getFormattedAddress() ?: $query,
                'latitude' => $item->getCoordinates()?->getLatitude(),
                'longitude' => $item->getCoordinates()?->getLongitude(),
                'postal_code' => $item->getPostalCode(),
                'locality' => $item->getLocality() ?: $item->getAdminLevels()->first()?->getName(),
                'country' => $item->getCountryCode() ?: 'CH',
            ])->filter(fn($m) => !empty($m['latitude']) && !empty($m['longitude']))->values();

            return response()->json(['data' => $matches]);
        } catch (Throwable $e) {
            abort(503, 'Address lookup service is currently unavailable: ' . $e->getMessage());
        }
    }

    public function reverseLookup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $lat = (float)$validated['latitude'];
        $lng = (float)$validated['longitude'];
        $googleKey = config('vondo.google_maps_api_key');

        if (empty($googleKey) || app()->environment('testing')) {
            return response()->json([
                'data' => [
                    'formatted_address' => sprintf('Current location (%.4f, %.4f)', $lat, $lng),
                    'latitude' => $lat,
                    'longitude' => $lng,
                    'postal_code' => '8001',
                    'locality' => 'Zürich',
                    'country' => 'CH',
                ],
            ]);
        }

        try {
            config(['igniter-geocoder.providers.google.apiKey' => $googleKey]);
            config(['igniter-geocoder.providers.google.region' => 'CH']);

            $result = Geocoder::using('google')->reverse($lat, $lng)->first();

            return response()->json([
                'data' => [
                    'formatted_address' => $result->getFormattedAddress() ?: sprintf('Location (%.4f, %.4f)', $lat, $lng),
                    'latitude' => $result->getCoordinates()?->getLatitude() ?? $lat,
                    'longitude' => $result->getCoordinates()?->getLongitude() ?? $lng,
                    'postal_code' => $result->getPostalCode(),
                    'locality' => $result->getLocality(),
                    'country' => $result->getCountryCode() ?: 'CH',
                ],
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'data' => [
                    'formatted_address' => sprintf('Location (%.4f, %.4f)', $lat, $lng),
                    'latitude' => $lat,
                    'longitude' => $lng,
                    'locality' => 'Switzerland',
                    'country' => 'CH',
                ],
            ]);
        }
    }

    public function cuisines(): JsonResponse
    {
        $restaurants = Restaurant::query()
            ->where('status', 'active')
            ->where('discovery_enabled', true)
            ->get(['cuisine_tags']);

        $counts = [];
        foreach ($restaurants as $restaurant) {
            $tags = is_array($restaurant->cuisine_tags) ? $restaurant->cuisine_tags : (json_decode((string)$restaurant->cuisine_tags, true) ?: []);
            foreach ($tags as $tag) {
                $trimmed = trim((string)$tag);
                if ($trimmed !== '') {
                    $counts[$trimmed] = ($counts[$trimmed] ?? 0) + 1;
                }
            }
        }

        // Popular Swiss & international categories to ensure a rich explorer experience
        $popular = ['Pizza', 'Italian', 'Burgers', 'Sushi', 'Asian', 'Swiss', 'Bakery', 'Desserts', 'Healthy'];
        foreach ($popular as $p) {
            if (!isset($counts[$p])) {
                $counts[$p] = 0;
            }
        }

        $items = collect($counts)->map(fn($count, $name) => [
            'name' => $name,
            'slug' => strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $name)),
            'restaurant_count' => $count,
        ])->sortByDesc('restaurant_count')->values();

        return response()->json(['data' => $items]);
    }

    private function calculateHaversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    private function mockSwissAddressMatches(string $query): array
    {
        $q = mb_strtolower($query);
        $swissCities = [
            'zurich' => ['formatted_address' => 'Bahnhofstrasse 1, 8001 Zürich, Switzerland', 'latitude' => 47.3769, 'longitude' => 8.5417, 'postal_code' => '8001', 'locality' => 'Zürich'],
            'zürich' => ['formatted_address' => 'Bahnhofstrasse 1, 8001 Zürich, Switzerland', 'latitude' => 47.3769, 'longitude' => 8.5417, 'postal_code' => '8001', 'locality' => 'Zürich'],
            'geneva' => ['formatted_address' => 'Rue du Rhône 42, 1204 Genève, Switzerland', 'latitude' => 46.2044, 'longitude' => 6.1432, 'postal_code' => '1204', 'locality' => 'Genève'],
            'genève' => ['formatted_address' => 'Rue du Rhône 42, 1204 Genève, Switzerland', 'latitude' => 46.2044, 'longitude' => 6.1432, 'postal_code' => '1204', 'locality' => 'Genève'],
            'bern' => ['formatted_address' => 'Kramgasse 20, 3011 Bern, Switzerland', 'latitude' => 46.9480, 'longitude' => 7.4474, 'postal_code' => '3011', 'locality' => 'Bern'],
            'basel' => ['formatted_address' => 'Freie Strasse 15, 4001 Basel, Switzerland', 'latitude' => 47.5596, 'longitude' => 7.5886, 'postal_code' => '4001', 'locality' => 'Basel'],
            'lausanne' => ['formatted_address' => 'Place Saint-François 5, 1003 Lausanne, Switzerland', 'latitude' => 46.5197, 'longitude' => 6.6323, 'postal_code' => '1003', 'locality' => 'Lausanne'],
            'winterthur' => ['formatted_address' => 'Marktgasse 30, 8400 Winterthur, Switzerland', 'latitude' => 47.4999, 'longitude' => 8.7241, 'postal_code' => '8400', 'locality' => 'Winterthur'],
            'lucerne' => ['formatted_address' => 'Kapellgasse 8, 6004 Luzern, Switzerland', 'latitude' => 47.0502, 'longitude' => 8.3093, 'postal_code' => '6004', 'locality' => 'Luzern'],
            'luzern' => ['formatted_address' => 'Kapellgasse 8, 6004 Luzern, Switzerland', 'latitude' => 47.0502, 'longitude' => 8.3093, 'postal_code' => '6004', 'locality' => 'Luzern'],
        ];

        foreach ($swissCities as $city => $data) {
            if (str_contains($q, $city)) {
                return [[
                    'formatted_address' => $data['formatted_address'],
                    'latitude' => $data['latitude'],
                    'longitude' => $data['longitude'],
                    'postal_code' => $data['postal_code'],
                    'locality' => $data['locality'],
                    'country' => 'CH',
                ]];
            }
        }

        // Default Swiss fallback match for query
        return [[
            'formatted_address' => ucwords($query) . ', Switzerland',
            'latitude' => 47.3769,
            'longitude' => 8.5417,
            'postal_code' => '8001',
            'locality' => 'Zürich',
            'country' => 'CH',
        ]];
    }
}
