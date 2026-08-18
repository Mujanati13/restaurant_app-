<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Branding\BrandConfiguration;
use App\Platform\Support\TenantCache;
use App\Platform\Support\TenantSettings;
use App\Platform\Tenancy\TenantContext;
use App\Platform\Models\AppBuild;
use Igniter\Cart\Models\Category;
use Igniter\Cart\Models\Menu;
use Igniter\Flame\Currency\Facades\Currency;
use Igniter\Local\Models\Location;
use Igniter\System\Models\Country;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class StorefrontTenantController extends Controller
{
    public function __construct(
        private readonly TenantContext $tenant,
        private readonly TenantCache $cache,
        private readonly TenantSettings $settings,
    ) {}

    public function bootstrap(Request $request): JsonResponse
    {
        $restaurant = $this->tenant->get();
        $locationId = $request->integer('location_id') ?: null;
        if ($locationId) abort_unless(Location::query()->where('restaurant_id', $this->tenant->id())->whereKey($locationId)->exists(), 404);
        $currency = Currency::getDefault();
        $brand = $restaurant->publishedBrand();
        $brandPayload = $this->cache->remember(
            'published-brand',
            300,
            fn() => BrandConfiguration::publicPayload($brand?->configuration ?? BrandConfiguration::defaults($restaurant->name)),
            $brand?->version ?? 0,
        );
        foreach (['android', 'ios'] as $platform) {
            $configuration = AppBuild::query()->where('restaurant_id', $this->tenant->id())->where('platform', $platform)
                ->where('status', 'succeeded')->latest('finished_at')->first(['configuration'])?->configuration;
            $identity = is_array($configuration) ? ($configuration['mobile_identity'] ?? null) : null;
            if (!is_array($identity)) continue;
            $brandPayload['mobile'][$platform] = $platform === 'android'
                ? ['package_name' => $identity['package_name'], 'sha256_cert_fingerprints' => $identity['sha256_cert_fingerprints']]
                : ['team_id' => $identity['team_id'], 'bundle_id' => $identity['bundle_id']];
        }
        $primaryHost = $restaurant->domains()->where('is_primary', true)->value('host') ?: $request->getHost();

        $rawSettings = $restaurant->settings()->pluck('value', 'key')->all();

        // Build active payment methods for storefront
        $paymentMethods = [];
        if (filter_var($rawSettings['payments_cod_enabled'] ?? true, FILTER_VALIDATE_BOOLEAN)) {
            $paymentMethods[] = [
                'code' => 'cod',
                'name' => $rawSettings['payments_cod_label'] ?? 'Cash on Delivery',
                'instructions' => $rawSettings['payments_cod_notes'] ?? 'Please have exact cash ready upon delivery.',
                'min_order' => (float)($rawSettings['payments_cod_min'] ?? 0),
                'max_order' => (float)($rawSettings['payments_cod_max'] ?? 0),
            ];
        }
        if (filter_var($rawSettings['payments_card_on_delivery_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            $paymentMethods[] = [
                'code' => 'card_on_delivery',
                'name' => $rawSettings['payments_card_on_delivery_label'] ?? 'Card on Delivery (Mobile POS)',
                'instructions' => $rawSettings['payments_card_on_delivery_notes'] ?? 'Our courier will bring a mobile contactless card reader.',
            ];
        }
        if (filter_var($rawSettings['payments_stripe_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN) && !empty($rawSettings['payments_stripe_publishable_key'])) {
            $paymentMethods[] = [
                'code' => 'stripe',
                'name' => 'Credit / Debit Card (Stripe)',
                'publishable_key' => $rawSettings['payments_stripe_publishable_key'],
                'test_mode' => filter_var($rawSettings['payments_stripe_test_mode'] ?? true, FILTER_VALIDATE_BOOLEAN),
            ];
        }
        if (filter_var($rawSettings['payments_paypal_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN) && !empty($rawSettings['payments_paypal_client_id'])) {
            $paymentMethods[] = [
                'code' => 'paypal',
                'name' => 'PayPal',
                'client_id' => $rawSettings['payments_paypal_client_id'],
                'sandbox' => filter_var($rawSettings['payments_paypal_sandbox'] ?? true, FILTER_VALIDATE_BOOLEAN),
            ];
        }
        if (filter_var($rawSettings['payments_bank_transfer_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            $paymentMethods[] = [
                'code' => 'bank_transfer',
                'name' => 'Bank Wire Transfer',
                'bank_name' => $rawSettings['payments_bank_name'] ?? '',
                'account_number' => $rawSettings['payments_bank_account_number'] ?? '',
                'routing_number' => $rawSettings['payments_bank_routing_number'] ?? '',
                'instructions' => $rawSettings['payments_bank_transfer_instructions'] ?? 'Please include your Order # as payment reference.',
            ];
        }
        if (empty($paymentMethods)) {
            $paymentMethods[] = [
                'code' => 'cod',
                'name' => 'Cash on Delivery',
                'instructions' => 'Please have exact cash ready upon delivery.',
            ];
        }

        // Tip Presets
        $rawTipPresets = $rawSettings['tip_presets'] ?? '10, 15, 20, 25';
        $tipPresets = array_values(array_filter(array_map('intval', explode(',', (string)$rawTipPresets))));
        if (empty($tipPresets)) {
            $tipPresets = [10, 15, 20];
        }

        return response()->json(['data' => [
            'restaurant' => [
                'id' => $restaurant->public_id,
                'name' => $restaurant->name,
                'slug' => $restaurant->slug,
                'status' => $restaurant->status,
                'email' => $rawSettings['business_email'] ?? null,
                'phone' => $rawSettings['business_phone'] ?? null,
                'address' => $rawSettings['business_address'] ?? null,
            ],
            'brand' => $brandPayload,
            'brand_version' => $brand?->version ?? 0,
            'currency' => [
                'code' => $restaurant->currency_code ?: $currency->currency_code,
                'symbol' => $rawSettings['currency_symbol'] ?? $currency->currency_symbol,
                'symbol_position' => (bool)$currency->symbol_position,
                'decimal_position' => (int)$currency->decimal_position,
            ],
            'settings' => [
                'tax_rate' => (float)($rawSettings['tax_rate'] ?? 0),
                'tax_id' => $rawSettings['tax_id'] ?? null,
                'guest_checkout_enabled' => filter_var($rawSettings['guest_checkout_enabled'] ?? true, FILTER_VALIDATE_BOOLEAN),
                'tipping_enabled' => filter_var($rawSettings['tipping_enabled'] ?? true, FILTER_VALIDATE_BOOLEAN),
                'tip_presets' => $tipPresets,
                'cancellation_window_minutes' => (int)($rawSettings['cancellation_window_minutes'] ?? 5),
                'social_links' => [
                    'facebook' => $rawSettings['facebook_url'] ?? null,
                    'instagram' => $rawSettings['instagram_url'] ?? null,
                    'twitter' => $rawSettings['twitter_url'] ?? null,
                    'tiktok' => $rawSettings['tiktok_url'] ?? null,
                    'google_maps' => $rawSettings['google_maps_url'] ?? null,
                ],
            ],
            'payment_methods' => $paymentMethods,
            'defaults' => [
                'country_id' => $this->settings->integer('default_country_id', (int) Country::getDefaultKey()),
                'order_status_id' => $this->settings->integer('default_order_status_id', (int) setting('default_order_status'), $locationId),
                'reservation_status_id' => $this->settings->integer('default_reservation_status_id', (int) setting('default_reservation_status'), $locationId),
            ],
            'capabilities' => [
                'orders' => $this->settings->boolean('orders_enabled', true, $locationId),
                'reservations' => $this->settings->boolean('reservations_enabled', true, $locationId),
                'collection' => $this->settings->boolean('collection_enabled', true, $locationId),
                'delivery' => $this->settings->boolean('delivery_enabled', true, $locationId),
            ],
            'pages' => $restaurant->pages()->orderByDesc('is_home')->orderBy('title')->get(['slug', 'title', 'is_home'])
                ->map(fn($page) => ['slug' => $page->slug, 'title' => $page->title, 'is_home' => (bool) $page->is_home])->values(),
            'deep_links' => [
                'base_url' => 'https://'.$primaryHost,
                'routes' => ['home' => '/', 'menu' => '/menu/{id}', 'order' => '/account/orders/{id}', 'reservation' => '/reservations'],
                'custom_scheme' => 'vondo-'.$restaurant->slug.'://',
            ],
        ]]);
    }

    public function categories(Request $request): JsonResponse
    {
        $limit = min(max($request->integer('limit', 100), 1), 100);
        $categories = Category::query()->where('restaurant_id', $this->tenant->id())
            ->where('status', true)->orderBy('priority')->orderBy('name')->paginate($limit);

        return response()->json([
            'data' => $categories->getCollection()->map(fn(Category $category) => [
                'id' => (int)$category->getKey(), 'name' => $category->name,
                'description' => $category->description, 'slug' => $category->permalink_slug,
            ])->values(),
            'meta' => ['page' => $categories->currentPage(), 'limit' => $categories->perPage(), 'total' => $categories->total(), 'last_page' => $categories->lastPage()],
        ]);
    }

    public function menus(Request $request): JsonResponse
    {
        $limit = min(max($request->integer('limit', 100), 1), 100);
        $menus = Menu::query()->with(['categories', 'media'])->where('restaurant_id', $this->tenant->id())
            ->where('menu_status', true)->orderBy('menu_priority')->orderBy('menu_name')->paginate($limit);

        return response()->json([
            'data' => $menus->getCollection()->map(fn(Menu $menu) => [
                'id' => (int)$menu->getKey(), 'name' => $menu->menu_name, 'description' => $menu->menu_description,
                'price' => (float)$menu->menu_price, 'image' => $menu->hasMedia() ? $menu->getThumb() : null,
                'category_ids' => $menu->categories->map(fn($category) => (int)$category->getKey())->values(),
                'is_special' => (bool)$menu->is_special,
            ])->values(),
            'meta' => ['page' => $menus->currentPage(), 'limit' => $menus->perPage(), 'total' => $menus->total(), 'last_page' => $menus->lastPage()],
        ]);
    }

    public function menu(int $menuId): JsonResponse
    {
        $menu = Menu::query()->with(['categories', 'media', 'menu_options.menu_option_values.option_value'])
            ->where('restaurant_id', $this->tenant->id())->where('menu_status', true)->findOrFail($menuId);

        return response()->json(['data' => [
            'id' => (int)$menu->getKey(), 'name' => $menu->menu_name, 'description' => $menu->menu_description,
            'price' => (float)$menu->menu_price, 'image' => $menu->hasMedia() ? $menu->getThumb() : null,
            'category_ids' => $menu->categories->map(fn($category) => (int)$category->getKey())->values(),
            'options' => $menu->menu_options->map(fn($option) => [
                'id' => (int)$option->getKey(),
                'name' => $option->option_name ?? $option->name ?? 'Option',
                'display_type' => $option->display_type ?? 'checkbox',
                'required' => (bool)$option->is_required,
                'min_selected' => (int)$option->min_selected,
                'max_selected' => (int)$option->max_selected,
                'values' => $option->menu_option_values->map(fn($value) => [
                    'id' => (int)$value->getKey(),
                    'name' => $value->name ?? $value->option_value?->name ?? 'Option',
                    'price' => (float)($value->override_price ?? $value->price ?? 0),
                    'is_default' => (bool)$value->is_default,
                ])->values(),
            ])->values(),
        ]]);
    }

    public function locations(): JsonResponse
    {
        $locations = Location::query()->where('restaurant_id', $this->tenant->id())
            ->where('location_status', true)->orderByDesc('is_default')->orderBy('location_name')->get();

        return response()->json(['data' => $locations->map(fn(Location $location) => [
            'id' => (int)$location->getKey(),
            'name' => $location->location_name,
            'address' => trim(implode(', ', array_filter([$location->location_address_1, $location->location_address_2, $location->location_city, $location->location_postcode]))),
            'phone' => $location->location_telephone,
            'email' => $location->location_email,
            'is_default' => (bool)$location->is_default,
            'offer_delivery' => $this->settings->boolean('delivery_enabled', true, (int)$location->getKey()),
            'offer_collection' => $this->settings->boolean('collection_enabled', true, (int)$location->getKey()),
            'min_delivery_order' => (float)$this->settings->get('min_delivery_order', 0.0, (int)$location->getKey()),
            'delivery_charge' => (float)$this->settings->get('delivery_charge', 0.0, (int)$location->getKey()),
            'delivery_radius_km' => (float)$this->settings->get('delivery_radius_km', 10.0, (int)$location->getKey()),
            'prep_time_minutes' => (int)$this->settings->integer('prep_time_minutes', 20, (int)$location->getKey()),
            'delivery_lead_time_minutes' => (int)$this->settings->integer('delivery_lead_time_minutes', 35, (int)$location->getKey()),
            'image' => $location->hasMedia() ? $location->getThumb() : null,
        ])->values()]);
    }
}
