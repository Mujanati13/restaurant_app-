<?php

namespace App\Http\Controllers\Platform;

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
        return $this->rotate($request, 'storefront', $this->tenant->id(), fn($principal) => $principal instanceof Customer
            && (int)$principal->restaurant_id === $this->tenant->id() && $principal->is_activated);
    }

    public function owner(Request $request): JsonResponse
    {
        return $this->rotate($request, 'owner', $this->tenant->id(), fn($principal) => $principal instanceof User
            && $this->membershipExists($principal, ['owner', 'manager']));
    }

    public function vendor(Request $request): JsonResponse
    {
        return $this->rotate($request, 'vendor', $this->tenant->id(), fn($principal) => $principal instanceof User
            && ($principal->isSuperUser() || $this->membershipExists($principal, ['owner', 'manager', 'staff'])));
    }

    public function platform(Request $request): JsonResponse
    {
        return $this->rotate($request, 'platform', null, fn($principal) => $principal instanceof PlatformAdmin && $principal->active);
    }

    private function rotate(Request $request, string $audience, ?int $restaurantId, callable $authorize): JsonResponse
    {
        $data = $request->validate(['refresh_token' => ['required', 'string', 'size:80']]);

        return response()->json($this->tokens->rotate($data['refresh_token'], $audience, $restaurantId, $authorize), 201);
    }

    private function membershipExists(User $user, array $roles): bool
    {
        return RestaurantMembership::query()->where('restaurant_id', $this->tenant->id())
            ->where('user_id', $user->getKey())->where('status', 'active')->whereIn('role', $roles)->exists();
    }
}
