<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Models\PlatformRefreshToken;
use App\Platform\Models\RestaurantMembership;
use App\Platform\Models\PlatformAdmin;
use App\Platform\Support\SessionTokenService;
use App\Platform\Tenancy\TenantContext;
use Igniter\User\Models\Customer;
use Igniter\User\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class SessionRefreshController extends Controller
{
    public function __construct(private readonly TenantContext $tenant, private readonly SessionTokenService $tokens) {}

    public function storefront(Request $request): JsonResponse
    {
        $restaurantId = $this->resolveRestaurantId($request);
        return $this->rotate($request, 'storefront', $restaurantId, fn($principal) => $principal instanceof Customer
            && (int)$principal->restaurant_id === (int)$restaurantId && $principal->is_activated);
    }

    public function owner(Request $request): JsonResponse
    {
        $restaurantId = $this->resolveRestaurantId($request);
        return $this->rotate($request, 'owner', $restaurantId, fn($principal) => $principal instanceof User
            && ($principal->isSuperUser() || $this->membershipExists($principal, $restaurantId, ['owner', 'manager'])));
    }

    public function vendor(Request $request): JsonResponse
    {
        $restaurantId = $this->resolveRestaurantId($request);
        return $this->rotate($request, 'vendor', $restaurantId, fn($principal) => $principal instanceof User
            && ($principal->isSuperUser() || $this->membershipExists($principal, $restaurantId, ['owner', 'manager', 'staff'])));
    }

    public function platform(Request $request): JsonResponse
    {
        return $this->rotate($request, 'platform', null, fn($principal) => $principal instanceof PlatformAdmin && $principal->active);
    }

    private function resolveRestaurantId(Request $request): ?int
    {
        if ($this->tenant->has()) {
            return $this->tenant->id();
        }

        $plainToken = (string)$request->input('refresh_token');
        if ($plainToken !== '') {
            $tokenHash = hash('sha256', $plainToken);
            $record = PlatformRefreshToken::query()->where('token_hash', $tokenHash)->first(['restaurant_id']);
            if ($record && $record->restaurant_id) {
                return (int)$record->restaurant_id;
            }
        }

        return null;
    }

    private function rotate(Request $request, string $audience, ?int $restaurantId, callable $authorize): JsonResponse
    {
        $data = $request->validate(['refresh_token' => ['required', 'string', 'size:80']]);

        return response()->json($this->tokens->rotate($data['refresh_token'], $audience, $restaurantId, $authorize), 201);
    }

    private function membershipExists(User $user, ?int $restaurantId, array $roles): bool
    {
        if (!$restaurantId) {
            return false;
        }

        return RestaurantMembership::query()->where('restaurant_id', $restaurantId)
            ->where('user_id', $user->getKey())->where('status', 'active')->whereIn('role', $roles)->exists();
    }
}
