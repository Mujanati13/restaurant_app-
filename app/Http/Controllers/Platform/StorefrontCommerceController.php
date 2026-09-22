<?php

namespace App\Http\Controllers\Platform;

use App\Jobs\SendTenantPush;
use App\Platform\Support\IdempotentRequest;
use App\Platform\Support\TenantSettings;
use App\Platform\Tenancy\TenantContext;
use App\Platform\Models\StorefrontFavorite;
use App\Platform\Models\StorefrontReview;
use App\Platform\Models\StorefrontOffer;
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
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
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

    public function deleteAddress(Request $request, int $addressId): JsonResponse
    {
        $address = $this->customer($request)->addresses()
            ->where('restaurant_id', $this->tenant->id())->findOrFail($addressId);
        $address->delete();

        return response()->json(status: 204);
    }

    public function order(Request $request, int $orderId): JsonResponse
    {
        $order = Order::query()->with(['status', 'location', 'menus.menu_options', 'totals', 'status_history.status'])
            ->where('restaurant_id', $this->tenant->id())
            ->where('customer_id', $this->customer($request)->getKey())->findOrFail($orderId);
        return response()->json(['data' => $this->orderData($order)]);
    }

    public function offers(): JsonResponse
    {
        $offers = StorefrontOffer::query()->where('restaurant_id', $this->tenant->id())->where('active', true)
            ->where(fn($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
            ->orderBy('code')->get();
        return response()->json(['data' => $offers->map(fn(StorefrontOffer $offer) => [
            'code' => $offer->code, 'type' => $offer->type, 'amount' => (float)$offer->amount,
            'minimum_order' => (float)$offer->minimum_order, 'ends_at' => $offer->ends_at?->toIso8601String(),
        ])->values()]);
    }

    public function favorites(Request $request): JsonResponse
    {
        $customer = $this->customer($request);
        $favorites = StorefrontFavorite::query()->where('restaurant_id', $this->tenant->id())
            ->where('customer_id', $customer->getKey())->pluck('menu_id')->map(fn($id) => (int)$id)->values();
        return response()->json(['data' => $favorites]);
    }

    public function addFavorite(Request $request, int $menuId): JsonResponse
    {
        $customer = $this->customer($request);
        Menu::query()->where('restaurant_id', $this->tenant->id())->where('menu_status', true)->findOrFail($menuId);
        StorefrontFavorite::query()->firstOrCreate([
            'restaurant_id' => $this->tenant->id(), 'customer_id' => $customer->getKey(), 'menu_id' => $menuId,
        ]);
        return response()->json(['data' => ['menu_id' => $menuId]], 201);
    }

    public function removeFavorite(Request $request, int $menuId): JsonResponse
    {
        StorefrontFavorite::query()->where('restaurant_id', $this->tenant->id())
            ->where('customer_id', $this->customer($request)->getKey())->where('menu_id', $menuId)->delete();
        return response()->json(status: 204);
    }

    public function cancelOrder(Request $request, int $orderId): JsonResponse
    {
        $order = $this->ownedOrder($request, $orderId);
        $window = max(0, $this->settings->integer('cancellation_window_minutes', 5));
        abort_if($order->cancelled_at, 409, 'This order has already been cancelled.');
        abort_unless($window > 0 && $order->created_at?->greaterThan(now()->subMinutes($window)), 409, 'The cancellation window has ended.');
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:300']]);
        $order->forceFill(['cancelled_at' => now(), 'cancel_reason' => $data['reason'] ?? null])->save();
        return response()->json(['data' => $this->orderData($order->fresh(['status', 'location', 'menus.menu_options', 'status_history.status']))]);
    }

    public function reviewOrder(Request $request, int $orderId): JsonResponse
    {
        $order = $this->ownedOrder($request, $orderId);
        abort_if($order->cancelled_at, 409, 'Cancelled orders cannot be reviewed.');
        $status = mb_strtolower((string)($order->status_name ?? $order->status?->status_name));
        abort_unless(str_contains($status, 'complete') || str_contains($status, 'deliver'), 409, 'Only completed orders can be reviewed.');
        $data = $request->validate(['rating' => ['required', 'integer', 'between:1,5'], 'comment' => ['nullable', 'string', 'max:500']]);
        $review = StorefrontReview::query()->updateOrCreate([
            'restaurant_id' => $this->tenant->id(), 'customer_id' => $this->customer($request)->getKey(), 'order_id' => $order->getKey(),
        ], $data);
        return response()->json(['data' => ['id' => $review->getKey(), ...$data]]);
    }

    /** Available restaurant-local times for the selected fulfilment method. */
    public function fulfillmentSlots(Request $request): JsonResponse
    {
        $data = $request->validate([
            'location_id' => ['required', 'integer', Rule::exists('locations', 'location_id')->where('restaurant_id', $this->tenant->id())],
            'order_type' => ['required', Rule::in(['delivery', 'collection'])],
        ]);
        $locationId = (int)$data['location_id'];
        abort_unless($this->settings->boolean('orders_enabled', true, $locationId), 403, 'Online ordering is not enabled for this location.');
        abort_unless($this->settings->boolean($data['order_type'].'_enabled', true, $locationId), 422, ucfirst($data['order_type']).' ordering is not enabled for this restaurant.');

        $startHour = min(22, max(0, $this->settings->integer('scheduled_order_start_hour', 10, $locationId)));
        $endHour = min(23, max($startHour + 1, $this->settings->integer('scheduled_order_end_hour', 22, $locationId)));
        $timezone = $this->tenant->get()->timezone ?: 'Europe/Zurich';
        $lead = $this->settings->integer($data['order_type'] === 'delivery' ? 'delivery_lead_time_minutes' : 'prep_time_minutes', 30, $locationId);
        $first = now($timezone)->addMinutes(max(5, $lead))->second(0);
        $first->addMinutes((30 - ($first->minute % 30)) % 30);
        $slots = collect(range(0, 6))->flatMap(function (int $day) use ($first, $startHour, $endHour, $timezone): array {
            $date = now($timezone)->addDays($day)->startOfDay();
            return collect(range($startHour * 2, $endHour * 2 - 1))->map(function (int $halfHour) use ($date, $first): ?string {
                $slot = $date->copy()->addMinutes($halfHour * 30);
                return $slot->greaterThanOrEqualTo($first) ? $slot->toIso8601String() : null;
            })->filter()->values()->all();
        })->values();

        return response()->json(['data' => ['timezone' => $timezone, 'asap' => $first->toIso8601String(), 'slots' => $slots]]);
    }

    /** Authoritative pre-check used by checkout before submitting an order. */
    public function quoteOrder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'location_id' => ['required', 'integer', Rule::exists('locations', 'location_id')->where('restaurant_id', $this->tenant->id())],
            'order_type' => ['required', Rule::in(['delivery', 'collection'])],
            'scheduled_for' => ['nullable', 'date', 'after:now', 'before:'.now()->addDays(30)->toIso8601String()],
            'payment_method' => ['nullable', 'string', 'in:cod,card_on_delivery,stripe,bank_transfer'],
            'promo_code' => ['nullable', 'string', 'max:40'],
            'tip_amount' => ['nullable', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'between:1,100'],
            'items.*.menu_id' => ['required', 'integer'], 'items.*.quantity' => ['required', 'integer', 'between:1,50'],
            'items.*.comment' => ['nullable', 'string', 'max:300'], 'items.*.options' => ['nullable', 'array', 'max:50'],
            'items.*.options.*.option_id' => ['required', 'integer'], 'items.*.options.*.values' => ['required', 'array', 'max:50'],
            'items.*.options.*.values.*.value_id' => ['required', 'integer'], 'items.*.options.*.values.*.quantity' => ['nullable', 'integer', 'between:1,50'],
        ]);
        abort_unless($this->settings->boolean('orders_enabled', true, (int)$data['location_id']), 403, 'Online ordering is not enabled for this location.');
        abort_unless($this->settings->boolean($data['order_type'].'_enabled', true, (int)$data['location_id']), 422, ucfirst($data['order_type']).' ordering is not enabled for this restaurant.');
        $this->assertScheduleAvailable($data);
        $quote = $this->buildQuote($data, $this->tenant->get()->settings()->pluck('value', 'key')->all());
        return response()->json(['data' => $quote['payload']]);
    }

    public function createOrder(Request $request): JsonResponse
    {
        $customer = $this->customer($request, true);
        $settings = $this->tenant->get()->settings()->pluck('value', 'key')->all();
        $guestAllowed = filter_var($settings['guest_checkout_enabled'] ?? true, FILTER_VALIDATE_BOOLEAN);

        if (!$customer && !$guestAllowed) {
            abort(401, 'Please sign in or create an account to place an order.');
        }

        $data = $request->validate([
            'location_id' => ['required', 'integer', Rule::exists('locations', 'location_id')->where('restaurant_id', $this->tenant->id())],
            'order_type' => ['required', Rule::in(['delivery', 'collection'])],
            'scheduled_for' => ['nullable', 'date', 'after:now', 'before:'.now()->addDays(30)->toIso8601String()],
            'first_name' => ['required', 'string', 'between:1,48'],
            'last_name' => ['required', 'string', 'between:1,48'],
            'email' => [$customer ? 'nullable' : 'required', 'email', 'max:96'],
            'telephone' => ['required', 'string', 'max:64'],
            'comment' => ['nullable', 'string', 'max:500'],
            'payment_method' => ['nullable', 'string', 'in:cod,card_on_delivery,stripe,bank_transfer'],
            'promo_code' => ['nullable', 'string', 'max:40'],
            'tip_amount' => ['nullable', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'between:1,100'],
            'items.*.menu_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'between:1,50'],
            'items.*.comment' => ['nullable', 'string', 'max:300'],
            'items.*.options' => ['nullable', 'array', 'max:50'],
            'items.*.options.*.option_id' => ['required', 'integer'],
            'items.*.options.*.values' => ['required', 'array', 'max:50'],
            'items.*.options.*.values.*.value_id' => ['required', 'integer'],
            'items.*.options.*.values.*.quantity' => ['nullable', 'integer', 'between:1,50'],
            'address' => ['required_if:order_type,delivery', 'array'],
            'address.address_1' => ['required_if:order_type,delivery', 'string', 'max:128'],
            'address.address_2' => ['nullable', 'string', 'max:128'],
            'address.city' => ['required_if:order_type,delivery', 'string', 'max:128'],
            'address.state' => ['nullable', 'string', 'max:128'],
            'address.postcode' => ['required_if:order_type,delivery', 'string', 'max:20'],
            'address.country_id' => ['required_if:order_type,delivery', 'integer', 'exists:countries,country_id'],
        ]);

        if (!$customer) {
            $customer = Customer::query()->where('restaurant_id', $this->tenant->id())
                ->firstOrCreate(
                    ['email' => $data['email'], 'restaurant_id' => $this->tenant->id()],
                    [
                        'first_name' => $data['first_name'],
                        'last_name' => $data['last_name'],
                        'telephone' => $data['telephone'],
                        'status' => true,
                    ]
                );
        }

        abort_unless($this->settings->boolean('orders_enabled', true, (int) $data['location_id']), 403, 'Online ordering is not enabled for this location.');
        abort_unless(
            $this->settings->boolean($data['order_type'].'_enabled', true, (int) $data['location_id']),
            422,
            ucfirst($data['order_type']).' ordering is not enabled for this restaurant.',
        );
        $this->assertScheduleAvailable($data);

        return $this->idempotency->run($request, 'storefront.order.create', function () use ($request, $customer, $data, $settings): array {
            // Re-run the same validation and total calculation exposed by /orders/quote.
            $quote = $this->buildQuote($data, $settings);
            $location = Location::query()->where('restaurant_id', $this->tenant->id())->findOrFail($data['location_id']);
            $menuIds = collect($data['items'])->pluck('menu_id')->unique()->values();
            $menus = Menu::query()->with(['menu_options.menu_option_values.option_value'])
                ->where('restaurant_id', $this->tenant->id())
                ->where('menu_status', true)->whereIn('menu_id', $menuIds)->get()->keyBy('menu_id');
            abort_unless($menus->count() === $menuIds->count(), 422, 'One or more menu items are unavailable.');

            $scheduledFor = isset($data['scheduled_for']) ? Carbon::parse($data['scheduled_for'], $this->tenant->get()->timezone ?: 'Europe/Zurich') : null;
            $order = new Order;
            $order->fill([
                'customer_id' => $customer->getKey(),
                'restaurant_id' => $this->tenant->id(),
                'location_id' => $location->getKey(),
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $customer->email,
                'telephone' => $data['telephone'],
                'order_type' => $data['order_type'],
                'comment' => $data['comment'] ?? null,
                'payment' => $data['payment_method'] ?? 'cod',
                'status_id' => $this->settings->integer('default_order_status_id', (int) setting('default_order_status'), (int) $data['location_id']),
                'order_date' => ($scheduledFor ?: now())->toDateString(),
                'order_time' => ($scheduledFor ?: now())->format('H:i'),
                'order_time_is_asap' => !$scheduledFor,
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

            if ($data['order_type'] === 'delivery') {
                $minDeliveryOrder = (float)$this->settings->get('min_delivery_order', 0.0, (int)$location->getKey());
                if ($minDeliveryOrder > 0 && $subtotal < $minDeliveryOrder) {
                    abort(422, sprintf('Minimum order amount for delivery is %.2f.', $minDeliveryOrder));
                }
            }

            $deliveryFee = $data['order_type'] === 'delivery' ? (float)$this->settings->get('delivery_charge', 0.0, (int)$location->getKey()) : 0.0;
            $taxRate = (float)($settings['tax_rate'] ?? 0);
            $taxAmount = $taxRate > 0 ? round($subtotal * ($taxRate / 100), 2) : 0.0;
            $tipAmount = isset($data['tip_amount']) ? (float)$data['tip_amount'] : 0.0;
            $total = $quote['payload']['total'];

            $order->forceFill([
                'total_items' => collect($items)->sum('qty'),
                'order_total' => $total,
            ])->saveQuietly();

            $order->updateOrderStatus($order->status_id, ['notify' => true]);
            SendTenantPush::dispatch($this->tenant->id(), 'vendor', 'New order', 'A new order is ready for review.',
                ['type' => 'order', 'id' => (string) $order->getKey(), 'route' => '/orders/'.$order->getKey()]);

            $checkoutUrl = null;
            if (($data['payment_method'] ?? '') === 'stripe' && !empty($settings['payments_stripe_secret_key'])) {
                try {
                    $secretKey = trim((string)$settings['payments_stripe_secret_key']);
                    $currencyCode = strtolower((string)($this->tenant->get()->currency_code ?: 'CHF'));
                    $amountInMinor = (int) round($total * 100);
                    $origin = $request->header('origin') ?: $request->header('referer') ?: url('/');
                    $origin = rtrim($origin, '/');

                    $stripeRes = Http::withToken($secretKey)
                        ->asForm()
                        ->timeout(12)
                        ->post('https://api.stripe.com/v1/checkout/sessions', [
                            'mode' => 'payment',
                            'customer_email' => $data['email'] ?? $customer->email,
                            'client_reference_id' => (string) $order->getKey(),
                            'line_items' => [
                                [
                                    'price_data' => [
                                        'currency' => $currencyCode,
                                        'unit_amount' => $amountInMinor,
                                        'product_data' => [
                                            'name' => "Order #{$order->getKey()} — {$this->tenant->get()->name}",
                                            'description' => ucfirst($order->order_type) . " order for {$order->first_name} {$order->last_name}",
                                        ],
                                    ],
                                    'quantity' => 1,
                                ],
                            ],
                            'success_url' => "{$origin}/account?order={$order->getKey()}&payment=success",
                            'cancel_url' => "{$origin}/checkout?order={$order->getKey()}&payment=cancelled",
                            'metadata' => [
                                'order_id' => (string) $order->getKey(),
                                'restaurant_id' => (string) $this->tenant->id(),
                            ],
                        ]);

                    if ($stripeRes->successful()) {
                        $checkoutUrl = $stripeRes->json('url');
                    } else {
                        Log::warning('Stripe checkout session creation returned error: ' . $stripeRes->body());
                    }
                } catch (\Throwable $e) {
                    Log::warning('Stripe checkout session creation failed: ' . $e->getMessage());
                }
            }

            // A Stripe order is only accepted when the provider session exists. Throwing inside
            // the idempotent database transaction rolls back the provisional order, allowing a
            // recoverable retry with the same cart and idempotency key.
            if (($data['payment_method'] ?? '') === 'stripe' && !$checkoutUrl) {
                abort(502, 'We could not start the card payment. Your cart has been kept so you can try again.');
            }

            $orderPayload = $this->orderData($order->fresh(['status', 'location', 'menus.menu_options', 'status_history.status']));
            if ($checkoutUrl) {
                $orderPayload['checkout_url'] = $checkoutUrl;
            }

            return [['data' => $orderPayload], 201];
        });
    }

    public function handleStripeWebhook(Request $request): JsonResponse
    {
        $settings = $this->tenant->get()->settings()->pluck('value', 'key')->all();
        $payload = $request->getContent();
        $secret = trim((string)($settings['payments_stripe_webhook_secret'] ?? ''));
        abort_if($secret === '', 503, 'Stripe webhook verification is not configured.');
        $signature = (string)$request->header('Stripe-Signature');
        $parts = collect(explode(',', $signature))->mapWithKeys(function (string $part): array {
            [$key, $value] = array_pad(explode('=', trim($part), 2), 2, '');
            return [$key => $value];
        });
        $timestamp = $parts->get('t');
        $received = $parts->get('v1');
        abort_unless($timestamp && $received && abs(time() - (int)$timestamp) <= 300, 400, 'Invalid Stripe signature.');
        $expected = hash_hmac('sha256', $timestamp.'.'.$payload, $secret);
        abort_unless(hash_equals($expected, $received), 400, 'Invalid Stripe signature.');
        $event = json_decode($payload, true);

        if (!$event || !isset($event['type'])) {
            return response()->json(['error' => 'Invalid event payload'], 400);
        }

        if ($event['type'] === 'checkout.session.completed') {
            $session = $event['data']['object'] ?? [];
            $orderId = $session['client_reference_id'] ?? ($session['metadata']['order_id'] ?? null);
            if ($orderId) {
                $order = Order::query()->where('restaurant_id', $this->tenant->id())->find($orderId);
                if ($order) {
                    $order->forceFill([
                        'processed' => true,
                        'payment' => 'stripe',
                    ])->save();
                }
            }
        }

        return response()->json(['received' => true]);
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
        $customer = $this->customer($request, true);
        $data = $request->validate([
            'location_id' => ['required', 'integer', Rule::exists('locations', 'location_id')->where('restaurant_id', $this->tenant->id())],
            'table_id' => ['nullable', 'integer'], 'guest_num' => ['required', 'integer', 'between:1,100'],
            'reserve_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'], 'reserve_time' => ['required', 'date_format:H:i'],
            'duration' => ['nullable', 'integer', 'between:15,480'], 'first_name' => ['required', 'string', 'between:1,48'],
            'last_name' => ['required', 'string', 'between:1,48'],
            'email' => [$customer ? 'nullable' : 'required', 'email', 'max:96'],
            'telephone' => ['required', 'string', 'max:64'],
            'comment' => ['nullable', 'string', 'max:520'],
        ]);

        if (!$customer) {
            $customer = Customer::query()->where('restaurant_id', $this->tenant->id())
                ->firstOrCreate(
                    ['email' => $data['email'], 'restaurant_id' => $this->tenant->id()],
                    [
                        'first_name' => $data['first_name'],
                        'last_name' => $data['last_name'],
                        'telephone' => $data['telephone'],
                        'status' => true,
                    ]
                );
        }

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

    private function buildQuote(array $data, array $settings): array
    {
        $this->assertPaymentMethodAvailable((string)($data['payment_method'] ?? 'cod'), $settings);
        $location = Location::query()->where('restaurant_id', $this->tenant->id())->findOrFail($data['location_id']);
        $menuIds = collect($data['items'])->pluck('menu_id')->unique()->values();
        $menus = Menu::query()->with(['menu_options.menu_option_values.option_value'])
            ->where('restaurant_id', $this->tenant->id())->where('menu_status', true)->whereIn('menu_id', $menuIds)->get()->keyBy('menu_id');
        abort_unless($menus->count() === $menuIds->count(), 422, 'One or more menu items are unavailable.');
        $items = collect($data['items'])->map(function (array $item) use ($menus): CartItem {
            $menu = $menus->get($item['menu_id']);
            $cartItem = new CartItem($menu->getKey(), $menu->menu_name, (float)$menu->menu_price,
                $this->prepareMenuOptions($menu, $item['options'] ?? []), $item['comment'] ?? '');
            $cartItem->setQuantity((int)$item['quantity']);
            return $cartItem;
        })->all();
        $subtotal = collect($items)->sum(fn(CartItem $item) => $item->subtotal());
        if ($data['order_type'] === 'delivery') {
            $minimum = (float)$this->settings->get('min_delivery_order', 0.0, (int)$location->getKey());
            abort_unless($minimum <= 0 || $subtotal >= $minimum, 422, sprintf('Minimum order amount for delivery is %.2f.', $minimum));
        }
        $deliveryFee = $data['order_type'] === 'delivery' ? (float)$this->settings->get('delivery_charge', 0.0, (int)$location->getKey()) : 0.0;
        $taxRate = (float)($settings['tax_rate'] ?? 0);
        $tax = $taxRate > 0 ? round($subtotal * ($taxRate / 100), 2) : 0.0;
        $tip = (float)($data['tip_amount'] ?? 0);
        $discount = 0.0;
        $offerCode = strtoupper(trim((string)($data['promo_code'] ?? '')));
        if ($offerCode !== '') {
            $offer = StorefrontOffer::query()->where('restaurant_id', $this->tenant->id())->where('code', $offerCode)->where('active', true)
                ->where(fn($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
                ->where(fn($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', now()))->first();
            abort_unless($offer, 422, 'This offer is not available.');
            abort_unless($subtotal >= (float)$offer->minimum_order, 422, sprintf('This offer requires an order of at least %.2f.', $offer->minimum_order));
            $discount = $offer->type === 'percent' ? round($subtotal * ((float)$offer->amount / 100), 2) : (float)$offer->amount;
            $discount = min($discount, $subtotal);
        }
        return ['location' => $location, 'items' => $items, 'payload' => [
            'subtotal' => round($subtotal, 2), 'delivery_fee' => round($deliveryFee, 2), 'tax' => $tax,
            'tip' => round($tip, 2), 'discount' => round($discount, 2), 'offer_code' => $offerCode ?: null,
            'total' => round(max(0, $subtotal + $deliveryFee + $tax + $tip - $discount), 2),
            'currency' => strtoupper((string)($this->tenant->get()->currency_code ?: 'CHF')),
        ]];
    }

    private function assertScheduleAvailable(array $data): void
    {
        if (empty($data['scheduled_for'])) return;
        $locationId = (int)$data['location_id'];
        $timezone = $this->tenant->get()->timezone ?: 'Europe/Zurich';
        $scheduled = Carbon::parse($data['scheduled_for'], $timezone);
        $startHour = $this->settings->integer('scheduled_order_start_hour', 10, $locationId);
        $endHour = $this->settings->integer('scheduled_order_end_hour', 22, $locationId);
        abort_unless($scheduled->hour >= $startHour && $scheduled->hour < $endHour, 422, 'The selected time is outside this restaurant’s ordering hours.');
        $lead = $this->settings->integer($data['order_type'] === 'delivery' ? 'delivery_lead_time_minutes' : 'prep_time_minutes', 30, $locationId);
        abort_unless($scheduled->greaterThanOrEqualTo(now($timezone)->addMinutes(max(5, $lead))), 422, 'The selected time is no longer available.');
    }

    private function ownedOrder(Request $request, int $orderId): Order
    {
        return Order::query()->with(['status', 'location', 'menus.menu_options', 'status_history.status'])
            ->where('restaurant_id', $this->tenant->id())->where('customer_id', $this->customer($request)->getKey())->findOrFail($orderId);
    }

    private function assertPaymentMethodAvailable(string $method, array $settings): void
    {
        $available = match ($method) {
            'cod' => filter_var($settings['payments_cod_enabled'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'card_on_delivery' => filter_var($settings['payments_card_on_delivery_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'stripe' => filter_var($settings['payments_stripe_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN)
                && !empty($settings['payments_stripe_publishable_key']) && !empty($settings['payments_stripe_secret_key']),
            'bank_transfer' => filter_var($settings['payments_bank_transfer_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN),
            default => false,
        };
        abort_unless($available, 422, 'The selected payment method is not available.');
    }

    private function customer(Request $request, bool $allowGuest = false): ?Customer
    {
        /** @var Customer|null $customer */
        $customer = $request->user();
        if (!$customer && $allowGuest) {
            return null;
        }
        if (!$customer) {
            abort(401, 'Unauthenticated.');
        }
        return $customer;
    }

    private function orderData(Order $order): array
    {
        $cancelled = (bool)$order->cancelled_at;
        return ['id' => (int)$order->getKey(), 'number' => '#'.$order->getKey(), 'type' => $order->order_type,
            'status' => ['id' => (int)$order->status_id, 'name' => $cancelled ? 'Cancelled' : ($order->status_name ?? 'Received'), 'color' => $cancelled ? '#b42318' : $order->status_color],
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
            'location' => $order->location?->location_name, 'created_at' => $order->created_at?->toIso8601String(),
            'cancelled_at' => $order->cancelled_at?->toIso8601String(), 'cancel_reason' => $order->cancel_reason,
            'payment_state' => $order->payment === 'stripe' ? ($order->processed ? 'paid' : 'pending') : 'pay_at_restaurant'];
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
