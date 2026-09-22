<?php

namespace Database\Seeders;

use App\Platform\Models\Restaurant;
use App\Platform\Models\RestaurantBrandRevision;
use App\Platform\Models\RestaurantLocationSetting;
use App\Platform\Models\RestaurantSubscription;
use App\Platform\Models\SubscriptionPlan;
use App\Platform\Models\PlatformAlert;
use App\Platform\Models\StorefrontReview;
use App\Platform\Models\StorefrontOffer;
use App\Platform\Provisioning\RestaurantDefaults;
use Igniter\Cart\Models\Category;
use Igniter\Cart\Models\Menu;
use Igniter\Cart\Models\MenuItemOption;
use Igniter\Cart\Models\MenuItemOptionValue;
use Igniter\Cart\Models\MenuOption;
use Igniter\Cart\Models\MenuOptionValue;
use Igniter\Cart\CartItem;
use Igniter\Cart\Models\Order;
use Igniter\Local\Models\Location;
use Igniter\Reservation\Models\Reservation;
use Igniter\User\Models\Customer;
use Igniter\User\Models\CustomerGroup;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;

/**
 * Development-only discovery catalogue. It is intentionally not called by
 * DatabaseSeeder: production installs must never receive fictional partners.
 */
class VondoMarketplaceDemoSeeder extends Seeder
{
    public const SLUGS = [
        'alpina-pizza', 'tamarind-table', 'miso-momo', 'green-fork', 'la-pomme', 'burger-werk',
        'rhone-ramen', 'chez-lucie', 'mediterraneo', 'garden-geneve', 'lake-tacos', 'boulangerie-noir',
        'rhein-bowl', 'basel-bites', 'saffron-alley', 'pasta-porto', 'thai-lotus', 'cocoa-corner',
        'bern-brunch', 'lausanne-levante', 'luzern-noodle', 'st-gallen-spice', 'winterthur-wok', 'closed-kitchen',
    ];
    public function __construct(private readonly RestaurantDefaults $defaults) {}

    public function run(): void
    {
        // Fixture accounts go through the normal registration code, but a demo
        // run must never contact customers or enqueue operational work.
        Mail::fake();
        Notification::fake();
        Queue::fake();
        $catalogue = [
            ['alpina-pizza', 'Alpina Pizza', 'Pizza', 'Zurich', 47.3769, 8.5417],
            ['tamarind-table', 'Tamarind Table', 'Indian', 'Zurich', 47.3722, 8.5391],
            ['miso-momo', 'Miso & Momo', 'Japanese', 'Zurich', 47.3817, 8.5365],
            ['green-fork', 'Green Fork', 'Vegetarian', 'Zurich', 47.3658, 8.5486],
            ['la-pomme', 'La Pomme', 'French', 'Zurich', 47.3698, 8.5430],
            ['burger-werk', 'Burger Werk', 'Burgers', 'Zurich', 47.3784, 8.5261],
            ['rhone-ramen', 'Rhone Ramen', 'Japanese', 'Geneva', 46.2044, 6.1432],
            ['chez-lucie', 'Chez Lucie', 'French', 'Geneva', 46.2012, 6.1507],
            ['mediterraneo', 'Mediterraneo', 'Italian', 'Geneva', 46.2071, 6.1476],
            ['garden-geneve', 'Garden Geneve', 'Vegetarian', 'Geneva', 46.1986, 6.1428],
            ['lake-tacos', 'Lake Tacos', 'Mexican', 'Geneva', 46.2102, 6.1374],
            ['boulangerie-noir', 'Boulangerie Noir', 'Bakery', 'Geneva', 46.2031, 6.1541],
            ['rhein-bowl', 'Rhein Bowl', 'Healthy', 'Basel', 47.5596, 7.5886],
            ['basel-bites', 'Basel Bites', 'Burgers', 'Basel', 47.5568, 7.5936],
            ['saffron-alley', 'Saffron Alley', 'Middle Eastern', 'Basel', 47.5621, 7.5819],
            ['pasta-porto', 'Pasta Porto', 'Italian', 'Basel', 47.5549, 7.5801],
            ['thai-lotus', 'Thai Lotus', 'Thai', 'Basel', 47.5672, 7.5905],
            ['cocoa-corner', 'Cocoa Corner', 'Bakery', 'Basel', 47.5535, 7.6002],
            ['bern-brunch', 'Bern Brunch', 'Bakery', 'Zurich', 47.3661, 8.5494],
            ['lausanne-levante', 'Lausanne Levante', 'Middle Eastern', 'Zurich', 47.3741, 8.5558],
            ['luzern-noodle', 'Luzern Noodle', 'Thai', 'Geneva', 46.1964, 6.1573],
            ['st-gallen-spice', 'St. Gallen Spice', 'Indian', 'Geneva', 46.2148, 6.1325],
            ['winterthur-wok', 'Winterthur Wok', 'Japanese', 'Basel', 47.5652, 7.6022],
            ['closed-kitchen', 'Closed Kitchen', 'Pizza', 'Basel', 47.5508, 7.5741],
        ];

        DB::transaction(function () use ($catalogue): void {
            $plan = SubscriptionPlan::query()->updateOrCreate(['code' => 'demo-growth'], [
                'name' => 'Demo Growth', 'price_minor' => 4900, 'currency_code' => 'CHF', 'active' => true,
                'features' => ['online_ordering', 'reservations', 'customer_accounts', 'custom_domain'],
            ]);
            foreach ($catalogue as $index => [$slug, $name, $cuisine, $city, $latitude, $longitude]) {
                $restaurant = Restaurant::query()->updateOrCreate(['slug' => $slug], [
                    'name' => $name, 'status' => $slug === 'closed-kitchen' ? 'suspended' : 'active',
                    'timezone' => 'Europe/Zurich', 'currency_code' => 'CHF',
                    'discovery_enabled' => $slug !== 'closed-kitchen', 'cuisine_tags' => [$cuisine],
                    'listing_description' => "Independent {$cuisine} cooking in {$city}.",
                    'cover_photo_url' => $this->foodPhoto($index),
                ]);
                $this->defaults->apply($restaurant);
                foreach ([
                    'orders_enabled' => $slug !== 'closed-kitchen',
                    'delivery_enabled' => $index !== 3,
                    'collection_enabled' => $index !== 4,
                ] as $key => $value) $restaurant->settings()->updateOrCreate(['key' => $key], ['value' => $value]);
                RestaurantSubscription::query()->updateOrCreate(['restaurant_id' => $restaurant->getKey()], [
                    'subscription_plan_id' => $plan->getKey(), 'status' => $restaurant->status === 'suspended' ? 'past_due' : 'active',
                    'current_period_ends_at' => now()->addMonth(),
                ]);
                if ($index < 12) {
                    foreach ([['WELCOME10', 'percent', 10.0, 20.0], ['SAVE5', 'fixed', 5.0, 30.0], ['LUNCH15', 'percent', 15.0, 35.0]] as [$suffix, $type, $amount, $minimum]) {
                        StorefrontOffer::query()->updateOrCreate(['restaurant_id' => $restaurant->getKey(), 'code' => $suffix], [
                            'type' => $type, 'amount' => $amount, 'minimum_order' => $minimum, 'active' => true,
                            'starts_at' => now()->subMonth(), 'ends_at' => $suffix === 'LUNCH15' ? now()->subDay() : now()->addMonth(),
                        ]);
                    }
                }
                RestaurantBrandRevision::query()->updateOrCreate([
                    'restaurant_id' => $restaurant->getKey(), 'version' => 1,
                ], [
                    'published_at' => now(),
                    'configuration' => ['identity' => ['name' => $name, 'tagline' => "Fresh {$cuisine} in {$city}"], 'theme' => ['primary' => '#06c167'], 'content' => ['hero_image_url' => $restaurant->cover_photo_url], 'navigation' => [], 'sections' => []],
                ]);
                $location = Location::query()->updateOrCreate([
                    'restaurant_id' => $restaurant->getKey(), 'location_name' => "{$city} Central",
                ], [
                    'location_address_1' => 'Demo Street '.($index + 1), 'location_city' => $city,
                    'location_postcode' => '800'.($index % 10), 'location_lat' => $latitude,
                    'location_lng' => $longitude, 'location_status' => true, 'is_default' => true,
                ]);
                foreach (['min_delivery_order' => 20 + ($index % 3) * 5, 'delivery_charge' => 2.5 + ($index % 3), 'delivery_radius_km' => 12, 'prep_time_minutes' => 20 + ($index % 3) * 5, 'delivery_lead_time_minutes' => 35 + ($index % 3) * 5, 'scheduled_order_start_hour' => 10, 'scheduled_order_end_hour' => 22] as $key => $value) {
                    RestaurantLocationSetting::query()->updateOrCreate(['restaurant_id' => $restaurant->getKey(), 'location_id' => $location->getKey(), 'key' => $key], ['value' => $value]);
                }
                // Six categories and thirty dishes per restaurant: 144 categories and 720 dishes.
                $categories = collect(['Popular', 'Starters', 'Mains', 'Sides', 'Desserts', 'Drinks'])->map(function (string $name, int $priority) use ($restaurant) {
                    $category = Category::query()->firstOrNew(['restaurant_id' => $restaurant->getKey(), 'name' => $name]);
                    $category->forceFill(['restaurant_id' => $restaurant->getKey(), 'description' => "{$name} at {$restaurant->name}", 'status' => true, 'priority' => $priority + 1])->save();
                    return $category;
                });
                $menuCount = $slug === 'closed-kitchen' ? 0 : ($slug === 'alpina-pizza' ? 60 : 30);
                for ($dish = 1; $dish <= $menuCount; $dish++) {
                    $category = $categories[($dish - 1) % $categories->count()];
                    $menu = Menu::query()->firstOrNew(['restaurant_id' => $restaurant->getKey(), 'menu_name' => "{$cuisine} Signature {$dish}"]);
                    $menu->forceFill([
                        'restaurant_id' => $restaurant->getKey(), 'menu_description' => "A freshly prepared {$cuisine} favourite with seasonal Swiss ingredients.",
                        'menu_price' => 8.5 + (($dish * 3 + $index) % 18), 'menu_status' => !($dish === 30 && $index % 4 === 0),
                        'minimum_qty' => 1, 'menu_priority' => $dish,
                    ])->save();
                    $menu->categories()->syncWithoutDetaching([$category->getKey()]);
                    $this->attachDemoOptions($menu, $restaurant->getKey(), $dish);
                }
                // Six partners have a second nearby branch, giving the requested 30 locations.
                if ($index < 6) {
                    $branch = Location::query()->updateOrCreate(['restaurant_id' => $restaurant->getKey(), 'location_name' => "{$city} West"], [
                        'location_address_1' => 'Demo Avenue '.($index + 101), 'location_city' => $city, 'location_postcode' => '800'.(($index + 5) % 10),
                        'location_lat' => $latitude + 0.008, 'location_lng' => $longitude - 0.008, 'location_status' => true, 'is_default' => false,
                    ]);
                    foreach (['min_delivery_order' => 25, 'delivery_charge' => 3.5, 'delivery_radius_km' => 10, 'prep_time_minutes' => 25, 'delivery_lead_time_minutes' => 40, 'scheduled_order_start_hour' => 10, 'scheduled_order_end_hour' => 22] as $key => $value) {
                        RestaurantLocationSetting::query()->updateOrCreate(['restaurant_id' => $restaurant->getKey(), 'location_id' => $branch->getKey(), 'key' => $key], ['value' => $value]);
                    }
                }
                // Five tenant-scoped customers per partner, each with two saved addresses.
                $groupId = CustomerGroup::query()->where('is_default', true)->value('customer_group_id') ?? CustomerGroup::query()->value('customer_group_id');
                $customerCount = $slug === 'closed-kitchen' ? 0 : ($slug === 'alpina-pizza' ? 10 : 5);
                $customers = ($customerCount ? collect(range(1, $customerCount)) : collect())->map(function (int $number) use ($restaurant, $city, $groupId) {
                    $email = "demo-{$restaurant->slug}-{$number}@vondo.local";
                    $customer = Customer::query()->where('restaurant_id', $restaurant->getKey())->where('email', $email)->first();
                    if (!$customer) {
                        $customer = (new Customer)->register([
                            'first_name' => 'Demo', 'last_name' => "Customer {$number}", 'email' => $email,
                            'telephone' => '+41 44 555 01 '.str_pad((string)$number, 2, '0', STR_PAD_LEFT), 'password' => 'DemoCustomer!2026',
                            'customer_group_id' => $groupId, 'status' => true, 'is_activated' => true, 'activated_at' => now(),
                        ]);
                        $customer->forceFill(['restaurant_id' => $restaurant->getKey()])->save();
                    }
                    foreach (['Demo Street '.$number, 'Market Lane '.$number] as $address) {
                        $customer->addresses()->firstOrCreate(['address_1' => $address, 'restaurant_id' => $restaurant->getKey()], [
                            'city' => $city, 'postcode' => '800'.$number, 'country_id' => $this->defaultsCountryId(),
                        ]);
                    }
                    return $customer;
                });
                // Twenty-five historic/current orders per partner, rebalanced around the empty-menu fixture: 600 records.
                $menuItems = Menu::query()->where('restaurant_id', $restaurant->getKey())->where('menu_status', true)->orderBy('menu_id')->get();
                $statusId = (int)setting('default_order_status');
                $orderCount = $slug === 'closed-kitchen' ? 0 : ($slug === 'alpina-pizza' ? 50 : 25);
                foreach ($orderCount ? range(1, $orderCount) : [] as $number) {
                    $marker = "demo-order:{$restaurant->slug}:{$number}";
                    if (Order::query()->where('restaurant_id', $restaurant->getKey())->where('comment', $marker)->exists()) continue;
                    $menu = $menuItems[($number - 1) % $menuItems->count()];
                    $customer = $customers[($number - 1) % $customers->count()];
                    $date = $number % 4 === 0 ? now()->addDays(($number % 3) + 1) : now()->subDays($number % 14);
                    $order = new Order();
                    $order->forceFill([
                        'restaurant_id' => $restaurant->getKey(), 'customer_id' => $customer->getKey(), 'location_id' => $location->getKey(),
                        'first_name' => $customer->first_name, 'last_name' => $customer->last_name, 'email' => $customer->email, 'telephone' => $customer->telephone,
                        'order_type' => $number % 3 === 0 ? 'collection' : 'delivery', 'payment' => $number % 5 === 0 ? 'stripe' : 'cod', 'processed' => $number % 5 !== 0,
                        'status_id' => $statusId, 'order_date' => $date->toDateString(), 'order_time' => $date->format('H:i'), 'order_time_is_asap' => $number % 4 !== 0,
                        'comment' => $marker, 'total_items' => 1, 'order_total' => (float)$menu->menu_price,
                        'cancelled_at' => $number % 13 === 0 ? now()->subDays(2) : null,
                        'cancel_reason' => $number % 13 === 0 ? 'Demo customer cancellation' : null,
                    ])->save();
                    $order->addOrderMenus([new CartItem($menu->getKey(), $menu->menu_name, (float)$menu->menu_price, [], '')]);
                    \Illuminate\Support\Facades\DB::table('order_menus')->where('order_id', $order->getKey())->update(['restaurant_id' => $restaurant->getKey()]);
                }
                if ($index < 18) {
                    foreach (range(1, 5) as $number) {
                        $marker = "demo-reservation:{$restaurant->slug}:{$number}";
                        if (Reservation::query()->where('restaurant_id', $restaurant->getKey())->where('comment', $marker)->exists()) continue;
                        $customer = $customers[($number - 1) % $customers->count()];
                        $reservation = new Reservation();
                        // MySQL installations may expose reserve_datetime as a generated column.
                        $reservation->offsetUnset('reserve_datetime');
                        $reservation->forceFill([
                            'restaurant_id' => $restaurant->getKey(), 'customer_id' => $customer->getKey(), 'location_id' => $location->getKey(),
                            'guest_num' => 2 + ($number % 4), 'reserve_date' => now()->addDays($number - 3)->toDateString(), 'reserve_time' => '19:00',
                            'duration' => 90, 'first_name' => $customer->first_name, 'last_name' => $customer->last_name, 'email' => $customer->email,
                            'telephone' => $customer->telephone, 'comment' => $marker, 'status_id' => (int)setting('default_reservation_status'),
                            'hash' => md5($marker),
                        ])->save();
                    }
                }
                Order::query()->where('restaurant_id', $restaurant->getKey())->where('comment', 'like', "demo-order:{$restaurant->slug}:%")
                    ->orderBy('order_id')->take($slug === 'alpina-pizza' ? 20 : 10)->get()->each(function (Order $order, int $reviewIndex) use ($restaurant, $customers): void {
                        StorefrontReview::query()->updateOrCreate([
                            'restaurant_id' => $restaurant->getKey(), 'customer_id' => $customers[$reviewIndex % $customers->count()]->getKey(), 'order_id' => $order->getKey(),
                        ], ['rating' => 3 + ($reviewIndex % 3), 'comment' => 'Deterministic demo review for marketplace presentation.']);
                    });
                PlatformAlert::query()->updateOrCreate(['fingerprint' => "demo:{$restaurant->slug}"], [
                    'restaurant_id' => $restaurant->getKey(), 'type' => 'demo_data', 'severity' => $index % 8 === 0 ? 'warning' : 'info',
                    'status' => $index % 8 === 0 ? 'open' : 'resolved', 'message' => 'Demo operational alert.', 'context' => ['seeded' => true],
                    'first_seen_at' => now()->subDay(), 'last_seen_at' => now(), 'resolved_at' => $index % 8 === 0 ? null : now(),
                ]);
            }
        });
        $this->command?->info('Marketplace demo seeded: 24 Swiss discovery restaurants.');
    }

    private function defaultsCountryId(): int
    {
        return (int) \Igniter\System\Models\Country::getDefaultKey();
    }

    /** Attach deterministic size and extra choices through the normal cart models. */
    private function attachDemoOptions(Menu $menu, int $restaurantId, int $dish): void
    {
        $size = $this->option($restaurantId, 'Choose a size', 'radio', 1);
        $extras = $this->option($restaurantId, 'Extras', 'checkbox', 2);
        $sizeValues = collect([['Regular', 0.0], ['Large', 3.5]])->map(fn(array $value) => $this->optionValue(
            $size, $restaurantId, $value[0], $value[1], $value[0] === 'Regular' ? 1 : 2,
        ));
        $extraValues = collect([['Extra herbs', 0.8], ['Swiss cheese', 1.8], ['Chili oil', 0.5]])->map(fn(array $value) => $this->optionValue(
            $extras, $restaurantId, $value[0], $value[1], array_search($value[0], ['Extra herbs', 'Swiss cheese', 'Chili oil']) + 1,
        ));
        if ($dish <= 18) $this->attachOption($menu, $size, $sizeValues, true, 1, 1);
        if ($dish % 2 === 0) $this->attachOption($menu, $extras, $extraValues, false, 0, 3);
    }

    private function attachOption(Menu $menu, MenuOption $option, $values, bool $required, int $min, int $max): void
    {
        $itemOption = MenuItemOption::query()->where('restaurant_id', $menu->restaurant_id)->where('menu_id', $menu->getKey())->where('option_id', $option->getKey())->first() ?? new MenuItemOption;
        $itemOption->forceFill(['restaurant_id' => $menu->restaurant_id, 'menu_id' => $menu->getKey(), 'option_id' => $option->getKey(),
            'is_required' => $required, 'priority' => $option->priority, 'min_selected' => $min, 'max_selected' => $max, 'free_quantity' => 0])->save();
        foreach ($values as $priority => $value) {
            $itemValue = MenuItemOptionValue::query()->where('restaurant_id', $menu->restaurant_id)->where('menu_option_id', $itemOption->getKey())->where('option_value_id', $value->getKey())->first() ?? new MenuItemOptionValue;
            $itemValue->forceFill(['restaurant_id' => $menu->restaurant_id, 'menu_option_id' => $itemOption->getKey(), 'option_value_id' => $value->getKey(),
                'override_price' => $value->price, 'priority' => $priority + 1, 'is_default' => $required && $priority === 0, 'free_quantity' => 0])->save();
        }
    }

    private function option(int $restaurantId, string $name, string $displayType, int $priority): MenuOption
    {
        $option = MenuOption::query()->where('restaurant_id', $restaurantId)->where('option_name', $name)->first() ?? new MenuOption;
        $option->forceFill(['restaurant_id' => $restaurantId, 'option_name' => $name, 'display_type' => $displayType, 'priority' => $priority])->save();
        return $option;
    }

    private function optionValue(MenuOption $option, int $restaurantId, string $name, float $price, int $priority): MenuOptionValue
    {
        $value = MenuOptionValue::query()->where('restaurant_id', $restaurantId)->where('option_id', $option->getKey())->where('name', $name)->first() ?? new MenuOptionValue;
        $value->forceFill(['restaurant_id' => $restaurantId, 'option_id' => $option->getKey(), 'name' => $name, 'price' => $price, 'priority' => $priority])->save();
        return $value;
    }

    private function foodPhoto(int $index): string
    {
        $photos = ['1513104890138-7c749659a591', '1565299624946-b28f40a0ae38', '1547592180-85f173990554', '1568901346375-23c9450c58cd', '1550547660-d9450f859349', '1551782450-a2132b4ba21d', '1569718212165-3a8278d5f624', '1473093295043-cdd812d0e601'];
        return 'https://images.unsplash.com/photo-'.$photos[$index % count($photos)].'?auto=format&fit=crop&w=1400&q=80';
    }
}
