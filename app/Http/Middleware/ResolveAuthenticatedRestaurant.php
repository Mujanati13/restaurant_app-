<?php

namespace App\Http\Middleware;

use App\Platform\Models\Restaurant;
use App\Platform\Models\RestaurantMembership;
use App\Platform\Tenancy\TenantContext;
use Igniter\User\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveAuthenticatedRestaurant
{
    public function __construct(private readonly TenantContext $context) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403, 'A restaurant staff account is required.');
        $identifier = trim((string)$request->header(config('vondo.tenant_header')));

        if ($user->isSuperUser()) {
            $restaurant = Restaurant::query()
                ->when($identifier !== '', fn($query) => $query->where(fn($inner) => $inner->where('public_id', $identifier)->orWhere('slug', $identifier)))
                ->orderBy('id')->first();
        } else {
            $membership = RestaurantMembership::query()->with('restaurant')
                ->where('user_id', $user->getKey())->where('status', 'active')
                ->when($identifier !== '', fn($query) => $query->whereHas('restaurant', fn($inner) => $inner->where(fn($match) => $match->where('public_id', $identifier)->orWhere('slug', $identifier))))
                ->orderBy('id')->first();
            $restaurant = $membership?->restaurant;
        }

        abort_if(!$restaurant, 403, 'No active restaurant membership was found.');
        $tokenRestaurantId = $user->currentAccessToken()?->getAttribute('restaurant_id');
        abort_unless((int)$tokenRestaurantId === (int)$restaurant->getKey(), 401, 'This staff session is not valid for this restaurant.');
        abort_if(in_array($restaurant->status, ['suspended', 'archived'], true), 423, 'This restaurant is not currently available.');
        $this->context->set($restaurant);

        try {
            return $next($request);
        } finally {
            $this->context->clear();
        }
    }
}
