<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Models\Restaurant;
use App\Platform\Models\RestaurantMembership;
use App\Platform\Support\SessionTokenService;
use App\Platform\Tenancy\TenantContext;
use Igniter\User\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\ValidationException;

class VendorLoginController extends Controller
{
    public function __construct(private readonly TenantContext $tenant, private readonly SessionTokenService $tokens) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email:filter'],
            'password' => ['required', 'string'],
            'device_name' => ['required', 'string', 'max:255'],
            'restaurant' => ['nullable', 'string'],
        ]);
        $credentials = ['email' => strtolower($data['email']), 'password' => $data['password']];
        $auth = app('admin.auth');
        /** @var User|null $user */
        $user = $auth->getByCredentials($credentials);
        if (!$user || !$auth->validateCredentials($user, $credentials)) {
            throw ValidationException::withMessages(['email' => ['The provided credentials are incorrect.']]);
        }
        if (config('vondo.require_email_verification', false)) {
            abort_unless($user->is_activated, 403, 'Verify your email address before signing in.');
        }

        // Determine target restaurant
        $targetRestaurant = null;
        $explicitRestaurant = trim((string)(
            $request->header(config('vondo.tenant_header'))
            ?: $request->query('restaurant')
            ?: ($data['restaurant'] ?? '')
        ));

        if ($explicitRestaurant !== '') {
            $targetRestaurant = Restaurant::query()
                ->where(fn($q) => $q->where('public_id', $explicitRestaurant)->orWhere('slug', $explicitRestaurant))
                ->first();
        }

        // If no explicit tenant was requested, but context is already set:
        // verify if user actually belongs to it (to avoid trapping user in fallback restaurant)
        if (!$targetRestaurant && $this->tenant->has()) {
            $currentContextRestaurant = $this->tenant->get();
            $belongsToContext = $user->isSuperUser() || RestaurantMembership::query()
                ->where('restaurant_id', $currentContextRestaurant->getKey())
                ->where('user_id', $user->getKey())
                ->where('status', 'active')
                ->exists();
            if ($belongsToContext) {
                $targetRestaurant = $currentContextRestaurant;
            }
        }

        // If still not determined, resolve target restaurant from user's active memberships
        if (!$targetRestaurant) {
            $membership = RestaurantMembership::query()
                ->with('restaurant')
                ->where('user_id', $user->getKey())
                ->where('status', 'active')
                ->orderBy('id')
                ->first();
            $targetRestaurant = $membership?->restaurant;
        }

        // Super users can access the system even without explicit membership
        if (!$targetRestaurant && $user->isSuperUser()) {
            $targetRestaurant = $this->tenant->has()
                ? $this->tenant->get()
                : Restaurant::query()->where('status', 'active')->orderBy('id')->first();
        }

        abort_if(!$targetRestaurant, 403, 'No active restaurant membership found for this account.');
        abort_if(in_array($targetRestaurant->status, ['suspended', 'archived'], true), 423, 'This restaurant is not currently available.');

        $isStaff = $user->isSuperUser() || RestaurantMembership::query()
            ->where('restaurant_id', $targetRestaurant->getKey())
            ->where('user_id', $user->getKey())
            ->where('status', 'active')
            ->exists();
        abort_unless($isStaff, 403, 'This staff account does not belong to this restaurant.');

        $this->tenant->set($targetRestaurant);

        $audience = $request->is('api/v1/owner/*') ? 'owner' : 'vendor';
        $tokenData = $this->tokens->issue(
            $user,
            $targetRestaurant->getKey(),
            $audience,
            $data['device_name'],
            ['orders:*', 'reservations:*', 'menus:*'],
        );

        return response()->json([
            ...$tokenData,
            'restaurant' => [
                'id' => $targetRestaurant->getKey(),
                'public_id' => $targetRestaurant->public_id,
                'slug' => $targetRestaurant->slug,
                'name' => $targetRestaurant->name,
            ],
        ], 201);
    }
}
