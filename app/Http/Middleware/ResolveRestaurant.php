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
        $baseDomain = strtolower((string)config('vondo.base_domain'));
        $isIpOrLocal = in_array($host, ['localhost', '127.0.0.1'], true)
            || filter_var($host, FILTER_VALIDATE_IP) !== false
            || $host === 'webserver';

        $restaurant = null;

        // 1. Check verified custom domain first
        $restaurant = RestaurantDomain::query()
            ->with('restaurant')
            ->where('host', $host)
            ->whereNotNull('verified_at')
            ->first()?->restaurant;

        // 2. Check restaurant subdomain (e.g. <slug>.deliveriano.ch)
        if (!$restaurant && str_ends_with($host, '.' . $baseDomain)) {
            $subdomain = substr($host, 0, -strlen('.' . $baseDomain));
            if (!in_array($subdomain, ['www', 'api', 'backend', 'marketplace', 'admin'], true)) {
                $restaurant = Restaurant::query()->where('slug', $subdomain)->first();
            }
        }

        // 3. If not resolved by domain/subdomain, check explicit header or query param
        // (e.g. during dev, mobile app, or direct ?restaurant=<slug> links)
        if (!$restaurant) {
            $identifier = null;
            $headerName = config('vondo.tenant_header', 'X-Vondo-Restaurant');
            if ($request->hasHeader($headerName)) {
                $identifier = trim((string)$request->header($headerName));
            } elseif ($request->filled('restaurant')) {
                $identifier = trim((string)$request->input('restaurant'));
            }

            if (!empty($identifier)) {
                $restaurant = Restaurant::query()
                    ->where(fn($query) => $query->where('public_id', $identifier)->orWhere('slug', $identifier))
                    ->first();
            }
        }

        // 4. Fallback for IP/local development ONLY if marketplace is NOT enabled
        if (!$restaurant && $isIpOrLocal && !config('vondo.marketplace_enabled', true)) {
            $defaultSlug = config('vondo.default_restaurant_slug');
            $restaurant = $defaultSlug ? Restaurant::query()->where('slug', $defaultSlug)->first() : null;
            if (!$restaurant) {
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
