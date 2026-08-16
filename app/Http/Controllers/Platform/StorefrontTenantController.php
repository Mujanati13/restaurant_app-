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

        return response()->json(['data' => [
            'restaurant' => [
                'id' => $restaurant->public_id,
                'name' => $restaurant->name,
                'slug' => $restaurant->slug,
                'status' => $restaurant->status,
            ],
            'brand' => $brandPayload,
            'brand_version' => $brand?->version ?? 0,
            'currency' => [
                'code' => $restaurant->currency_code ?: $currency->currency_code,
                'symbol' => $currency->currency_symbol,
                'symbol_position' => (bool)$currency->symbol_position,
                'decimal_position' => (int)$currency->decimal_position,
            ],
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
        $data = $request->validate([
            'category_id' => ['nullable', 'integer'], 'search' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'], 'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $menus = Menu::query()->with(['categories', 'media'])
            ->where('restaurant_id', $this->tenant->id())->where('menu_status', true)
            ->when($data['category_id'] ?? null, fn($query, $id) => $query->whereHas('categories', fn($category) => $category->whereKey($id)))
            ->when($data['search'] ?? null, fn($query, $search) => $query->where(fn($match) => $match->where('menu_name', 'like', '%'.$search.'%')->orWhere('menu_description', 'like', '%'.$search.'%')))
            ->orderBy('menu_priority')->orderBy('menu_name')
            ->paginate($data['limit'] ?? 30, ['*'], 'page', $data['page'] ?? 1);

        return response()->json([
            'data' => $menus->getCollection()->map(fn(Menu $menu) => [
                'id' => (int)$menu->getKey(), 'name' => $menu->menu_name,
                'description' => $menu->menu_description, 'price' => (float)$menu->menu_price,
                'image' => $menu->hasMedia() ? $menu->getThumb() : null,
                'category_ids' => $menu->categories->map(fn($category) => (int)$category->getKey())->values(),
                'is_special' => (bool)($menu->special?->active ?? false),
            ])->values(),
            'meta' => ['page' => $menus->currentPage(), 'limit' => $menus->perPage(), 'total' => $menus->total(), 'last_page' => $menus->lastPage()],
        ]);
    }

    public function menu(int $menuId): JsonResponse
    {
        $menu = Menu::query()->with(['categories', 'media', 'menu_options.menu_option_values'])
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
            'id' => (int)$location->getKey(), 'name' => $location->location_name,
            'address' => trim(implode(', ', array_filter([$location->location_address_1, $location->location_city]))),
            'phone' => $location->location_telephone, 'email' => $location->location_email,
            'image' => $location->hasMedia() ? $location->getThumb() : null,
        ])->values()]);
    }
}
