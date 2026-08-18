<?php

namespace App\Http\Controllers\Platform;

use App\Jobs\SendTenantPush;
use App\Platform\Support\IdempotentRequest;
use App\Platform\Support\TenantSettings;
use App\Platform\Tenancy\TenantContext;
use Igniter\Cart\CartItem;
use Igniter\Cart\Models\Menu;
use Igniter\Cart\Models\Order;
use Igniter\Local\Models\Location;
use Igniter\Reservation\Models\DiningTable;
use Igniter\Reservation\Models\Reservation;
use Igniter\System\Models\Country;
use Igniter\User\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class StorefrontCommerceController extends Controller
{
    public function __construct(
        private readonly TenantContext $tenant,
        private readonly IdempotentRequest $idempotency,
        private readonly TenantSettings $settings,
    ) {}

    public function orders(Request $request): JsonResponse
    {
        $customer = $this->customer($request);
        $data = $request->validate(['page' => ['nullable', 'integer', 'min:1'], 'limit' => ['nullable', 'integer', 'min:1', 'max:100']]);
        $orders = Order::query()->with(['status', 'location', 'menus.menu_options', 'status_history.status'])
            ->where('restaurant_id', $this->tenant->id())->where('customer_id', $customer->getKey())
            ->latest('created_at')->paginate($data['limit'] ?? 20, ['*'], 'page', $data['page'] ?? 1);
        return response()->json(['data' => $orders->getCollection()->map(fn(Order $order) => $this->orderData($order))->values(),
            'meta' => ['page' => $orders->currentPage(), 'limit' => $orders->perPage(), 'total' => $orders->total(), 'last_page' => $orders->lastPage()]]);
    }

    public function account(Request $request): JsonResponse
    {
        $customer = $this->customer($request);

        return response()->json(['data' => $this->accountData($customer)]);
    }

    public function updateAccount(Request $request): JsonResponse
    {
        $customer = $this->customer($request);
        $data = $request->validate([
            'first_name' => ['required', 'string', 'between:1,48'],
            'last_name' => ['required', 'string', 'between:1,48'],
            'email' => ['required', 'email:filter', 'max:96', Rule::unique('customers', 'email')
                ->where('restaurant_id', $this->tenant->id())->ignore($customer->getKey(), 'customer_id')],
            'telephone' => ['required', 'string', 'max:64'],
        ]);
        $customer->fill($data)->save();

        return response()->json(['data' => $this->accountData($customer->fresh())]);
    }

    public function addresses(Request $request): JsonResponse
    {
        $addresses = $this->customer($request)->addresses()->with('country')->latest('address_id')->get();

        return response()->json(['data' => $addresses->map(fn($address) => [
            'id' => (int)$address->getKey(), 'address_1' => $address->address_1, 'address_2' => $address->address_2,
            'city' => $address->city, 'state' => $address->state, 'postcode' => $address->postcode,
            'country' => $address->country?->country_name ?? $address->country?->name,
        ])->values()]);
    }

    public function createAddress(Request $request): JsonResponse
    {
        $data = $request->validate([
            'address_1' => ['required', 'string', 'between:3,128'], 'address_2' => ['nullable', 'string', 'max:128'],
            'city' => ['required', 'string', 'between:2,128'], 'state' => ['nullable', 'string', 'max:128'],
            'postcode' => ['nullable', 'string', 'max:128'], 'country_id' => ['nullable', 'integer', 'exists:countries,country_id'],
        ]);
        $data['country_id'] ??= $this->settings->integer('default_country_id', (int) Country::getDefaultKey());
        abort_unless($data['country_id'], 503, 'No default country is configured.');
        $address = $this->customer($request)->addresses()->create([...$data, 'restaurant_id' => $this->tenant->id()]);

        return response()->json(['data' => ['id' => (int)$address->getKey()]], 201);
    }

    public function order(Request $request, int $orderId): JsonResponse
    {
        $order = Order::query()->with(['status', 'location', 'menus.menu_options', 'totals', 'status_history.status'])
            ->where('restaurant_id', $this->tenant->id())
            ->where('customer_id', $this->customer($request)->getKey())->findOrFail($orderId);
        return response()->json(['data' => $this->orderData($order)]);
    }

    public function createOrder(Request $request): JsonResponse
    {
        $customer = $this->customer($request);
        $data = $request->validate([
            'location_id' => ['required', 'integer', Rule::exists('locations', 'location_id')->where('restaurant_id', $this->tenant->id())],
            'order_type' => ['required', Rule::in(['delivery', 'collection'])],
            'first_name' => ['required', 'string', 'between:1,48'], 'last_name' => ['required', 'string', 'between:1,48'],
            'telephone' => ['required', 'string', 'max:64'], 'comment' => ['nullable', 'string', 'max:500'],
            'payment_method' => ['nullable', 'string', 'in:cod,card_on_delivery,stripe,paypal,bank_transfer'],
            'items' => ['required', 'array', 'between:1,100'], 'items.*.menu_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'between:1,50'], 'items.*.comment' => ['nullable', 'string', 'max:300'],
            'items.*.options' => ['nullable', 'array', 'max:50'],
            'items.*.options.*.option_id' => ['required', 'integer'],
            'items.*.options.*.values' => ['required', 'array', 'max:50'],
            'items.*.options.*.values.*.value_id' => ['required', 'integer'],
            'items.*.options.*.values.*.quantity' => ['nullable', 'integer', 'between:1,50'],
            'address' => ['required_if:order_type,delivery', 'array'], 'address.address_1' => ['required_if:order_type,delivery', 'string', 'max:128'],
            'address.address_2' => ['nullable', 'string', 'max:128'], 'address.city' => ['required_if:order_type,delivery', 'string', 'max:128'],
            'address.state' => ['nullable', 'string', 'max:128'], 'address.postcode' => ['required_if:order_type,delivery', 'string', 'max:20'],
            'address.country_id' => ['required_if:order_type,delivery', 'integer', 'exists:countries,country_id'],
        ]);
        abort_unless($this->settings->boolean('orders_enabled', true, (int) $data['location_id']), 403, 'Online ordering is not enabled for this location.');
        abort_unless(
            $this->settings->boolean($data['order_type'].'_enabled', true, (int) $data['location_id']),
            422,
            ucfirst($data['order_type']).' ordering is not enabled for this restaurant.',
        );

        return $this->idempotency->run($request, 'storefront.order.create', function () use ($request, $customer, $data): array {
            $location = Location::query()->where('restaurant_id', $this->tenant->id())->findOrFail($data['location_id']);
            $menuIds = collect($data['items'])->pluck('menu_id')->unique()->values();
            $menus = Menu::query()->with(['menu_options.menu_option_values.option_value'])
                ->where('restaurant_id', $this->tenant->id())
                ->where('menu_status', true)->whereIn('menu_id', $menuIds)->get()->keyBy('menu_id');
            abort_unless($menus->count() === $menuIds->count(), 422, 'One or more menu items are unavailable.');

            $order = new Order;
            $order->fill([
                'customer_id' => $customer->getKey(), 'restaurant_id' => $this->tenant->id(), 'location_id' => $location->getKey(),
                'first_name' => $data['first_name'], 'last_name' => $data['last_name'], 'email' => $customer->email,
                'telephone' => $data['telephone'], 'order_type' => $data['order_type'], 'comment' => $data['comment'] ?? null,
                'payment' => $data['payment_method'] ?? 'cod', 'status_id' => $this->settings->integer('default_order_status_id', (int) setting('default_order_status'), (int) $data['location_id']),
                'order_date' => now()->toDateString(), 'order_time' => now()->format('H:i'), 'order_time_is_asap' => true,
            ]);
            if ($data['order_type'] === 'delivery') {
                $address = $customer->addresses()->create([...$data['address'], 'restaurant_id' => $this->tenant->id()]);
                $order->address_id = $address->getKey();
            }
            $order->forceFill(['ip_address' => $request->ip(), 'user_agent' => (string)$request->userAgent()])->save();

            $items = collect($data['items'])->map(function (array $item) use ($menus): CartItem {
                $menu = $menus->get($item['menu_id']);
                $quantity = (int)$item['quantity'];
                $options = $this->prepareMenuOptions($menu, $item['options'] ?? []);
                $cartItem = new CartItem(
                    $menu->getKey(),
                    $menu->menu_name,
                    (float)$menu->menu_price,
                    $options,
                    $item['comment'] ?? '',
                );
                $cartItem->setQuantity($quantity);

                return $cartItem;
            })->all();
            $order->addOrderMenus($items);
            \Illuminate\Support\Facades\DB::table('order_menus')->where('order_id', $order->getKey())
                ->update(['restaurant_id' => $this->tenant->id()]);
            \Illuminate\Support\Facades\DB::table('order_menu_options')->where('order_id', $order->getKey())
                ->update(['restaurant_id' => $this->tenant->id()]);
            $subtotal = collect($items)->sum(fn(CartItem $item) => $item->subtotal());
            $order->forceFill(['total_items' => collect($items)->sum('qty'), 'order_total' => $subtotal])->saveQuietly();
            $order->updateOrderStatus($order->status_id, ['notify' => true]);
            SendTenantPush::dispatch($this->tenant->id(), 'vendor', 'New order', 'A new order is ready for review.',
                ['type' => 'order', 'id' => (string) $order->getKey(), 'route' => '/orders/'.$order->getKey()]);

            return [['data' => $this->orderData($order->fresh(['status', 'location', 'menus.menu_options', 'status_history.status']))], 201];
        });
    }

    public function reservations(Request $request): JsonResponse
    {
        $customer = $this->customer($request);
        $data = $request->validate(['page' => ['nullable', 'integer', 'min:1'], 'limit' => ['nullable', 'integer', 'min:1', 'max:100']]);
        $items = Reservation::query()->with(['status', 'location', 'tables'])
            ->where('restaurant_id', $this->tenant->id())->where('customer_id', $customer->getKey())
            ->orderByDesc('reserve_date')->orderByDesc('reserve_time')->paginate($data['limit'] ?? 20, ['*'], 'page', $data['page'] ?? 1);
        return response()->json(['data' => $items->getCollection()->map(fn(Reservation $item) => $this->reservationData($item))->values(),
            'meta' => ['page' => $items->currentPage(), 'limit' => $items->perPage(), 'total' => $items->total(), 'last_page' => $items->lastPage()]]);
    }

    public function createReservation(Request $request): JsonResponse
    {
        $customer = $this->customer($request);
        $data = $request->validate([
            'location_id' => ['required', 'integer', Rule::exists('locations', 'location_id')->where('restaurant_id', $this->tenant->id())],
            'table_id' => ['nullable', 'integer'], 'guest_num' => ['required', 'integer', 'between:1,100'],
            'reserve_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'], 'reserve_time' => ['required', 'date_format:H:i'],
            'duration' => ['nullable', 'integer', 'between:15,480'], 'first_name' => ['required', 'string', 'between:1,48'],
            'last_name' => ['required', 'string', 'between:1,48'], 'telephone' => ['required', 'string', 'max:64'],
            'comment' => ['nullable', 'string', 'max:520'],
        ]);
        abort_unless($this->settings->boolean('reservations_enabled', true, (int) $data['location_id']), 403, 'Reservations are not enabled for this location.');

        return $this->idempotency->run($request, 'storefront.reservation.create', function () use ($request, $customer, $data): array {
            $dateTime = Carbon::createFromFormat('Y-m-d H:i', $data['reserve_date'].' '.$data['reserve_time']);
            $tableQuery = DiningTable::query()->reservable(['locationId' => $data['location_id'], 'dateTime' => $dateTime,
                'guestNum' => $data['guest_num'], 'duration' => $data['duration'] ?? 90]);
            $table = isset($data['table_id']) ? $tableQuery->find($data['table_id']) : $tableQuery->orderBy('dining_tables.priority')->first();
            abort_if(!$table, 409, 'The selected table is no longer available.');

            $reservation = Reservation::query()->create([
                'restaurant_id' => $this->tenant->id(), 'customer_id' => $customer->getKey(), 'location_id' => $data['location_id'],
                'table_id' => $table->getKey(), 'guest_num' => $data['guest_num'], 'reserve_date' => $data['reserve_date'],
                'reserve_time' => $data['reserve_time'], 'duration' => $data['duration'] ?? 90, 'first_name' => $data['first_name'],
                'last_name' => $data['last_name'], 'email' => $customer->email, 'telephone' => $data['telephone'],
                'comment' => $data['comment'] ?? null,
                'status_id' => $this->settings->integer('default_reservation_status_id', (int) setting('default_reservation_status'), (int) $data['location_id']),
                'ip_address' => $request->ip(), 'user_agent' => (string)$request->userAgent(),
            ]);
            $reservation->tables()->sync([$table->getKey() => ['restaurant_id' => $this->tenant->id()]]);
            $reservation->addStatusHistory($reservation->status_id, ['notify' => true]);
            SendTenantPush::dispatch($this->tenant->id(), 'vendor', 'New reservation', 'A new reservation is ready for review.',
                ['type' => 'reservation', 'id' => (string) $reservation->getKey(), 'route' => '/reservations/'.$reservation->getKey()]);
            return [['data' => $this->reservationData($reservation->fresh(['status', 'location', 'tables']))], 201];
        });
    }

    private function customer(Request $request): Customer
    {
        /** @var Customer $customer */
        $customer = $request->user();
        return $customer;
    }

    private function orderData(Order $order): array
    {
        return ['id' => (int)$order->getKey(), 'number' => '#'.$order->getKey(), 'type' => $order->order_type,
            'status' => ['id' => (int)$order->status_id, 'name' => $order->status_name ?? 'Received', 'color' => $order->status_color],
            'total' => (float)$order->order_total, 'items_count' => (int)$order->total_items,
            'items' => $order->menus->map(fn($item) => [
                'name' => $item->name,
                'quantity' => (int)$item->quantity,
                'price' => (float)$item->price,
                'options' => $item->menu_options->map(fn($value) => [
                    'name' => $value->order_option_name ?? 'Option',
                    'quantity' => (int)$value->quantity,
                ])->values(),
            ])->values(),
            'timeline' => $order->status_history->sortBy('created_at')->map(fn($history) => [
                'status' => $history->status_name ?? $history->status?->status_name ?? 'Updated',
                'comment' => $history->comment,
                'created_at' => $history->created_at?->toIso8601String(),
            ])->values(),
            'location' => $order->location?->location_name, 'created_at' => $order->created_at?->toIso8601String()];
    }

    private function prepareMenuOptions(Menu $menu, array $requested): array
    {
        $requestedItems = collect($requested);
        abort_unless($requestedItems->pluck('option_id')->unique()->count() === $requestedItems->count(), 422, 'A menu option group was supplied more than once.');
        $requested = $requestedItems->keyBy('option_id');

        $available = $menu->menu_options->keyBy('menu_option_id');
        abort_unless($requested->keys()->diff($available->keys())->isEmpty(), 422, 'One or more menu options are unavailable.');

        return $available->sortBy('priority')->map(function ($option) use ($requested): ?array {
            $selected = collect(data_get($requested->get($option->getKey()), 'values', []));
            abort_unless($selected->pluck('value_id')->unique()->count() === $selected->count(), 422, 'A menu option value was supplied more than once.');

            $selectedCount = $option->display_type === 'quantity'
                ? $selected->sum(fn($value) => (int)($value['quantity'] ?? 1))
                : $selected->count();
            abort_unless(!$option->is_required || $selectedCount > 0, 422, $option->option_name.' is required.');
            abort_unless(!$option->min_selected || $selectedCount >= $option->min_selected, 422, $option->option_name.' requires at least '.$option->min_selected.' selection(s).');
            abort_unless(!$option->max_selected || $selectedCount <= $option->max_selected, 422, $option->option_name.' allows at most '.$option->max_selected.' selection(s).');

            $values = $option->menu_option_values->keyBy('menu_option_value_id');
            abort_unless($selected->pluck('value_id')->diff($values->keys())->isEmpty(), 422, 'One or more values for '.$option->option_name.' are unavailable.');
            $remainingFree = $option->free_quantity > 0 ? (int)$option->free_quantity : PHP_INT_MAX;
            $prepared = $selected->map(function (array $selection) use ($values, &$remainingFree): array {
                $value = $values->get($selection['value_id']);
                $quantity = (int)($selection['quantity'] ?? 1);
                $free = min($quantity, (int)$value->free_quantity, $remainingFree);
                $remainingFree -= $free;

                return [
                    'id' => (int)$value->getKey(),
                    'name' => $value->name ?? 'Option',
                    'price' => (float)$value->price,
                    'qty' => $quantity,
                    'free_qty' => $free,
                ];
            })->values()->all();

            return $prepared === [] ? null : [
                'id' => (int)$option->getKey(),
                'name' => $option->option_name ?? 'Option',
                'values' => $prepared,
            ];
        })->filter()->values()->all();
    }

    private function accountData(Customer $customer): array
    {
        return ['id' => (int)$customer->getKey(), 'first_name' => $customer->first_name,
            'last_name' => $customer->last_name, 'email' => $customer->email, 'telephone' => $customer->telephone];
    }

    private function reservationData(Reservation $reservation): array
    {
        return ['id' => (int)$reservation->getKey(), 'date' => $reservation->reserve_date?->toDateString(),
            'time' => (string)$reservation->reserve_time, 'guests' => (int)$reservation->guest_num,
            'status' => ['id' => (int)$reservation->status_id, 'name' => $reservation->status_name ?? 'Received', 'color' => $reservation->status_color],
            'location' => $reservation->location?->location_name, 'table' => $reservation->tables->first()?->name,
            'comment' => $reservation->comment, 'created_at' => $reservation->created_at?->toIso8601String()];
    }
}
