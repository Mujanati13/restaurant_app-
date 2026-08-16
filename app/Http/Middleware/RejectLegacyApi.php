<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RejectLegacyApi
{
    public function handle(Request $request, Closure $next): Response
    {
        $routeName = (string)optional($request->route())->getName();

        abort_if(
            $request->is('api/token') || str_starts_with($routeName, 'igniter.api.'),
            410,
            'This legacy API is disabled. Use the tenant-safe /api/v1 endpoints.',
        );

        return $next($request);
    }
}
