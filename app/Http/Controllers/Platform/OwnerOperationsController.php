<?php

namespace App\Http\Controllers\Platform;

use App\Jobs\SendTenantPush;
use App\Platform\Models\PlatformAuditLog;
use App\Platform\Models\RestaurantMembership;
use App\Platform\Models\RestaurantLocationSetting;
use App\Platform\Models\RestaurantSubscription;
use App\Platform\Models\SupportImpersonation;
use App\Platform\Support\RestaurantAccess;
use App\Platform\Tenancy\TenantContext;
use Igniter\Admin\Models\Status;
use Igniter\Cart\Models\Category;
use Igniter\Cart\Models\Menu;
use Igniter\Cart\Models\Order;
use Igniter\Local\Models\Location;
use Igniter\Reservation\Models\Reservation;
use Igniter\System\Models\Country;
use Igniter\User\Models\Customer;
use Igniter\User\Models\User;
use Igniter\User\Models\UserRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class OwnerOperationsController extends Controller
{
    public function __construct(private readonly TenantContext $tenant, private readonly RestaurantAccess $access) {}

    public function bootstrap(Request $request): JsonResponse
    {
        $this->authorizeOwner($request, 'dashboard.view');
        $restaurant = $this->tenant->get();
        $locations = $this->locationQuery()->orderBy('location_name')->get();
        $subscription = RestaurantSubscription::query()->with('plan')->where('restaurant_id', $this->tenant->id())->latest()->first();
        $checks = [
            ['key' => 'restaurant', 'label' => 'Restaurant profile', 'complete' => filled($restaurant->name) && filled($restaurant->timezone)],
            ['key' => 'location', 'label' => 'Active location', 'complete' => $locations->contains(fn(Location $location) => (bool)$location->location_status)],
            ['key' => 'menu', 'label' => 'Menu items', 'complete' => Menu::query()->where('restaurant_id', $this->tenant->id())->exists()],
            ['key' => 'branding', 'label' => 'Published branding', 'complete' => $restaurant->brandRevisions()->whereNotNull('published_at')->exists()],
            ['key' => 'domain', 'label' => 'Verified domain', 'complete' => $restaurant->domains()->whereNotNull('verified_at')->exists()],
        ];
        $support = null;
        $supportId = $request->user()->currentAccessToken()?->getAttribute('support_impersonation_id');
        if ($supportId) {
            $session = SupportImpersonation::query()->with('administrator')->where('restaurant_id', $this->tenant->id())
                ->whereKey($supportId)->whereNull('ended_at')->where('expires_at', '>', now())->first();
            if ($session) $support = ['id' => $session->public_id, 'administrator' => $session->administrator?->name,
                'reason' => $session->reason, 'expires_at' => $session->expires_at->toIso8601String()];
        }
        if (collect($checks)->every('complete') && !$restaurant->onboarding_completed_at) {
            $restaurant->forceFill(['onboarding_completed_at' => now()])->save();
        }

        return response()->json(['data' => [
            'locations' => $locations->map(fn(Location $location) => $this->locationData($location))->values(),
            'categories' => Category::query()->where('restaurant_id', $this->tenant->id())->orderBy('priority')->orderBy('name')->get()->map(fn(Category $category) => [
                'id' => (int)$category->getKey(), 'name' => $category->name, 'description' => $category->description,
                'is_active' => (bool)$category->status,
            ])->values(),
            'order_statuses' => Status::query()->isForOrder()->orderBy('status_id')->get()->map(fn(Status $status) => $this->statusData($status))->values(),
            'reservation_statuses' => Status::query()->isForReservation()->orderBy('status_id')->get()->map(fn(Status $status) => $this->statusData($status))->values(),
            'onboarding' => ['completed_at' => $restaurant->fresh()->onboarding_completed_at?->toIso8601String(), 'checks' => $checks],
            'subscription' => $this->subscriptionData($subscription),
            'support_impersonation' => $support,
        ]]);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $this->authorizeOwner($request, 'dashboard.view');
        $today = now()->toDateString();
        $orders = Order::query()->where('restaurant_id', $this->tenant->id());
        $reservations = Reservation::query()->where('restaurant_id', $this->tenant->id());

        return response()->json(['data' => [
            'sales_today' => (float)(clone $orders)->whereDate('order_date', $today)->where('processed', true)->sum('order_total'),
            'orders_today' => (int)(clone $orders)->whereDate('order_date', $today)->count(),
            'orders_waiting' => (int)(clone $orders)->where('processed', false)->count(),
            'reservations_today' => (int)(clone $reservations)->whereDate('reserve_date', $today)->count(),
            'customers' => (int)Customer::query()->where('restaurant_id', $this->tenant->id())->count(),
            'menu_items' => (int)Menu::query()->where('restaurant_id', $this->tenant->id())->count(),
            'active_locations' => (int)$this->locationQuery()->where('location_status', true)->count(),
        ]]);
    }

    public function orders(Request $request): JsonResponse
    {
        $this->authorizeOwner($request, 'orders.manage');
        $data = $request->validate([
            'search' => ['nullable', 'string', 'max:100'], 'location_id' => ['nullable', 'integer'], 'status_id' => ['nullable', 'integer'],
            'page' => ['nullable', 'integer', 'min:1'], 'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $query = Order::query()->with(['status', 'menus.menu_options', 'location', 'status_history.status', 'address'])->where('restaurant_id', $this->tenant->id())
            ->when($data['location_id'] ?? null, fn($q, $id) => $q->where('location_id', $id))
            ->when($data['status_id'] ?? null, fn($q, $id) => $q->where('status_id', $id))
            ->when($data['search'] ?? null, fn($q, $search) => $q->where(fn($match) => $match
                ->where('order_id', $search)->orWhere('customer_name', 'like', '%'.$search.'%')->orWhere('email', 'like', '%'.$search.'%')));
        $items = $query->latest('order_id')->paginate($data['limit'] ?? 25, ['*'], 'page', $data['page'] ?? 1);

        return $this->paginated($items, fn(Order $order) => $this->orderData($order));
    }

    public function updateOrderStatus(Request $request, int $orderId): JsonResponse
    {
        $this->authorizeOwner($request, 'orders.manage');
        $data = $request->validate(['status_id' => ['required', 'integer'], 'comment' => ['nullable', 'string', 'max:500'], 'notify' => ['nullable', 'boolean']]);
        $status = Status::query()->isForOrder()->findOrFail($data['status_id']);
        $order = Order::query()->where('restaurant_id', $this->tenant->id())->findOrFail($orderId);
        abort_if($order->updateOrderStatus($status->getKey(), [
            'staff_id' => $request->user()->getKey(), 'comment' => $data['comment'] ?? null,
            'notify' => $data['notify'] ?? (bool)$status->notify_customer,
        ]) === false, 409, 'The order status could not be updated.');
        $this->audit($request, 'order.status_updated', 'order', $orderId, ['status_id' => $status->getKey()]);
        SendTenantPush::dispatch($this->tenant->id(), 'customer', 'Order updated', 'Your order status is now '.$status->status_name.'.',
            ['type' => 'order', 'id' => (string) $order->getKey(), 'route' => '/account/orders/'.$order->getKey()], (int) $order->customer_id);

        return response()->json(['data' => $this->orderData($order->fresh(['status', 'menus', 'location']))]);
    }

    public function reservations(Request $request): JsonResponse
    {
        $this->authorizeOwner($request, 'reservations.manage');
        $data = $request->validate([
            'search' => ['nullable', 'string', 'max:100'], 'location_id' => ['nullable', 'integer'], 'status_id' => ['nullable', 'integer'],
            'from_date' => ['nullable', 'date_format:Y-m-d'], 'to_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from_date'],
            'page' => ['nullable', 'integer', 'min:1'], 'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $query = Reservation::query()->with(['status', 'location'])->where('restaurant_id', $this->tenant->id())
            ->when($data['location_id'] ?? null, fn($q, $id) => $q->where('location_id', $id))
            ->when($data['status_id'] ?? null, fn($q, $id) => $q->where('status_id', $id))
            ->when($data['from_date'] ?? null, fn($q, $date) => $q->whereDate('reserve_date', '>=', $date))
            ->when($data['to_date'] ?? null, fn($q, $date) => $q->whereDate('reserve_date', '<=', $date))
            ->when($data['search'] ?? null, fn($q, $search) => $q->where(fn($match) => $match
                ->where('customer_name', 'like', '%'.$search.'%')->orWhere('email', 'like', '%'.$search.'%')->orWhere('telephone', 'like', '%'.$search.'%')));
        $items = $query->orderByDesc('reserve_date')->orderByDesc('reserve_time')->paginate($data['limit'] ?? 25, ['*'], 'page', $data['page'] ?? 1);

        return $this->paginated($items, fn(Reservation $reservation) => $this->reservationData($reservation));
    }

    public function updateReservationStatus(Request $request, int $reservationId): JsonResponse
    {
        $this->authorizeOwner($request, 'reservations.manage');
        $data = $request->validate(['status_id' => ['required', 'integer'], 'comment' => ['nullable', 'string', 'max:500'], 'notify' => ['nullable', 'boolean']]);
        $status = Status::query()->isForReservation()->findOrFail($data['status_id']);
        $reservation = Reservation::query()->where('restaurant_id', $this->tenant->id())->findOrFail($reservationId);
        abort_if($reservation->addStatusHistory($status->getKey(), [
            'staff_id' => $request->user()->getKey(), 'comment' => $data['comment'] ?? null,
            'notify' => $data['notify'] ?? (bool)$status->notify_customer,
        ]) === false, 409, 'The reservation status could not be updated.');
        $this->audit($request, 'reservation.status_updated', 'reservation', $reservationId, ['status_id' => $status->getKey()]);
        SendTenantPush::dispatch($this->tenant->id(), 'customer', 'Reservation updated', 'Your reservation status is now '.$status->status_name.'.',
            ['type' => 'reservation', 'id' => (string) $reservation->getKey(), 'route' => '/account/reservations/'.$reservation->getKey()], (int) $reservation->customer_id);

        return response()->json(['data' => $this->reservationData($reservation->fresh(['status', 'location']))]);
    }

    public function menus(Request $request): JsonResponse
    {
        $this->authorizeOwner($request, 'catalog.manage');
        $data = $request->validate(['search' => ['nullable', 'string', 'max:100'], 'page' => ['nullable', 'integer', 'min:1'], 'limit' => ['nullable', 'integer', 'min:1', 'max:100']]);
        $items = Menu::query()->with('categories')->where('restaurant_id', $this->tenant->id())
            ->when($data['search'] ?? null, fn($q, $search) => $q->where('menu_name', 'like', '%'.$search.'%'))
            ->orderBy('menu_name')->paginate($data['limit'] ?? 25, ['*'], 'page', $data['page'] ?? 1);

        return $this->paginated($items, fn(Menu $menu) => $this->menuData($menu));
    }

    public function createMenu(Request $request): JsonResponse
    {
        $this->authorizeOwner($request, 'catalog.manage');
        $data = $this->validateMenu($request, true);
        $categoryIds = $data['category_ids'];
        $this->assertTenantCategories($categoryIds);
        $menu = DB::transaction(function () use ($data, $categoryIds): Menu {
            $menu = Menu::query()->create([
                'restaurant_id' => $this->tenant->id(), 'menu_name' => $data['name'],
                'menu_description' => $data['description'] ?? '', 'menu_price' => $data['price'],
                'menu_status' => $data['is_available'], 'minimum_qty' => 1,
                'menu_priority' => (int)Menu::query()->where('restaurant_id', $this->tenant->id())->max('menu_priority') + 1,
            ]);
            $menu->categories()->sync($categoryIds);
            return $menu->load('categories');
        });
        $this->audit($request, 'menu.created', 'menu', $menu->getKey(), ['name' => $menu->menu_name]);
        return response()->json(['data' => $this->menuData($menu)], 201);
    }

    public function updateMenu(Request $request, int $menuId): JsonResponse
    {
        $this->authorizeOwner($request, 'catalog.manage');
        $data = $this->validateMenu($request, false);
        $menu = Menu::query()->where('restaurant_id', $this->tenant->id())->findOrFail($menuId);
        if (array_key_exists('category_ids', $data)) {
            $this->assertTenantCategories($data['category_ids']);
            $menu->categories()->sync($data['category_ids']);
        }
        $menu->forceFill(array_filter([
            'menu_name' => $data['name'] ?? null, 'menu_description' => $data['description'] ?? null,
            'menu_price' => $data['price'] ?? null, 'menu_status' => $data['is_available'] ?? null,
        ], fn($value) => !is_null($value)))->save();
        $this->audit($request, 'menu.updated', 'menu', $menuId, ['fields' => array_keys($data)]);
        return response()->json(['data' => $this->menuData($menu->load('categories'))]);
    }

    public function createCategory(Request $request): JsonResponse
    {
        $this->authorizeOwner($request, 'catalog.manage');
        $data = $request->validate(['name' => ['required', 'string', 'max:128'], 'description' => ['nullable', 'string', 'max:1000'], 'is_active' => ['required', 'boolean']]);
        $category = Category::query()->create([
            'restaurant_id' => $this->tenant->id(), 'name' => $data['name'], 'description' => $data['description'] ?? '',
            'status' => $data['is_active'], 'priority' => (int)Category::query()->where('restaurant_id', $this->tenant->id())->max('priority') + 1,
        ]);
        $this->audit($request, 'category.created', 'category', $category->getKey(), ['name' => $category->name]);
        return response()->json(['data' => $this->categoryData($category)], 201);
    }

    public function updateCategory(Request $request, int $categoryId): JsonResponse
    {
        $this->authorizeOwner($request, 'catalog.manage');
        $data = $request->validate(['name' => ['required', 'string', 'max:128'], 'description' => ['nullable', 'string', 'max:1000'], 'is_active' => ['required', 'boolean']]);
        $category = Category::query()->where('restaurant_id', $this->tenant->id())->findOrFail($categoryId);
        $category->update(['name' => $data['name'], 'description' => $data['description'] ?? '', 'status' => $data['is_active']]);
        $this->audit($request, 'category.updated', 'category', $categoryId, ['name' => $category->name]);
        return response()->json(['data' => $this->categoryData($category)]);
    }

    public function customers(Request $request): JsonResponse
    {
        $this->authorizeOwner($request, 'customers.view');
        $data = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string'],
            'page' => ['nullable', 'integer', 'min:1'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100']
        ]);
        $items = Customer::query()->where('restaurant_id', $this->tenant->id())
            ->when($data['search'] ?? null, fn($q, $search) => $q->where(fn($match) => $match
                ->where('first_name', 'like', '%'.$search.'%')
                ->orWhere('last_name', 'like', '%'.$search.'%')
                ->orWhere('email', 'like', '%'.$search.'%')
                ->orWhere('telephone', 'like', '%'.$search.'%')))
            ->when(isset($data['status']) && $data['status'] !== '', fn($q) => $q->where('status', $data['status'] === '1' || $data['status'] === 'true' || $data['status'] === 'active'))
            ->latest('customer_id')->paginate($data['limit'] ?? 25, ['*'], 'page', $data['page'] ?? 1);

        $customerIds = $items->pluck('customer_id');
        $orderStats = Order::query()->where('restaurant_id', $this->tenant->id())
            ->whereIn('customer_id', $customerIds)
            ->selectRaw('customer_id, COUNT(*) as orders_count, SUM(order_total) as total_spent, MAX(created_at) as last_order_at')
            ->groupBy('customer_id')
            ->get()
            ->keyBy('customer_id');

        return $this->paginated($items, function (Customer $customer) use ($orderStats) {
            $stats = $orderStats->get($customer->getKey());
            return [
                'id' => (int)$customer->getKey(),
                'first_name' => $customer->first_name,
                'last_name' => $customer->last_name,
                'name' => trim($customer->first_name.' '.$customer->last_name) ?: 'Customer #'.$customer->getKey(),
                'email' => $customer->email,
                'telephone' => $customer->telephone,
                'status' => (bool)$customer->status,
                'orders_count' => (int)($stats->orders_count ?? 0),
                'total_spent' => (float)($stats->total_spent ?? 0.0),
                'last_order_at' => $stats?->last_order_at,
                'created_at' => $customer->created_at?->toIso8601String(),
            ];
        });
    }

    public function createCustomer(Request $request): JsonResponse
    {
        $this->authorizeOwner($request, 'customers.manage');
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:50'],
            'last_name' => ['required', 'string', 'max:50'],
            'email' => ['required', 'email:filter', 'max:100', Rule::unique('customers', 'email')->where('restaurant_id', $this->tenant->id())],
            'telephone' => ['nullable', 'string', 'max:50'],
            'password' => ['nullable', 'string', 'min:6'],
            'status' => ['nullable', 'boolean'],
        ]);

        $customer = new Customer();
        $customer->first_name = $data['first_name'];
        $customer->last_name = $data['last_name'];
        $customer->email = strtolower($data['email']);
        $customer->telephone = $data['telephone'] ?? null;
        $customer->status = $data['status'] ?? true;
        $customer->is_activated = true;
        $customer->restaurant_id = $this->tenant->id();
        if (!empty($data['password'])) {
            $customer->password = \Illuminate\Support\Facades\Hash::make($data['password']);
        }
        $customer->save();

        $this->audit($request, 'customer.created', 'customer', $customer->getKey(), ['email' => $customer->email]);

        return response()->json(['data' => [
            'id' => (int)$customer->getKey(),
            'first_name' => $customer->first_name,
            'last_name' => $customer->last_name,
            'name' => trim($customer->first_name.' '.$customer->last_name),
            'email' => $customer->email,
            'telephone' => $customer->telephone,
            'status' => (bool)$customer->status,
            'orders_count' => 0,
            'total_spent' => 0.0,
            'created_at' => $customer->created_at?->toIso8601String(),
        ]], 201);
    }

    public function showCustomer(Request $request, int $customerId): JsonResponse
    {
        $this->authorizeOwner($request, 'customers.view');
        $customer = Customer::query()->where('restaurant_id', $this->tenant->id())->findOrFail($customerId);

        $addresses = $customer->addresses()->with('country')->latest('address_id')->get()->map(fn($a) => [
            'id' => (int)$a->getKey(),
            'address_1' => $a->address_1,
            'address_2' => $a->address_2,
            'city' => $a->city,
            'state' => $a->state,
            'postcode' => $a->postcode,
            'country' => $a->country?->country_name ?? $a->country?->name,
            'formatted' => trim(implode(', ', array_filter([$a->address_1, $a->address_2, $a->city, $a->state, $a->postcode]))),
        ])->values();

        $recentOrders = Order::query()->with('status')->where('restaurant_id', $this->tenant->id())
            ->where('customer_id', $customerId)
            ->latest('order_id')
            ->limit(10)
            ->get()
            ->map(fn($o) => [
                'id' => (int)$o->getKey(),
                'number' => '#'.(int)$o->getKey(),
                'type' => $o->order_type_name ?? $o->order_type,
                'status_id' => (int)$o->status_id,
                'status_name' => $o->status_name ?? $o->status?->status_name ?? 'New',
                'status_color' => $o->status_color ?? $o->status?->status_color,
                'total' => (float)$o->order_total,
                'items_count' => (int)$o->total_items,
                'created_at' => $o->created_at?->toIso8601String(),
            ])->values();

        $recentReservations = Reservation::query()->with('status')->where('restaurant_id', $this->tenant->id())
            ->where('customer_id', $customerId)
            ->latest('reservation_id')
            ->limit(10)
            ->get()
            ->map(fn($r) => [
                'id' => (int)$r->getKey(),
                'date' => $r->reserve_date?->toDateString(),
                'time' => (string)$r->reserve_time,
                'guests' => (int)$r->guest_num,
                'status_name' => $r->status_name ?? $r->status?->status_name ?? 'New',
                'status_color' => $r->status_color ?? $r->status?->status_color,
                'created_at' => $r->created_at?->toIso8601String(),
            ])->values();

        $totalSpent = (float)Order::query()->where('restaurant_id', $this->tenant->id())
            ->where('customer_id', $customerId)->sum('order_total');
        $ordersCount = (int)Order::query()->where('restaurant_id', $this->tenant->id())
            ->where('customer_id', $customerId)->count();

        return response()->json(['data' => [
            'id' => (int)$customer->getKey(),
            'first_name' => $customer->first_name,
            'last_name' => $customer->last_name,
            'name' => trim($customer->first_name.' '.$customer->last_name),
            'email' => $customer->email,
            'telephone' => $customer->telephone,
            'status' => (bool)$customer->status,
            'orders_count' => $ordersCount,
            'total_spent' => $totalSpent,
            'addresses' => $addresses,
            'recent_orders' => $recentOrders,
            'recent_reservations' => $recentReservations,
            'created_at' => $customer->created_at?->toIso8601String(),
        ]]);
    }

    public function updateCustomer(Request $request, int $customerId): JsonResponse
    {
        $this->authorizeOwner($request, 'customers.manage');
        $customer = Customer::query()->where('restaurant_id', $this->tenant->id())->findOrFail($customerId);

        $data = $request->validate([
            'first_name' => ['sometimes', 'required', 'string', 'max:50'],
            'last_name' => ['sometimes', 'required', 'string', 'max:50'],
            'email' => ['sometimes', 'required', 'email:filter', 'max:100', Rule::unique('customers', 'email')->where('restaurant_id', $this->tenant->id())->ignore($customerId, 'customer_id')],
            'telephone' => ['nullable', 'string', 'max:50'],
            'password' => ['nullable', 'string', 'min:6'],
            'status' => ['nullable', 'boolean'],
        ]);

        if (isset($data['first_name'])) $customer->first_name = $data['first_name'];
        if (isset($data['last_name'])) $customer->last_name = $data['last_name'];
        if (isset($data['email'])) $customer->email = strtolower($data['email']);
        if (array_key_exists('telephone', $data)) $customer->telephone = $data['telephone'];
        if (isset($data['status'])) $customer->status = (bool)$data['status'];
        if (!empty($data['password'])) {
            $customer->password = \Illuminate\Support\Facades\Hash::make($data['password']);
        }
        $customer->save();

        $this->audit($request, 'customer.updated', 'customer', $customerId, ['email' => $customer->email]);

        return response()->json(['data' => [
            'id' => (int)$customer->getKey(),
            'first_name' => $customer->first_name,
            'last_name' => $customer->last_name,
            'name' => trim($customer->first_name.' '.$customer->last_name),
            'email' => $customer->email,
            'telephone' => $customer->telephone,
            'status' => (bool)$customer->status,
            'created_at' => $customer->created_at?->toIso8601String(),
        ]]);
    }

    public function deleteCustomer(Request $request, int $customerId): JsonResponse
    {
        $this->authorizeOwner($request, 'customers.manage');
        $customer = Customer::query()->where('restaurant_id', $this->tenant->id())->findOrFail($customerId);
        $email = $customer->email;
        $customer->delete();
        $this->audit($request, 'customer.deleted', 'customer', $customerId, ['email' => $email]);

        return response()->json([], 204);
    }

    public function locations(Request $request): JsonResponse
    {
        $this->authorizeOwner($request, 'locations.manage');
        return response()->json(['data' => $this->locationQuery()->orderByDesc('is_default')->orderBy('location_name')->get()
            ->map(fn(Location $location) => $this->locationData($location))->values()]);
    }

    public function createLocation(Request $request): JsonResponse
    {
        $this->authorizeOwner($request, 'locations.manage');
        $data = $this->validateLocation($request);
        $location = Location::query()->create([
            ...$data, 'restaurant_id' => $this->tenant->id(), 'location_country_id' => Country::getDefaultKey(),
            'permalink_slug' => $this->uniqueLocationSlug($data['location_name']), 'is_default' => false,
        ]);
        $request->user()->locations()->syncWithoutDetaching([$location->getKey()]);
        $this->audit($request, 'location.created', 'location', $location->getKey(), ['name' => $location->location_name]);

        return response()->json(['data' => $this->locationData($location)], 201);
    }

    public function updateLocation(Request $request, int $locationId): JsonResponse
    {
        $this->authorizeOwner($request, 'locations.manage');
        $location = $this->locationQuery()->findOrFail($locationId);
        $location->fill($this->validateLocation($request))->save();
        $this->audit($request, 'location.updated', 'location', $locationId, ['name' => $location->location_name]);

        return response()->json(['data' => $this->locationData($location)]);
    }

    public function setDefaultLocation(Request $request, int $locationId): JsonResponse
    {
        $this->authorizeOwner($request, 'locations.manage');
        $location = $this->locationQuery()->findOrFail($locationId);

        DB::transaction(function () use ($location): void {
            $this->locationQuery()->update(['is_default' => false]);
            $location->forceFill(['is_default' => true])->save();
        });

        $this->audit($request, 'location.set_default', 'location', $locationId, ['name' => $location->location_name]);

        return response()->json(['data' => $this->locationData($location->fresh())]);
    }

    public function deleteLocation(Request $request, int $locationId): JsonResponse
    {
        $this->authorizeOwner($request, 'locations.manage');
        $location = $this->locationQuery()->findOrFail($locationId);

        abort_if($location->is_default, 409, 'The default restaurant location cannot be deleted. Designate another default location first.');
        abort_if($this->locationQuery()->count() <= 1, 409, 'A restaurant must maintain at least one branch location.');

        $name = $location->location_name;
        $location->delete();
        $this->audit($request, 'location.deleted', 'location', $locationId, ['name' => $name]);

        return response()->json([], 204);
    }

    public function locationSettings(Request $request, int $locationId): JsonResponse
    {
        $this->authorizeOwner($request, 'locations.manage');
        $this->locationQuery()->findOrFail($locationId);
        $items = RestaurantLocationSetting::query()->where('restaurant_id', $this->tenant->id())
            ->where('location_id', $locationId)->orderBy('key')->get();

        return response()->json(['data' => $items->mapWithKeys(fn ($item) => [$item->key => $item->value])]);
    }

    public function updateLocationSettings(Request $request, int $locationId): JsonResponse
    {
        $this->authorizeOwner($request, 'locations.manage');
        $this->locationQuery()->findOrFail($locationId);
        $data = $request->validate([
            'orders_enabled' => ['sometimes', 'boolean'],
            'reservations_enabled' => ['sometimes', 'boolean'],
            'collection_enabled' => ['sometimes', 'boolean'],
            'delivery_enabled' => ['sometimes', 'boolean'],
            'delivery_charge' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'min_delivery_order' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'delivery_radius_km' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'prep_time_minutes' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'delivery_lead_time_minutes' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'default_order_status_id' => ['sometimes', 'integer', 'exists:statuses,status_id'],
            'default_reservation_status_id' => ['sometimes', 'integer', 'exists:statuses,status_id'],
        ]);
        foreach ($data as $key => $value) {
            RestaurantLocationSetting::query()->updateOrCreate(
                ['restaurant_id' => $this->tenant->id(), 'location_id' => $locationId, 'key' => $key],
                ['value' => $value],
            );
        }
        $this->audit($request, 'location.settings_updated', 'location', $locationId, ['fields' => array_keys($data)]);

        return $this->locationSettings($request, $locationId);
    }

    public function team(Request $request): JsonResponse
    {
        $this->authorizeOwner($request, 'team.manage');
        $members = RestaurantMembership::query()->with(['user', 'customRole'])->where('restaurant_id', $this->tenant->id())->orderBy('role')->get();
        return response()->json(['data' => $members->map(fn(RestaurantMembership $membership) => $this->memberData($membership))->values()]);
    }

    public function createTeamMember(Request $request): JsonResponse
    {
        $this->authorizeOwner($request, 'team.manage');
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'], 'email' => ['required', 'email:filter', 'max:96', Rule::unique('admin_users', 'email')],
            'password' => ['required', 'string', 'min:10', 'max:72'], 'role' => ['required', Rule::in(['manager', 'staff'])],
            'location_ids' => ['required', 'array', 'min:1'], 'location_ids.*' => ['integer'],
        ]);
        $this->assertTenantLocations($data['location_ids']);
        $membership = DB::transaction(function () use ($data): RestaurantMembership {
            $roleId = UserRole::query()->orderBy('user_role_id')->value('user_role_id');
            abort_if(!$roleId, 503, 'No staff role is configured.');
            $user = (new User)->register([
                'name' => $data['name'], 'email' => strtolower($data['email']),
                'username' => $this->uniqueUsername($data['email']), 'password' => $data['password'],
                'user_role_id' => $roleId, 'status' => true,
            ], true);
            $user->locations()->sync($data['location_ids']);
            return RestaurantMembership::query()->create([
                'restaurant_id' => $this->tenant->id(), 'user_id' => $user->getKey(), 'role' => $data['role'],
                'status' => 'active', 'location_ids' => array_values($data['location_ids']),
            ])->load(['user', 'customRole']);
        });
        $this->audit($request, 'team.member_created', 'membership', $membership->getKey(), ['role' => $membership->role]);

        return response()->json(['data' => $this->memberData($membership)], 201);
    }

    public function updateTeamMember(Request $request, int $membershipId): JsonResponse
    {
        $this->authorizeOwner($request, 'team.manage');
        $membership = RestaurantMembership::query()->with('user')->where('restaurant_id', $this->tenant->id())->findOrFail($membershipId);
        abort_if($membership->role === 'owner', 409, 'The owner membership cannot be changed here.');
        $data = $request->validate([
            'role' => ['required', Rule::in(['manager', 'staff'])], 'status' => ['required', Rule::in(['active', 'disabled'])],
            'location_ids' => ['required', 'array', 'min:1'], 'location_ids.*' => ['integer'],
        ]);
        $this->assertTenantLocations($data['location_ids']);
        $membership->update([...$data, 'location_ids' => array_values($data['location_ids'])]);
        $membership->user?->locations()->sync($data['location_ids']);
        if ($membership->user) {
            $membership->user->forceFill(['status' => $data['status'] === 'active'])->save();
        }
        $this->audit($request, 'team.member_updated', 'membership', $membershipId, ['role' => $data['role'], 'status' => $data['status']]);

        return response()->json(['data' => $this->memberData($membership->fresh(['user', 'customRole']))]);
    }

    public function destroySession(Request $request): Response
    {
        $request->user()?->currentAccessToken()?->delete();
        return response()->noContent();
    }

    private function authorizeOwner(Request $request, string $permission): void
    {
        $this->access->authorize($request, $permission);
    }

    private function locationQuery()
    {
        return Location::query()->where('restaurant_id', $this->tenant->id());
    }

    private function validateLocation(Request $request): array
    {
        return $request->validate([
            'location_name' => ['required', 'string', 'max:128'], 'location_email' => ['required', 'email:filter', 'max:96'],
            'location_telephone' => ['nullable', 'string', 'max:32'], 'location_address_1' => ['nullable', 'string', 'max:255'],
            'location_city' => ['nullable', 'string', 'max:128'], 'location_postcode' => ['nullable', 'string', 'max:32'],
            'location_status' => ['required', 'boolean'],
        ]);
    }

    private function assertTenantLocations(array $locationIds): void
    {
        abort_unless($this->locationQuery()->whereIn('location_id', $locationIds)->count() === count(array_unique($locationIds)), 422, 'One or more locations do not belong to this restaurant.');
    }

    private function assertTenantCategories(array $categoryIds): void
    {
        abort_unless(Category::query()->where('restaurant_id', $this->tenant->id())->whereIn('category_id', $categoryIds)->count() === count(array_unique($categoryIds)), 422, 'One or more categories do not belong to this restaurant.');
    }

    private function validateMenu(Request $request, bool $creating): array
    {
        $required = $creating ? 'required' : 'sometimes';
        return $request->validate([
            'name' => [$required, 'string', 'max:128'], 'description' => ['sometimes', 'nullable', 'string', 'max:4000'],
            'price' => [$required, 'numeric', 'min:0', 'max:999999.99'], 'is_available' => [$required, 'boolean'],
            'category_ids' => [$required, 'array', 'min:1'], 'category_ids.*' => ['integer'],
        ]);
    }

    private function uniqueLocationSlug(string $name): string
    {
        $base = Str::limit(Str::slug($name), 100, '') ?: 'location';
        $slug = $base;
        for ($suffix = 2; Location::query()->where('permalink_slug', $slug)->exists(); $suffix++) {
            $slug = Str::limit($base, 94, '').'-'.$suffix;
        }
        return $slug;
    }

    private function uniqueUsername(string $email): string
    {
        $base = Str::limit(Str::slug(Str::before($email, '@'), '_'), 24, '') ?: 'staff';
        $username = $base;
        for ($suffix = 2; User::query()->where('username', $username)->exists(); $suffix++) {
            $username = $base.'_'.$suffix;
        }
        return $username;
    }

    private function paginated($paginator, callable $mapper): JsonResponse
    {
        return response()->json(['data' => $paginator->getCollection()->map($mapper)->values(), 'meta' => [
            'page' => $paginator->currentPage(), 'limit' => $paginator->perPage(), 'total' => $paginator->total(), 'last_page' => $paginator->lastPage(),
        ]]);
    }

    private function statusData(Status $status): array
    {
        return ['id' => (int)$status->getKey(), 'name' => $status->status_name, 'color' => $status->status_color];
    }

    private function locationData(Location $location): array
    {
        $settings = RestaurantLocationSetting::query()->where('restaurant_id', $this->tenant->id())
            ->where('location_id', $location->getKey())->get()->mapWithKeys(fn ($item) => [$item->key => $item->value]);

        $ordersCount = Order::query()->where('restaurant_id', $this->tenant->id())->where('location_id', $location->getKey())->count();

        return [
            'id' => (int)$location->getKey(),
            'name' => $location->location_name,
            'email' => $location->location_email,
            'telephone' => $location->location_telephone,
            'address' => $location->location_address_1,
            'city' => $location->location_city,
            'postcode' => $location->location_postcode,
            'is_active' => (bool)$location->location_status,
            'is_default' => (bool)$location->is_default,
            'orders_count' => $ordersCount,
            'settings' => $settings,
        ];
    }

    private function orderData(Order $order): array
    {
        return [
            'id' => (int)$order->getKey(),
            'number' => '#'.(int)$order->getKey(),
            'customer_name' => $order->customer_name ?: trim($order->first_name.' '.$order->last_name),
            'customer_email' => $order->email,
            'customer_phone' => $order->telephone,
            'type' => $order->order_type_name ?? $order->order_type ?? 'Standard',
            'scheduled_for' => $order->order_datetime?->toIso8601String() ?? ($order->order_date ? $order->order_date.' '.$order->order_time : null),
            'status_id' => (int)$order->status_id,
            'status_name' => $order->status_name ?? $order->status?->status_name ?? 'New',
            'status_color' => $order->status_color ?? $order->status?->status_color ?? '#b84f2e',
            'total' => (float)$order->order_total,
            'items_count' => (int)$order->total_items,
            'items' => $order->menus->map(fn($item) => [
                'id' => (int)($item->menu_id ?? $item->getKey()),
                'name' => $item->name ?? $item->menu_name ?? 'Menu item',
                'quantity' => (int)($item->quantity ?? $item->qty ?? 1),
                'price' => (float)($item->price ?? 0),
                'subtotal' => (float)($item->subtotal ?? (($item->price ?? 0) * ($item->quantity ?? 1))),
                'comment' => $item->comment ?? null,
                'options' => method_exists($item, 'menu_options') || isset($item->menu_options) ? $item->menu_options?->map(fn($opt) => [
                    'name' => $opt->order_option_name ?? $opt->option_name ?? 'Option',
                    'quantity' => (int)($opt->quantity ?? 1),
                    'price' => (float)($opt->order_option_price ?? 0),
                ])->values() : [],
            ])->values(),
            'timeline' => $order->status_history?->sortBy('created_at')->map(fn($history) => [
                'status_id' => (int)$history->status_id,
                'status' => $history->status_name ?? $history->status?->status_name ?? 'Updated',
                'color' => $history->status?->status_color ?? '#746a62',
                'comment' => $history->comment,
                'created_at' => $history->created_at?->toIso8601String(),
            ])->values() ?? [],
            'location_name' => $order->location?->location_name,
            'payment_method' => $order->payment ?? 'cod',
            'delivery_address' => $order->address ? trim(implode(', ', array_filter([
                $order->address->address_1,
                $order->address->address_2,
                $order->address->city,
                $order->address->state,
                $order->address->postcode,
            ]))) : null,
            'comment' => $order->comment,
            'created_at' => $order->created_at?->toIso8601String(),
        ];
    }

    private function menuData(Menu $menu): array
    {
        return ['id' => (int)$menu->getKey(), 'name' => $menu->menu_name, 'description' => $menu->menu_description,
            'price' => (float)$menu->menu_price, 'is_available' => (bool)$menu->menu_status,
            'category_ids' => $menu->categories->pluck('category_id')->map(fn($id) => (int)$id)->values()];
    }

    private function categoryData(Category $category): array
    {
        return ['id' => (int)$category->getKey(), 'name' => $category->name, 'description' => $category->description, 'is_active' => (bool)$category->status];
    }

    private function reservationData(Reservation $reservation): array
    {
        return [
            'id' => (int)$reservation->getKey(), 'guest_name' => $reservation->customer_name, 'telephone' => $reservation->telephone,
            'guests' => (int)$reservation->guest_num, 'date' => $reservation->reserve_date?->toDateString(), 'time' => (string)$reservation->reserve_time,
            'status_id' => (int)$reservation->status_id, 'status_name' => $reservation->status_name ?? $reservation->status?->status_name ?? 'New',
            'location_name' => $reservation->location?->location_name, 'comment' => $reservation->comment,
        ];
    }

    private function memberData(RestaurantMembership $membership): array
    {
        return [
            'id' => (int)$membership->getKey(), 'name' => $membership->user?->name, 'email' => $membership->user?->email,
            'role' => $membership->role, 'custom_role' => $membership->customRole ? [
                'id' => $membership->customRole->getKey(), 'name' => $membership->customRole->name,
                'permissions' => $membership->customRole->permissions ?? [],
            ] : null,
            'status' => $membership->status, 'location_ids' => $membership->location_ids ?? [],
        ];
    }

    private function subscriptionData(?RestaurantSubscription $subscription): ?array
    {
        if (!$subscription) return null;
        return [
            'status' => $subscription->status, 'trial_ends_at' => $subscription->trial_ends_at?->toIso8601String(),
            'current_period_ends_at' => $subscription->current_period_ends_at?->toIso8601String(),
            'plan' => $subscription->plan ? [
                'id' => $subscription->plan->getKey(), 'code' => $subscription->plan->code, 'name' => $subscription->plan->name,
                'price_minor' => $subscription->plan->price_minor, 'currency_code' => $subscription->plan->currency_code,
                'features' => $subscription->plan->features ?? [],
            ] : null,
        ];
    }

    private function audit(Request $request, string $action, string $subjectType, int|string $subjectId, array $metadata): void
    {
        PlatformAuditLog::query()->create([
            'restaurant_id' => $this->tenant->id(), 'actor_type' => 'owner', 'actor_id' => $request->user()->getKey(),
            'action' => $action, 'subject_type' => $subjectType, 'subject_id' => (string)$subjectId,
            'metadata' => $metadata, 'ip_address' => $request->ip(),
        ]);
    }
}
