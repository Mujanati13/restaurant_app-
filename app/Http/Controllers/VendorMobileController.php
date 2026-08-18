<?php

namespace App\Http\Controllers;

use App\Jobs\SendTenantPush;
use App\Platform\Branding\BrandConfiguration;
use App\Platform\Models\RestaurantMembership;
use App\Platform\Tenancy\TenantContext;
use Igniter\Admin\Models\Status;
use Igniter\Cart\Models\Menu;
use Igniter\Cart\Models\Order;
use Igniter\Local\Models\Location;
use Igniter\Reservation\Models\Reservation;
use Igniter\User\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Symfony\Component\HttpFoundation\Response;

/**
 * A deliberately small, mobile-oriented API for restaurant staff.
 *
 * It avoids exposing the generic administration endpoints directly to a phone
 * and applies the staff member's location boundary to every resource.
 */
class VendorMobileController extends Controller
{
    private const string ORDERS_ABILITY = 'orders:*';

    private const string RESERVATIONS_ABILITY = 'reservations:*';

    private const string MENUS_ABILITY = 'menus:*';

    public function __construct(private readonly TenantContext $tenant) {}

    public function bootstrap(Request $request): JsonResponse
    {
        $user = $this->staff($request);
        $locations = $this->locationsFor($user);
        $canManageOrders = $this->canManage($user, self::ORDERS_ABILITY, 'Admin.Orders');
        $canManageReservations = $this->canManage($user, self::RESERVATIONS_ABILITY, 'Admin.Reservations');
        $canManageMenus = $this->canManage($user, self::MENUS_ABILITY, 'Admin.Menus');

        return response()->json([
            'data' => [
                'restaurant' => [
                    'id' => $this->tenant->get()->public_id,
                    'name' => $this->tenant->get()->name,
                    'slug' => $this->tenant->get()->slug,
                    'brand' => BrandConfiguration::publicPayload(
                        $this->tenant->get()->publishedBrand()?->configuration
                            ?? BrandConfiguration::defaults($this->tenant->get()->name)
                    ),
                ],
                'staff' => [
                    'id' => (int)$user->getKey(),
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_super_user' => $user->isSuperUser(),
                ],
                'locations' => $locations->map(fn(Location $location) => $this->locationData($location))->values(),
                'capabilities' => [
                    'orders' => $canManageOrders,
                    'reservations' => $canManageReservations,
                    'menus' => $canManageMenus,
                ],
                'order_statuses' => Status::query()->isForOrder()->when(!$canManageOrders, fn($query) => $query->whereRaw('1 = 0'))->orderBy('status_id')->get()
                    ->map(fn(Status $status) => $this->statusData($status))->values(),
                'reservation_statuses' => Status::query()->isForReservation()->when(!$canManageReservations, fn($query) => $query->whereRaw('1 = 0'))->orderBy('status_id')->get()
                    ->map(fn(Status $status) => $this->statusData($status))->values(),
            ],
        ]);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $user = $this->staff($request);
        $locationId = $this->selectedLocationId($request);
        $today = now()->toDateString();
        $canManageOrders = $this->canManage($user, self::ORDERS_ABILITY, 'Admin.Orders');
        $canManageReservations = $this->canManage($user, self::RESERVATIONS_ABILITY, 'Admin.Reservations');

        $orders = Order::query()->where('restaurant_id', $this->tenant->id())
            ->where('location_id', $locationId)->whereDate('order_date', $today);
        $reservations = Reservation::query()->where('restaurant_id', $this->tenant->id())
            ->where('location_id', $locationId)->whereDate('reserve_date', $today);

        return response()->json([
            'data' => [
                'location_id' => $locationId,
                'today_sales' => $canManageOrders ? (float)(clone $orders)->where('processed', true)->sum('order_total') : 0.0,
                'orders_today' => $canManageOrders ? (int)(clone $orders)->count() : 0,
                'orders_waiting' => $canManageOrders ? (int)(clone $orders)->where('processed', false)->count() : 0,
                'reservations_today' => $canManageReservations ? (int)(clone $reservations)->count() : 0,
                'upcoming_reservations' => $canManageReservations ? (int)(clone $reservations)->where('reserve_time', '>=', now()->format('H:i:s'))->count() : 0,
            ],
        ]);
    }

    public function orders(Request $request): JsonResponse
    {
        $this->authorizeFeature($request, self::ORDERS_ABILITY, 'Admin.Orders');
        $validated = $request->validate([
            'location_id' => ['nullable', 'integer'],
            'status_id' => ['nullable', 'integer'],
            'page' => ['nullable', 'integer', 'min:1'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $locationId = $this->selectedLocationId($request, $validated['location_id'] ?? null);

        $query = Order::query()->with(['status', 'menus.menu_options', 'location', 'status_history.status', 'address'])
            ->where('restaurant_id', $this->tenant->id())->where('location_id', $locationId);
        if (!empty($validated['status_id'])) {
            $query->where('status_id', $validated['status_id']);
        }

        $limit = $validated['limit'] ?? 30;
        $orders = $query->orderByDesc('created_at')->paginate($limit, ['*'], 'page', $validated['page'] ?? 1);

        return response()->json([
            'data' => $orders->getCollection()->map(fn(Order $order) => $this->orderData($order))->values(),
            'meta' => [
                'page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'total' => $orders->total(),
                'limit' => $orders->perPage(),
            ],
        ]);
    }

    public function updateOrderStatus(Request $request, int $orderId): JsonResponse
    {
        $user = $this->authorizeFeature($request, self::ORDERS_ABILITY, 'Admin.Orders');
        $data = $request->validate([
            'location_id' => ['nullable', 'integer'],
            'status_id' => ['required', 'integer', 'exists:statuses,status_id'],
            'comment' => ['nullable', 'string', 'max:500'],
            'notify' => ['nullable', 'boolean'],
        ]);
        $locationId = $this->selectedLocationId($request, $data['location_id'] ?? null);
        $status = Status::query()->isForOrder()->findOrFail($data['status_id']);
        $order = Order::query()->where('restaurant_id', $this->tenant->id())
            ->where('location_id', $locationId)->findOrFail($orderId);

        $history = $order->updateOrderStatus($status->getKey(), [
            'staff_id' => $user->getKey(),
            'comment' => $data['comment'] ?? null,
            'notify' => $data['notify'] ?? (bool)$status->notify_customer,
        ]);
        abort_if($history === false, 409, 'The order status could not be updated.');
        SendTenantPush::dispatch($this->tenant->id(), 'customer', 'Order updated', 'Your order status is now '.$status->status_name.'.',
            ['type' => 'order', 'id' => (string) $order->getKey(), 'route' => '/account/orders/'.$order->getKey()], (int) $order->customer_id);

        return response()->json(['data' => $this->orderData($order->fresh(['status', 'menus']))]);
    }

    public function reservations(Request $request): JsonResponse
    {
        $this->authorizeFeature($request, self::RESERVATIONS_ABILITY, 'Admin.Reservations');
        $validated = $request->validate([
            'location_id' => ['nullable', 'integer'],
            'status_id' => ['nullable', 'integer'],
            'page' => ['nullable', 'integer', 'min:1'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
            'from_date' => ['nullable', 'date_format:Y-m-d'],
            'to_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from_date'],
        ]);
        $locationId = $this->selectedLocationId($request, $validated['location_id'] ?? null);

        $query = Reservation::query()->with('status')
            ->where('restaurant_id', $this->tenant->id())->where('location_id', $locationId);
        if (!empty($validated['status_id'])) {
            $query->where('status_id', $validated['status_id']);
        }
        $query->whereDate('reserve_date', '>=', $validated['from_date'] ?? now()->toDateString());
        if (!empty($validated['to_date'])) {
            $query->whereDate('reserve_date', '<=', $validated['to_date']);
        }

        $limit = $validated['limit'] ?? 30;
        $reservations = $query->orderBy('reserve_date')->orderBy('reserve_time')
            ->paginate($limit, ['*'], 'page', $validated['page'] ?? 1);

        return response()->json([
            'data' => $reservations->getCollection()->map(fn(Reservation $reservation) => $this->reservationData($reservation))->values(),
            'meta' => [
                'page' => $reservations->currentPage(),
                'last_page' => $reservations->lastPage(),
                'total' => $reservations->total(),
                'limit' => $reservations->perPage(),
            ],
        ]);
    }

    public function updateReservationStatus(Request $request, int $reservationId): JsonResponse
    {
        $user = $this->authorizeFeature($request, self::RESERVATIONS_ABILITY, 'Admin.Reservations');
        $data = $request->validate([
            'location_id' => ['nullable', 'integer'],
            'status_id' => ['required', 'integer', 'exists:statuses,status_id'],
            'comment' => ['nullable', 'string', 'max:500'],
            'notify' => ['nullable', 'boolean'],
        ]);
        $locationId = $this->selectedLocationId($request, $data['location_id'] ?? null);
        $status = Status::query()->isForReservation()->findOrFail($data['status_id']);
        $reservation = Reservation::query()->where('restaurant_id', $this->tenant->id())
            ->where('location_id', $locationId)->findOrFail($reservationId);

        $history = $reservation->addStatusHistory($status->getKey(), [
            'staff_id' => $user->getKey(),
            'comment' => $data['comment'] ?? null,
            'notify' => $data['notify'] ?? (bool)$status->notify_customer,
        ]);
        abort_if($history === false, 409, 'The reservation status could not be updated.');
        SendTenantPush::dispatch($this->tenant->id(), 'customer', 'Reservation updated', 'Your reservation status is now '.$status->status_name.'.',
            ['type' => 'reservation', 'id' => (string) $reservation->getKey(), 'route' => '/account/reservations/'.$reservation->getKey()], (int) $reservation->customer_id);

        return response()->json(['data' => $this->reservationData($reservation->fresh('status'))]);
    }

    public function menus(Request $request): JsonResponse
    {
        $this->authorizeFeature($request, self::MENUS_ABILITY, 'Admin.Menus');
        $validated = $request->validate(['location_id' => ['nullable', 'integer']]);
        $locationId = $this->selectedLocationId($request, $validated['location_id'] ?? null);
        $menus = Menu::query()->where('restaurant_id', $this->tenant->id())
            ->whereHasOrDoesntHaveLocation($locationId)->orderBy('menu_name')->get();

        return response()->json([
            'data' => $menus->map(fn(Menu $menu) => [
                'id' => (int)$menu->getKey(),
                'name' => $menu->menu_name,
                'description' => $menu->menu_description,
                'price' => (float)$menu->menu_price,
                'is_available' => (bool)$menu->menu_status,
                'availability_scope' => 'global',
            ])->values(),
        ]);
    }

    public function updateMenuAvailability(Request $request, int $menuId): JsonResponse
    {
        $this->authorizeFeature($request, self::MENUS_ABILITY, 'Admin.Menus');
        $data = $request->validate([
            'location_id' => ['nullable', 'integer'],
            'is_available' => ['required', 'boolean'],
        ]);
        $locationId = $this->selectedLocationId($request, $data['location_id'] ?? null);
        $menu = Menu::query()->where('restaurant_id', $this->tenant->id())
            ->whereHasOrDoesntHaveLocation($locationId)->findOrFail($menuId);
        $menu->menu_status = $data['is_available'];
        $menu->save();

        return response()->json(['data' => [
            'id' => (int)$menu->getKey(),
            'is_available' => (bool)$menu->menu_status,
            'availability_scope' => 'global',
        ]]);
    }

    public function destroySession(Request $request): Response
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->noContent();
    }

    private function staff(Request $request): User
    {
        $user = $request->user();
        abort_if(is_null($user), 401, 'Unauthenticated.');
        abort_unless($user instanceof User, 403, 'A staff account is required.');

        return $user;
    }

    private function locationsFor(User $user)
    {
        return $user->isSuperUser()
            ? Location::query()->where('locations.restaurant_id', $this->tenant->id())->where('location_status', true)->orderBy('location_name')->get()
            : $user->locations()->where('locations.restaurant_id', $this->tenant->id())->where('location_status', true)->orderBy('location_name')->get();
    }

    private function selectedLocationId(Request $request, ?int $requestedId = null): int
    {
        $locations = $this->locationsFor($this->staff($request));
        abort_if($locations->isEmpty(), 403, 'No active restaurant location is assigned to this staff account.');

        $requestLocationId = $request->integer('location_id');
        $locationId = $requestedId ?? ($requestLocationId ?: (int)$locations->first()->getKey());
        abort_unless($locations->contains(fn(Location $location) => (int)$location->getKey() === (int)$locationId), 403, 'You cannot access this restaurant location.');

        return (int)$locationId;
    }

    private function authorizeFeature(Request $request, string $ability, string $permission): User
    {
        $user = $this->staff($request);
        abort_unless($this->canManage($user, $ability, $permission), 403, 'You do not have permission to manage this resource.');

        return $user;
    }

    private function canManage(User $user, string $ability, string $permission): bool
    {
        if (!$user->tokenCan($ability)) return false;
        $membership = RestaurantMembership::query()->with('customRole')
            ->where('restaurant_id', $this->tenant->id())->where('user_id', $user->getKey())
            ->where('status', 'active')->first();
        if (!$membership) return $user->isSuperUser() && $user->hasPermission($permission);
        if ($membership->role === 'owner') return true;
        $platformPermission = match ($ability) {
            self::ORDERS_ABILITY => 'orders.manage',
            self::RESERVATIONS_ABILITY => 'reservations.manage',
            self::MENUS_ABILITY => 'catalog.manage',
            default => null,
        };
        if ($membership->customRole) return in_array($platformPermission, $membership->customRole->permissions ?? [], true);

        return $membership->role === 'manager' || $user->hasPermission($permission);
    }

    private function locationData(Location $location): array
    {
        return [
            'id' => (int)$location->getKey(),
            'name' => $location->location_name,
            'address' => trim(implode(', ', array_filter([$location->location_address_1, $location->location_city]))),
            'is_open' => (bool)$location->location_status,
        ];
    }

    private function statusData(Status $status): array
    {
        return [
            'id' => (int)$status->getKey(),
            'name' => $status->status_name,
            'color' => $status->status_color,
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

    private function reservationData(Reservation $reservation): array
    {
        return [
            'id' => (int)$reservation->getKey(),
            'guest_name' => $reservation->customer_name,
            'telephone' => $reservation->telephone,
            'guests' => (int)$reservation->guest_num,
            'date' => $reservation->reserve_date?->toDateString(),
            'time' => (string)$reservation->reserve_time,
            'status_id' => (int)$reservation->status_id,
            'status_name' => $reservation->status_name ?? $reservation->status?->status_name ?? 'New',
            'status_color' => $reservation->status_color ?? $reservation->status?->status_color,
            'comment' => $reservation->comment,
        ];
    }
}
