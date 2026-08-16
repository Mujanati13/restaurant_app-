<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RejectLegacyStorefront
{
    public function handle(Request $request, Closure $next): Response
    {
        $route = $request->route();
        $name = (string) optional($route)->getName();
        $action = (string) optional($route)->getActionName();
        $legacy = str_starts_with($name, 'igniter.theme.')
            || str_starts_with($name, 'igniter.pages.')
            || str_contains($action, 'Igniter\\Main\\Classes\\MainController')
            || $request->is('ti_payregister/*')
            || $request->is('igniter/socialite/*');

        if (!$legacy) {
            return $next($request);
        }
        if ($request->isMethod('GET') || $request->isMethod('HEAD')) {
            $url = rtrim((string) config('vondo.storefront_url'), '/');
            abort_if($url === '', 410, 'The legacy storefront is disabled.');

            return redirect()->away($url, 308);
        }

        abort(410, 'The legacy storefront is disabled. Use the tenant-safe Vondo storefront API.');
    }
}
