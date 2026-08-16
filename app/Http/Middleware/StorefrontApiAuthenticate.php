<?php

namespace App\Http\Middleware;

use Closure;
use Igniter\Api\Exceptions\AuthenticationException as ApiAuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Auth\AuthenticationException;

class StorefrontApiAuthenticate extends \Illuminate\Auth\Middleware\Authenticate
{
    /** Only catalog reads are public; all customer and operational resources require a token. */
    protected array $publicReadResources = ['categories', 'currencies', 'locations', 'menus'];

    public function handle($request, Closure $next, ...$guards)
    {
        try {
            $guard = config('igniter-api.guard');
            if (!empty($guard)) {
                $guards[] = $guard;
            }

            return parent::handle($request, $next, ...$guards);
        } catch (AuthenticationException $exception) {
            if ($request instanceof Request
                && $request->isMethod('GET')
                && in_array($request->segment(2), $this->publicReadResources, true)) {
                return $next($request);
            }

            throw new ApiAuthenticationException('Unauthenticated.', $exception->guards());
        }
    }
}
