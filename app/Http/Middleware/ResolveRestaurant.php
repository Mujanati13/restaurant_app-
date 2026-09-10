<?php

namespace App\Http\Middleware;

use App\Platform\Models\Restaurant;
use App\Platform\Models\RestaurantDomain;
use App\Platform\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveRestaurant
{
    public function __construct(private readonly TenantContext $context) {}

    public function handle(Request $request, Closure $next): Response
    {
        $host = strtolower(preg_replace('/:\d+$/', '', $request->getHost()));
        $identifier = null;

        // Check X-Vondo-Restaurant header
        $headerName = config('vondo.tenant_header', 'X-Vondo-Restaurant');
        if ($request->hasHeader($headerName)) {
            $identifier = trim((string)$request->header($headerName));
        }

        // Check ?restaurant= query param
        if (empty($identifier) && $request->filled('restaurant')) {
            $identifier = trim((string)$request->query('restaurant'));
        }

        // Check JSON / POST body parameter
        if (empty($identifier) && $request->filled('restaurant')) {
            $identifier = trim((string)$request->input('restaurant'));
        }

        $restaurant = !empty($identifier)
            ? Restaurant::query()->where(fn($query) => $query->where('public_id', $identifier)->orWhere('slug', $identifier))->first()
            : RestaurantDomain::query()->with('restaurant')->where('host', $host)->whereNotNull('verified_at')->first()?->restaurant;

        if (!$restaurant) {
            $baseDomain = strtolower((string)config('vondo.base_domain'));
            $isIpOrLocal = in_array($host, ['localhost', '127.0.0.1'], true)
                || filter_var($host, FILTER_VALIDATE_IP) !== false
                || $host === 'webserver';

            $slug = ($host === $baseDomain || $isIpOrLocal)
                ? config('vondo.default_restaurant_slug')
                : (str_ends_with($host, '.'.$baseDomain) ? substr($host, 0, -strlen('.'.$baseDomain)) : null);

            $restaurant = $slug ? Restaurant::query()->where('slug', $slug)->first() : null;

            // Fallback for IP address or local development if default slug does not match: use first active restaurant
            if (!$restaurant && $isIpOrLocal) {
                $restaurant = Restaurant::query()->where('status', 'active')->orderBy('id')->first();
            }
        }

        // For owner/vendor login endpoints, if domain resolution did not identify the restaurant,
        // allow the request to proceed so VendorLoginController can resolve it from user credentials
        $isLoginRoute = $request->is('api/v1/owner/token') || $request->is('api/v1/vendor/token');
        if (!$restaurant && $isLoginRoute) {
            return $next($request);
        }

        abort_if(!$restaurant, 404, 'Restaurant not found for this domain.');
        abort_if(in_array($restaurant->status, ['suspended', 'archived'], true), 423, 'This restaurant is not currently available.');
        $this->context->set($restaurant);

        try {
            return $next($request);
        } finally {
            $this->context->clear();
        }
    }
}
