<?php

namespace App\Http\Middleware;

use App\Platform\Tenancy\TenantContext;
use Igniter\User\Models\Customer;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCustomerRestaurant
{
    public function __construct(private readonly TenantContext $tenant) {}

    public function handle(Request $request, Closure $next): Response
    {
        $customer = $request->user();
        abort_unless($customer instanceof Customer, 403, 'A customer account is required.');
        abort_unless((int)$customer->restaurant_id === $this->tenant->id(), 403, 'This customer session belongs to another restaurant.');
        $tokenRestaurantId = $customer->currentAccessToken()?->getAttribute('restaurant_id');
        abort_unless((int)$tokenRestaurantId === $this->tenant->id(), 401, 'This customer session is not valid for this restaurant.');
        abort_unless($customer->tokenCan('storefront:*'), 403, 'This session cannot access storefront operations.');

        return $next($request);
    }
}
