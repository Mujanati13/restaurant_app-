<?php

namespace Tests\Feature;

use App\Platform\Models\AppBuild;
use App\Platform\Models\PlatformMediaAsset;
use App\Platform\Models\Restaurant;
use App\Platform\Models\RestaurantDomain;
use App\Platform\Models\RestaurantMembership;
use Igniter\Admin\Models\Status;
use Igniter\Api\Models\Token;
use Igniter\Cart\Models\Category;
use Igniter\Cart\Models\Menu;
use Igniter\Cart\Models\MenuOption;
use Igniter\Cart\Models\Order;
use Igniter\Local\Models\Location;
use Igniter\Reservation\Models\Reservation;
use Igniter\User\Models\Customer;
use Igniter\User\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use DatabaseTransactions;

    private Restaurant $restaurantA;

    private Restaurant $restaurantB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ThrottleRequests::class);
        config()->set('vondo.allow_tenant_header', true);
        $this->restaurantA = Restaurant::query()->where('slug', 'default')->firstOrFail();
        $this->restaurantB = Restaurant::query()->create([
            'name' => 'Isolation Test Restaurant',
            'slug' => 'isolation-'.Str::lower(Str::random(10)),
            'status' => 'active',
            'timezone' => 'UTC',
            'currency_code' => 'USD',
        ]);
    }

    public function test_customer_registration_is_bound_to_resolved_restaurant(): void
    {
        $email = 'tenant-'.Str::lower(Str::random(12)).'@example.test';

        $this->withTenant($this->restaurantB)->postJson('/api/v1/storefront/register', [
            'first_name' => 'Tenant',
            'last_name' => 'Customer',
            'email' => $email,
            'telephone' => '+15550001111',
            'password' => 'Isolation!2026',
            'password_confirm' => 'Isolation!2026',
        ])->assertCreated();

        $this->assertDatabaseHas('customers', [
            'email' => $email,
            'restaurant_id' => $this->restaurantB->getKey(),
        ]);
    }

    public function test_customer_token_cannot_be_reused_for_another_restaurant(): void
    {
        $customer = $this->createCustomer($this->restaurantA);
        $token = $this->customerToken($customer, $this->restaurantA);

        $this->withTenant($this->restaurantB)->withToken($token)
            ->getJson('/api/v1/storefront/account')
            ->assertForbidden()
            ->assertJsonPath('message', 'This customer session belongs to another restaurant.');
    }

    public function test_same_email_authenticates_the_customer_for_the_resolved_restaurant(): void
    {
        $email = 'shared-'.Str::lower(Str::random(12)).'@example.test';
        $this->registerCustomer($this->restaurantA, $email, 'Restaurant A', 'TenantA!2026');
        $this->registerCustomer($this->restaurantB, $email, 'Restaurant B', 'TenantB!2026');

        $response = $this->withTenant($this->restaurantB)->postJson('/api/v1/storefront/token', [
            'email' => $email,
            'password' => 'TenantB!2026',
            'device_name' => 'tenant-isolation-test',
        ])->assertCreated();

        $this->withTenant($this->restaurantB)->withToken($response->json('token'))
            ->getJson('/api/v1/storefront/account')
            ->assertOk()
            ->assertJsonPath('data.first_name', 'Restaurant B');
    }

    public function test_refresh_tokens_rotate_and_cannot_cross_restaurants(): void
    {
        $emailA = 'refresh-a-'.Str::lower(Str::random(10)).'@example.test';
        $emailB = 'refresh-b-'.Str::lower(Str::random(10)).'@example.test';
        $this->registerCustomer($this->restaurantA, $emailA, 'Refresh A', 'RefreshA!2026');
        $this->registerCustomer($this->restaurantB, $emailB, 'Refresh B', 'RefreshB!2026');

        $loginA = $this->withTenant($this->restaurantA)->postJson('/api/v1/storefront/token', [
            'email' => $emailA, 'password' => 'RefreshA!2026', 'device_name' => 'refresh-test-a',
        ])->assertCreated()->assertJsonStructure(['token', 'refresh_token', 'expires_at']);
        $loginB = $this->withTenant($this->restaurantB)->postJson('/api/v1/storefront/token', [
            'email' => $emailB, 'password' => 'RefreshB!2026', 'device_name' => 'refresh-test-b',
        ])->assertCreated();

        $oldRefresh = $loginA->json('refresh_token');
        $this->withTenant($this->restaurantA)->postJson('/api/v1/storefront/refresh', [
            'refresh_token' => $oldRefresh,
        ])->assertCreated()->assertJsonStructure(['token', 'refresh_token', 'expires_at']);

        $this->withTenant($this->restaurantA)->postJson('/api/v1/storefront/refresh', [
            'refresh_token' => $oldRefresh,
        ])->assertUnprocessable();
        $this->withTenant($this->restaurantA)->postJson('/api/v1/storefront/refresh', [
            'refresh_token' => $loginB->json('refresh_token'),
        ])->assertUnprocessable();

        $tokenId = (int)Str::before($loginA->json('token'), '|');
        $this->assertNotNull(Token::query()->findOrFail($tokenId)->expires_at);
    }

    public function test_api_responses_include_a_correlation_id(): void
    {
        $requestId = 'test-request-'.Str::lower(Str::random(12));

        $this->withTenant($this->restaurantA)->withHeader('X-Request-ID', $requestId)
            ->getJson('/api/v1/storefront/bootstrap')
            ->assertOk()
            ->assertHeader('X-Request-ID', $requestId);

        $this->withTenant($this->restaurantA)
            ->postJson('/api/v1/storefront/token', [])
            ->assertUnprocessable()
            ->assertHeader('X-Request-ID');
    }

    public function test_storefront_catalog_and_checkout_reject_another_restaurants_menu(): void
    {
        $sourceMenu = Menu::query()->where('restaurant_id', $this->restaurantA->getKey())->firstOrFail();
        $foreignMenu = $sourceMenu->replicate();
        $foreignMenu->forceFill([
            'restaurant_id' => $this->restaurantB->getKey(),
            'menu_name' => 'Tenant B private menu '.Str::random(6),
            'menu_status' => true,
        ])->save();

        $this->withTenant($this->restaurantA)
            ->getJson('/api/v1/storefront/menus/'.$foreignMenu->getKey())
            ->assertNotFound();

        $customer = $this->createCustomer($this->restaurantA);
        $locationId = Location::query()->where('restaurant_id', $this->restaurantA->getKey())->value('location_id');
        $this->assertNotNull($locationId, 'The initial tenant must have a location for checkout isolation testing.');

        $this->withTenant($this->restaurantA)->withToken($this->customerToken($customer, $this->restaurantA))
            ->withHeader('Idempotency-Key', 'isolation-order-'.Str::random(16))
            ->postJson('/api/v1/storefront/orders', [
                'location_id' => $locationId,
                'order_type' => 'collection',
                'first_name' => 'Tenant',
                'last_name' => 'Customer',
                'telephone' => '+15550001111',
                'items' => [['menu_id' => $foreignMenu->getKey(), 'quantity' => 1]],
            ])->assertUnprocessable()
            ->assertJsonPath('message', 'One or more menu items are unavailable.');
    }

    public function test_complete_valid_storefront_order_reservation_and_vendor_read_flow(): void
    {
        \Illuminate\Support\Facades\Notification::fake();
        \Illuminate\Support\Facades\Queue::fake();
        $this->withTenant($this->restaurantA)->getJson('/api/v1/storefront/bootstrap')
            ->assertOk()->assertJsonPath('data.restaurant.id', $this->restaurantA->public_id);
        $sourceMenu = Menu::query()->where('restaurant_id', $this->restaurantA->getKey())->where('menu_status', true)->firstOrFail();
        $menu = $sourceMenu->replicate();
        $menu->forceFill([
            'restaurant_id' => $this->restaurantA->getKey(),
            'menu_name' => 'Option flow menu '.Str::random(6),
            'menu_status' => true,
        ])->save();
        $location = Location::query()->where('restaurant_id', $this->restaurantA->getKey())->firstOrFail();
        $option = new MenuOption;
        $option->forceFill([
            'restaurant_id' => $this->restaurantA->getKey(),
            'option_name' => 'Choose a side',
            'display_type' => 'radio',
        ])->save();
        $optionValue = $option->option_values()->make([
            'name' => 'Seasoned fries',
            'price' => 2.50,
            'priority' => 1,
        ]);
        $optionValue->forceFill(['restaurant_id' => $this->restaurantA->getKey()])->save();
        $itemOption = $menu->menu_options()->make([
            'option_id' => $option->getKey(), 'is_required' => true, 'priority' => 1,
            'min_selected' => 1, 'max_selected' => 1,
        ]);
        $itemOption->forceFill(['restaurant_id' => $this->restaurantA->getKey()])->save();
        $itemOptionValue = $itemOption->menu_option_values()->make([
            'option_value_id' => $optionValue->getKey(), 'override_price' => 2.50, 'priority' => 1,
        ]);
        $itemOptionValue->forceFill(['restaurant_id' => $this->restaurantA->getKey()])->save();
        $this->withTenant($this->restaurantA)->getJson('/api/v1/storefront/categories')->assertOk();
        $this->withTenant($this->restaurantA)->getJson('/api/v1/storefront/menus/'.$menu->getKey())
            ->assertOk()->assertJsonPath('data.id', $menu->getKey())
            ->assertJsonPath('data.options.0.id', $itemOption->getKey())
            ->assertJsonPath('data.options.0.values.0.id', $itemOptionValue->getKey());

        $email = 'flow-'.Str::lower(Str::random(10)).'@example.test';
        $password = 'ValidFlow!2026';
        $this->registerCustomer($this->restaurantA, $email, 'Valid', $password);
        $login = $this->withTenant($this->restaurantA)->postJson('/api/v1/storefront/token', [
            'email' => $email, 'password' => $password, 'device_name' => 'valid-flow-test',
        ])->assertCreated();
        $customerToken = $login->json('token');
        $this->withTenant($this->restaurantA)->withToken($customerToken)
            ->getJson('/api/v1/storefront/account')->assertOk()->assertJsonPath('data.email', $email);

        $this->withTenant($this->restaurantA)->withToken($customerToken)
            ->withHeader('Idempotency-Key', 'invalid-required-option-'.Str::lower(Str::random(12)))
            ->postJson('/api/v1/storefront/orders', [
                'location_id' => $location->getKey(), 'order_type' => 'collection',
                'first_name' => 'Valid', 'last_name' => 'Customer', 'telephone' => '+15550001111',
                'items' => [['menu_id' => $menu->getKey(), 'quantity' => 1]],
            ])->assertUnprocessable()->assertJsonPath('message', 'Choose a side is required.');

        $order = $this->withTenant($this->restaurantA)->withToken($customerToken)
            ->withHeader('Idempotency-Key', 'valid-order-'.Str::lower(Str::random(16)))
            ->postJson('/api/v1/storefront/orders', [
                'location_id' => $location->getKey(), 'order_type' => 'collection',
                'first_name' => 'Valid', 'last_name' => 'Customer', 'telephone' => '+15550001111',
                'items' => [[
                    'menu_id' => $menu->getKey(), 'quantity' => 2,
                    'options' => [[
                        'option_id' => $itemOption->getKey(),
                        'values' => [['value_id' => $itemOptionValue->getKey(), 'quantity' => 1]],
                    ]],
                ]],
            ])->assertCreated()->assertJsonPath('data.items_count', 2)
            ->assertJsonPath('data.items.0.options.0.name', 'Seasoned fries')
            ->assertJsonCount(1, 'data.timeline');
        $this->assertSame(round(((float) $menu->menu_price + 2.50) * 2, 2), round((float) $order->json('data.total'), 2));
        $this->assertDatabaseHas('order_menu_options', [
            'order_id' => $order->json('data.id'),
            'menu_option_value_id' => $itemOptionValue->getKey(),
            'restaurant_id' => $this->restaurantA->getKey(),
        ]);
        $this->withTenant($this->restaurantA)->withToken($customerToken)
            ->getJson('/api/v1/storefront/orders/'.$order->json('data.id'))
            ->assertOk()->assertJsonPath('data.id', $order->json('data.id'));

        $reservation = $this->withTenant($this->restaurantA)->withToken($customerToken)
            ->withHeader('Idempotency-Key', 'valid-reservation-'.Str::lower(Str::random(16)))
            ->postJson('/api/v1/storefront/reservations', [
                'location_id' => $location->getKey(), 'guest_num' => 2,
                'reserve_date' => now()->addDays(30)->toDateString(), 'reserve_time' => '14:00',
                'first_name' => 'Valid', 'last_name' => 'Customer', 'telephone' => '+15550001111',
            ])->assertCreated()->assertJsonPath('data.guests', 2);

        $owner = User::query()->where('email', 'owner@vondo.local')->firstOrFail();
        $owner->locations()->syncWithoutDetaching([$location->getKey()]);
        $vendorToken = $this->withTenant($this->restaurantA)->postJson('/api/v1/vendor/token', [
            'email' => 'owner@vondo.local', 'password' => 'RestaurantOwner!2026', 'device_name' => 'valid-vendor-flow',
        ])->assertCreated()->json('token');
        $this->app['auth']->forgetGuards();
        $this->withTenant($this->restaurantA)->withToken($vendorToken)
            ->getJson('/api/vendor/bootstrap')->assertOk();
        $this->withTenant($this->restaurantA)->withToken($vendorToken)
            ->getJson('/api/vendor/orders?location_id='.$location->getKey())->assertOk();
        $this->withTenant($this->restaurantA)->withToken($vendorToken)
            ->getJson('/api/vendor/reservations?location_id='.$location->getKey())->assertOk();
        $this->assertDatabaseHas('orders', ['order_id' => $order->json('data.id'), 'restaurant_id' => $this->restaurantA->getKey()]);
        $this->assertDatabaseHas('reservations', ['reservation_id' => $reservation->json('data.id'), 'restaurant_id' => $this->restaurantA->getKey()]);
    }

    public function test_versioned_api_contract_rejects_unauthenticated_invalid_and_boundary_inputs(): void
    {
        $this->withTenant($this->restaurantA)->getJson('/api/v1/storefront/account')->assertForbidden();
        $this->withTenant($this->restaurantA)->getJson('/api/v1/owner/dashboard')->assertForbidden();
        $this->getJson('/api/v1/platform/overview')->assertForbidden();

        $customer = $this->createCustomer($this->restaurantA);
        $customerToken = $this->customerToken($customer, $this->restaurantA);
        $this->withTenant($this->restaurantA)->withToken($customerToken)
            ->getJson('/api/v1/storefront/orders?limit=101')->assertUnprocessable()->assertJsonValidationErrors('limit');
        $this->withTenant($this->restaurantA)->withToken($customerToken)
            ->postJson('/api/v1/storefront/orders', [])->assertUnprocessable()
            ->assertJsonValidationErrors(['location_id', 'order_type', 'items']);
        $this->withTenant($this->restaurantA)->withToken($customerToken)
            ->postJson('/api/v1/storefront/reservations', ['guest_num' => 0])->assertUnprocessable()
            ->assertJsonValidationErrors(['location_id', 'guest_num', 'reserve_date', 'reserve_time']);

    }

    public function test_owner_token_is_bound_to_one_restaurant_even_with_multiple_memberships(): void
    {
        $owner = User::query()->where('email', 'owner@vondo.local')->firstOrFail();
        RestaurantMembership::query()->create([
            'restaurant_id' => $this->restaurantB->getKey(),
            'user_id' => $owner->getKey(),
            'role' => 'owner',
            'status' => 'active',
        ]);

        $token = $this->staffToken($owner, $this->restaurantA);

        $this->withTenant($this->restaurantA)->withToken($token)
            ->getJson('/api/v1/owner/restaurant')
            ->assertOk()
            ->assertJsonPath('data.id', $this->restaurantA->public_id);

        $this->withTenant($this->restaurantB)->withToken($token)
            ->getJson('/api/v1/owner/restaurant')
            ->assertUnauthorized()
            ->assertJsonPath('message', 'This staff session is not valid for this restaurant.');
    }

    public function test_owner_cannot_mutate_or_download_foreign_resources_by_identifier(): void
    {
        Storage::fake('local');
        $owner = User::query()->where('email', 'owner@vondo.local')->firstOrFail();
        $token = $this->staffToken($owner, $this->restaurantA);
        $domain = RestaurantDomain::query()->create([
            'restaurant_id' => $this->restaurantB->getKey(),
            'host' => Str::lower(Str::random(12)).'.example.test',
            'is_primary' => false,
        ]);
        $build = AppBuild::query()->create([
            'restaurant_id' => $this->restaurantB->getKey(),
            'platform' => 'android',
            'status' => 'queued',
            'configuration' => ['app_name' => 'Private Tenant App'],
        ]);
        $artifactPath = 'builds/'.$this->restaurantB->public_id.'/'.$build->public_id.'/private.aab';
        Storage::disk('local')->put($artifactPath, 'private tenant artifact');
        $artifact = $build->artifacts()->create([
            'restaurant_id' => $this->restaurantB->getKey(), 'kind' => 'aab', 'disk' => 'local',
            'path' => $artifactPath, 'size_bytes' => 23, 'sha256' => hash('sha256', 'private tenant artifact'),
            'expires_at' => now()->addDay(),
        ]);

        $this->withTenant($this->restaurantA)->withToken($token)
            ->deleteJson('/api/v1/owner/domains/'.$domain->getKey())
            ->assertNotFound();
        $this->withTenant($this->restaurantA)->withToken($token)
            ->postJson('/api/v1/owner/app-builds/'.$build->public_id.'/cancel')
            ->assertNotFound();
        $this->withTenant($this->restaurantA)->withToken($token)
            ->get('/api/v1/owner/app-builds/'.$build->public_id.'/artifacts/'.$artifact->getKey())
            ->assertNotFound();

        $this->assertDatabaseHas('restaurant_domains', ['id' => $domain->getKey(), 'restaurant_id' => $this->restaurantB->getKey()]);
        $this->assertDatabaseHas('app_builds', ['id' => $build->getKey(), 'restaurant_id' => $this->restaurantB->getKey(), 'status' => 'queued']);
    }

    public function test_owner_token_cannot_access_platform_administration(): void
    {
        $owner = User::query()->where('email', 'owner@vondo.local')->firstOrFail();

        $this->withToken($this->staffToken($owner, $this->restaurantA))
            ->getJson('/api/v1/platform/overview')
            ->assertForbidden();
    }

    public function test_owner_can_download_a_current_tenant_build_artifact(): void
    {
        Storage::fake('local');
        $owner = User::query()->where('email', 'owner@vondo.local')->firstOrFail();
        $build = AppBuild::query()->create([
            'restaurant_id' => $this->restaurantA->getKey(), 'platform' => 'android',
            'status' => 'succeeded', 'configuration' => ['app_name' => 'Download Test'],
        ]);
        $path = 'builds/'.$this->restaurantA->public_id.'/'.$build->public_id.'/release.aab';
        Storage::disk('local')->put($path, 'signed artifact');
        $artifact = $build->artifacts()->create([
            'restaurant_id' => $this->restaurantA->getKey(), 'kind' => 'aab', 'disk' => 'local',
            'path' => $path, 'size_bytes' => 15, 'sha256' => hash('sha256', 'signed artifact'),
            'expires_at' => now()->addDay(),
        ]);

        $this->withTenant($this->restaurantA)->withToken($this->staffToken($owner, $this->restaurantA))
            ->get('/api/v1/owner/app-builds/'.$build->public_id.'/artifacts/'.$artifact->getKey())
            ->assertOk()->assertDownload('vondo-android-'.$build->public_id.'.aab');
    }

    public function test_legacy_admin_routes_reject_restaurant_owners(): void
    {
        $owner = User::query()->where('email', 'owner@vondo.local')->firstOrFail();

        $this->actingAs($owner, (string)config('igniter-auth.guards.admin'))
            ->get('/admin/dashboard')
            ->assertForbidden()
            ->assertSee('/vondo-admin/', false);
    }

    public function test_legacy_admin_routes_remain_available_to_super_admin(): void
    {
        $admin = User::query()->where('email', 'admin@vondo.local')->firstOrFail();
        $this->assertTrue($admin->isSuperUser());

        $this->actingAs($admin, (string)config('igniter-auth.guards.admin'))
            ->get('/admin/dashboard')
            ->assertOk();
    }

    public function test_owner_cannot_update_foreign_operational_resources(): void
    {
        $owner = User::query()->where('email', 'owner@vondo.local')->firstOrFail();
        $token = $this->staffToken($owner, $this->restaurantA);
        $localCategory = Category::query()->where('restaurant_id', $this->restaurantA->getKey())->firstOrFail();
        $foreignLocation = $this->foreignLocation();
        $foreignCategory = Category::query()->where('restaurant_id', $this->restaurantA->getKey())->firstOrFail()->replicate();
        $foreignCategory->forceFill([
            'restaurant_id' => $this->restaurantB->getKey(),
            'name' => 'Tenant B category '.Str::random(8),
        ])->save();
        $foreignMenu = Menu::query()->where('restaurant_id', $this->restaurantA->getKey())->firstOrFail()->replicate();
        $foreignMenu->forceFill([
            'restaurant_id' => $this->restaurantB->getKey(),
            'menu_name' => 'Tenant B menu '.Str::random(8),
        ])->save();
        $foreignOrder = $this->foreignOrder($foreignLocation);
        $foreignReservation = $this->foreignReservation($foreignLocation);
        $foreignMember = RestaurantMembership::query()->create([
            'restaurant_id' => $this->restaurantB->getKey(),
            'user_id' => User::query()->where('email', 'admin@vondo.local')->value('user_id'),
            'role' => 'staff',
            'status' => 'active',
            'location_ids' => [$foreignLocation->getKey()],
        ]);
        $orderStatus = Status::query()->isForOrder()->firstOrFail();
        $reservationStatus = Status::query()->isForReservation()->firstOrFail();

        $requests = [
            fn() => $this->patchOwner($token, '/api/v1/owner/orders/'.$foreignOrder->getKey().'/status', ['status_id' => $orderStatus->getKey()]),
            fn() => $this->patchOwner($token, '/api/v1/owner/reservations/'.$foreignReservation->getKey().'/status', ['status_id' => $reservationStatus->getKey()]),
            fn() => $this->patchOwner($token, '/api/v1/owner/menus/'.$foreignMenu->getKey(), [
                'name' => 'Attempted overwrite', 'price' => 12, 'is_available' => false,
                'category_ids' => [$localCategory->getKey()],
            ]),
            fn() => $this->patchOwner($token, '/api/v1/owner/categories/'.$foreignCategory->getKey(), [
                'name' => 'Attempted overwrite', 'description' => '', 'is_active' => false,
            ]),
            fn() => $this->patchOwner($token, '/api/v1/owner/locations/'.$foreignLocation->getKey(), [
                'location_name' => 'Attempted overwrite', 'location_email' => 'blocked@example.test',
                'location_status' => false,
            ]),
            fn() => $this->patchOwner($token, '/api/v1/owner/team/'.$foreignMember->getKey(), [
                'role' => 'manager', 'status' => 'disabled',
                'location_ids' => [Location::query()->where('restaurant_id', $this->restaurantA->getKey())->value('location_id')],
            ]),
        ];

        foreach ($requests as $request) {
            $request()->assertNotFound();
        }

        $this->assertDatabaseHas('menus', ['menu_id' => $foreignMenu->getKey(), 'menu_name' => $foreignMenu->menu_name]);
        $this->assertDatabaseHas('categories', ['category_id' => $foreignCategory->getKey(), 'name' => $foreignCategory->name]);
        $this->assertDatabaseHas('locations', ['location_id' => $foreignLocation->getKey(), 'location_name' => $foreignLocation->location_name]);
        $this->assertDatabaseHas('restaurant_memberships', ['id' => $foreignMember->getKey(), 'status' => 'active']);
    }

    public function test_legacy_generic_api_and_ability_minting_endpoint_are_disabled(): void
    {
        $this->getJson('/api/menus')
            ->assertGone()
            ->assertJsonPath('message', 'This legacy API is disabled. Use the tenant-safe /api/v1 endpoints.');
        $this->postJson('/api/token', [
            'email' => 'owner@vondo.local',
            'password' => 'RestaurantOwner!2026',
            'device_name' => 'unsafe-legacy-client',
            'abilities' => ['*'],
        ])->assertGone();
        $this->get('/cart')->assertStatus(308)->assertHeader('Location', rtrim((string) config('vondo.storefront_url'), '/'));
        $this->post('/checkout')->assertGone();

        $this->withTenant($this->restaurantA)->getJson('/api/v1/storefront/bootstrap')
            ->assertOk()
            ->assertJsonPath('data.restaurant.id', $this->restaurantA->public_id);
    }

    public function test_vendor_cannot_select_foreign_location_or_update_foreign_menu(): void
    {
        $location = Location::query()->where('restaurant_id', $this->restaurantA->getKey())->firstOrFail();
        $foreignLocation = $location->replicate();
        $foreignLocation->forceFill([
            'restaurant_id' => $this->restaurantB->getKey(),
            'location_name' => 'Tenant B private location',
            'permalink_slug' => 'tenant-b-'.Str::lower(Str::random(10)),
            'is_default' => false,
        ])->save();
        $menu = Menu::query()->where('restaurant_id', $this->restaurantA->getKey())->firstOrFail();
        $foreignMenu = $menu->replicate();
        $foreignMenu->forceFill([
            'restaurant_id' => $this->restaurantB->getKey(),
            'menu_name' => 'Tenant B vendor-only menu '.Str::random(6),
            'menu_status' => true,
        ])->save();
        $admin = User::query()->where('email', 'admin@vondo.local')->firstOrFail();
        $token = $this->staffToken($admin, $this->restaurantA);

        $this->withTenant($this->restaurantA)->withToken($token)
            ->getJson('/api/v1/vendor/orders?location_id='.$foreignLocation->getKey())
            ->assertForbidden()
            ->assertJsonPath('message', 'You cannot access this restaurant location.');
        $this->withTenant($this->restaurantA)->withToken($token)
            ->patchJson('/api/v1/vendor/menus/'.$foreignMenu->getKey().'/availability', [
                'location_id' => $location->getKey(),
                'is_available' => false,
            ])->assertNotFound();

        $this->assertTrue((bool)$foreignMenu->fresh()->menu_status);
    }

    public function test_vendor_cannot_update_foreign_order_or_reservation_status(): void
    {
        $localLocation = Location::query()->where('restaurant_id', $this->restaurantA->getKey())->firstOrFail();
        $foreignLocation = $this->foreignLocation();
        $foreignOrder = $this->foreignOrder($foreignLocation);
        $foreignReservation = $this->foreignReservation($foreignLocation);
        $orderStatus = Status::query()->isForOrder()->firstOrFail();
        $reservationStatus = Status::query()->isForReservation()->firstOrFail();
        $admin = User::query()->where('email', 'admin@vondo.local')->firstOrFail();
        $token = $this->staffToken($admin, $this->restaurantA);

        $this->withTenant($this->restaurantA)->withToken($token)
            ->patchJson('/api/v1/vendor/orders/'.$foreignOrder->getKey().'/status', [
                'location_id' => $localLocation->getKey(),
                'status_id' => $orderStatus->getKey(),
            ])->assertNotFound();
        $this->withTenant($this->restaurantA)->withToken($token)
            ->patchJson('/api/v1/vendor/reservations/'.$foreignReservation->getKey().'/status', [
                'location_id' => $localLocation->getKey(),
                'status_id' => $reservationStatus->getKey(),
            ])->assertNotFound();

        $this->assertSame((int)$foreignOrder->status_id, (int)$foreignOrder->fresh()->status_id);
        $this->assertSame((int)$foreignReservation->status_id, (int)$foreignReservation->fresh()->status_id);
    }

    public function test_brand_upload_is_tenant_prefixed_and_rejects_non_images(): void
    {
        Storage::fake('vondo_media');
        config()->set('vondo.media_disk', 'vondo_media');
        $owner = User::query()->where('email', 'owner@vondo.local')->firstOrFail();
        $token = $this->staffToken($owner, $this->restaurantA);

        $response = $this->withTenant($this->restaurantA)->withToken($token)
            ->postJson('/api/v1/owner/media', [
                'image' => UploadedFile::fake()->image('brand.png', 120, 120),
            ])->assertCreated();

        $asset = PlatformMediaAsset::query()->where('public_id', $response->json('data.id'))->firstOrFail();
        $path = $asset->path;
        $this->assertStringStartsWith('restaurants/'.$this->restaurantA->public_id.'/branding/', $path);
        Storage::disk('vondo_media')->assertExists($path);
        $this->withTenant($this->restaurantA)
            ->get('/api/v1/storefront/media/'.$asset->public_id)
            ->assertOk()
            ->assertHeader('Content-Type', 'image/png');
        $this->withTenant($this->restaurantB)
            ->get('/api/v1/storefront/media/'.$asset->public_id)
            ->assertNotFound();

        $this->withTenant($this->restaurantA)->withToken($token)
            ->postJson('/api/v1/owner/media', [
                'image' => UploadedFile::fake()->create('payload.php', 2, 'application/x-php'),
            ])->assertUnprocessable();
    }

    public function test_owner_page_crud_and_storefront_delivery_are_tenant_isolated(): void
    {
        $owner = User::query()->where('email', 'owner@vondo.local')->firstOrFail();
        $token = $this->staffToken($owner, $this->restaurantA);
        $slug = 'about-'.Str::lower(Str::random(8));

        $created = $this->withTenant($this->restaurantA)->withToken($token)
            ->postJson('/api/v1/owner/pages', ['slug' => $slug, 'title' => 'About us', 'is_home' => false])
            ->assertCreated();
        $pageId = $created->json('data.id');

        $this->withTenant($this->restaurantA)->withToken($token)
            ->putJson('/api/v1/owner/pages/'.$pageId.'/sections', ['sections' => [[
                'id' => 'our-story', 'type' => 'custom_text', 'position' => 10,
                'visible' => true, 'content' => ['heading' => 'Our story', 'body' => 'Tenant-safe content'],
            ]]])->assertOk()->assertJsonPath('data.sections.0.id', 'our-story');

        $this->withTenant($this->restaurantA)->getJson('/api/v1/storefront/pages/'.$slug)
            ->assertOk()->assertJsonPath('data.sections.0.content.heading', 'Our story');
        $this->withTenant($this->restaurantB)->getJson('/api/v1/storefront/pages/'.$slug)->assertNotFound();
    }

    public function test_storefront_bootstrap_uses_restaurant_operational_settings(): void
    {
        $this->restaurantB->settings()->createMany([
            ['key' => 'orders_enabled', 'value' => false],
            ['key' => 'delivery_enabled', 'value' => false],
            ['key' => 'default_order_status_id', 'value' => 9876],
        ]);

        $this->withTenant($this->restaurantB)->getJson('/api/v1/storefront/bootstrap')
            ->assertOk()
            ->assertJsonPath('data.capabilities.orders', false)
            ->assertJsonPath('data.capabilities.delivery', false)
            ->assertJsonPath('data.defaults.order_status_id', 9876);

        $location = $this->foreignLocation();
        \App\Platform\Models\RestaurantLocationSetting::query()->create([
            'restaurant_id' => $this->restaurantB->getKey(), 'location_id' => $location->getKey(),
            'key' => 'orders_enabled', 'value' => true,
        ]);
        $this->withTenant($this->restaurantB)->getJson('/api/v1/storefront/bootstrap?location_id='.$location->getKey())
            ->assertOk()->assertJsonPath('data.capabilities.orders', true)
            ->assertJsonPath('data.capabilities.delivery', false);
        $foreignLocationId = Location::query()->where('restaurant_id', $this->restaurantA->getKey())->value('location_id');
        $this->withTenant($this->restaurantB)->getJson('/api/v1/storefront/bootstrap?location_id='.$foreignLocationId)
            ->assertNotFound();
    }

    public function test_storefront_analytics_events_are_namespaced_by_restaurant(): void
    {
        $sessionId = (string) Str::uuid();
        $payload = ['session_id' => $sessionId, 'event' => 'page_view', 'path' => '/menu', 'properties' => ['route' => '/menu']];

        $this->withTenant($this->restaurantA)->postJson('/api/v1/storefront/analytics/events', $payload)->assertAccepted();
        $this->withTenant($this->restaurantB)->postJson('/api/v1/storefront/analytics/events', $payload)->assertAccepted();

        $this->assertDatabaseHas('storefront_analytics_events', [
            'restaurant_id' => $this->restaurantA->getKey(), 'session_id' => $sessionId, 'event' => 'page_view',
        ]);
        $this->assertDatabaseHas('storefront_analytics_events', [
            'restaurant_id' => $this->restaurantB->getKey(), 'session_id' => $sessionId, 'event' => 'page_view',
        ]);
        $this->withTenant($this->restaurantA)->postJson('/api/v1/storefront/analytics/events', [
            ...$payload, 'event' => 'arbitrary_script_event',
        ])->assertUnprocessable();
    }

    private function withTenant(Restaurant $restaurant): static
    {
        return $this->withHeader((string)config('vondo.tenant_header'), $restaurant->public_id);
    }

    private function patchOwner(string $token, string $uri, array $data)
    {
        return $this->withTenant($this->restaurantA)->withToken($token)->patchJson($uri, $data);
    }

    private function foreignLocation(): Location
    {
        $location = Location::query()->where('restaurant_id', $this->restaurantA->getKey())->firstOrFail()->replicate();
        $location->forceFill([
            'restaurant_id' => $this->restaurantB->getKey(),
            'location_name' => 'Tenant B private location '.Str::random(6),
            'permalink_slug' => 'tenant-b-'.Str::lower(Str::random(10)),
            'is_default' => false,
        ])->save();

        return $location;
    }

    private function foreignOrder(Location $location): Order
    {
        $order = Order::query()->where('restaurant_id', $this->restaurantA->getKey())->firstOrFail()->replicate();
        $order->forceFill([
            'restaurant_id' => $this->restaurantB->getKey(),
            'location_id' => $location->getKey(),
            'hash' => md5(Str::uuid()->toString()),
        ])->save();

        return $order;
    }

    private function foreignReservation(Location $location): Reservation
    {
        $reservation = Reservation::query()->where('restaurant_id', $this->restaurantA->getKey())->firstOrFail()->replicate();
        // MySQL computes this stored/generated value from reserve_date/time.
        $reservation->offsetUnset('reserve_datetime');
        $reservation->forceFill([
            'restaurant_id' => $this->restaurantB->getKey(),
            'location_id' => $location->getKey(),
            'hash' => md5(Str::uuid()->toString()),
        ])->save();

        return $reservation;
    }

    private function createCustomer(Restaurant $restaurant): Customer
    {
        $email = 'customer-'.Str::lower(Str::random(12)).'@example.test';
        $this->registerCustomer($restaurant, $email, 'Tenant', 'Isolation!2026');

        return Customer::query()->where('restaurant_id', $restaurant->getKey())->where('email', $email)->firstOrFail();
    }

    private function registerCustomer(Restaurant $restaurant, string $email, string $firstName, string $password): void
    {
        $this->withTenant($restaurant)->postJson('/api/v1/storefront/register', [
            'first_name' => $firstName,
            'last_name' => 'Customer',
            'email' => $email,
            'telephone' => '+15550001111',
            'password' => $password,
            'password_confirm' => $password,
        ])->assertCreated();
    }

    private function customerToken(Customer $customer, Restaurant $restaurant): string
    {
        $token = Token::createToken($customer, 'tenant-isolation-test', ['storefront:*']);
        $token->accessToken->forceFill(['restaurant_id' => $restaurant->getKey()])->save();

        return $token->plainTextToken;
    }

    private function staffToken(User $user, Restaurant $restaurant): string
    {
        $token = Token::createToken($user, 'tenant-isolation-test', ['orders:*', 'reservations:*', 'menus:*']);
        $token->accessToken->forceFill(['restaurant_id' => $restaurant->getKey()])->save();

        return $token->plainTextToken;
    }
}
