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
            'latitude' => ['nullable', 'required_with:longitude', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'required_with:latitude', 'numeric', 'between:-180,180'],
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

            if ($cuisine) {
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
                ->whereBetween('location_lat', [-90, 90])
                ->whereBetween('location_lng', [-180, 180])
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
            $isOpen = null;
            try {
                if ($location->working_hours->isNotEmpty()) {
                    $schedule = $location->newWorkingSchedule($orderType, 0);
                    $schedule->setTimezone($restaurant->timezone ?: 'Europe/Zurich');
                    $isOpen = $schedule->isOpen();
                }
            } catch (Throwable) {
                $isOpen = null;
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
        abort_unless(config('vondo.marketplace_enabled', true), 404);
        $validated = $request->validate([
            'query' => ['required', 'string', 'between:2,255'],
        ]);

        $query = trim((string)$validated['query']);
        $googleKey = config('vondo.google_maps_api_key');

        abort_unless($googleKey, 503, 'Address search is not configured yet. Please use your current location.');

        try {
            config(['igniter-geocoder.providers.google.apiKey' => $googleKey]);
            config(['igniter-geocoder.providers.google.region' => 'CH']);
            config(['igniter-geocoder.providers.google.locale' => 'de-CH']);

            $results = Geocoder::using('google')->geocodeQuery(\Igniter\Flame\Geolite\GeoQuery::create($query . ', Switzerland')->withLimit(5));

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
            report($e);
            abort(503, 'Address search is temporarily unavailable. Please try again or use your current location.');
        }
    }

    public function reverseLookup(Request $request): JsonResponse
    {
        abort_unless(config('vondo.marketplace_enabled', true), 404);
        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $lat = (float)$validated['latitude'];
        $lng = (float)$validated['longitude'];
        $googleKey = config('vondo.google_maps_api_key');

        if (empty($googleKey)) {
            return response()->json([
                'data' => [
                    'formatted_address' => sprintf('Current location (%.4f, %.4f)', $lat, $lng),
                    'latitude' => $lat,
                    'longitude' => $lng,
                    'postal_code' => null,
                    'locality' => null,
                    'country' => null,
                ],
            ]);
        }

        try {
            config(['igniter-geocoder.providers.google.apiKey' => $googleKey]);
            config(['igniter-geocoder.providers.google.region' => 'CH']);

            $result = Geocoder::using('google')->reverseQuery(\Igniter\Flame\Geolite\GeoQuery::fromCoordinates($lat, $lng))->first();

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
                    'locality' => null,
                    'country' => null,
                ],
            ]);
        }
    }

    public function cuisines(): JsonResponse
    {
        abort_unless(config('vondo.marketplace_enabled', true), 404);
        $restaurants = Restaurant::query()
            ->where('status', 'active')
            ->where('discovery_enabled', true)
            ->whereHas('brandRevisions', fn($q) => $q->whereNotNull('published_at'))
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

}
