<?php

namespace App\Http\Middleware;

use Closure;
use App\Platform\Models\PlatformAdmin;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        abort_unless($user instanceof PlatformAdmin && $user->active, 403, 'Super Admin access is required.');
        abort_unless($user->tokenCan('platform:*') || $user->tokenCan('*'), 403, 'This session cannot access platform administration.');

        return $next($request);
    }
}
