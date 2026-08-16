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

        if (config('vondo.allow_tenant_header')) {
            $identifier = trim((string)$request->header(config('vondo.tenant_header')));
        }

        $restaurant = $identifier !== '' && $identifier !== null
            ? Restaurant::query()->where(fn($query) => $query->where('public_id', $identifier)->orWhere('slug', $identifier))->first()
            : RestaurantDomain::query()->with('restaurant')->where('host', $host)->whereNotNull('verified_at')->first()?->restaurant;

        if (!$restaurant) {
            $baseDomain = strtolower((string)config('vondo.base_domain'));
            $slug = $host === $baseDomain || in_array($host, ['localhost', '127.0.0.1'], true)
                ? config('vondo.default_restaurant_slug')
                : (str_ends_with($host, '.'.$baseDomain) ? substr($host, 0, -strlen('.'.$baseDomain)) : null);
            $restaurant = $slug ? Restaurant::query()->where('slug', $slug)->first() : null;
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
