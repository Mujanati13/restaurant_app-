<?php

namespace App\Http\Middleware;

use Closure;
use Igniter\User\Models\User;
use Illuminate\Http\Request;

class EnsureLegacyAdminSuperUser
{
    public function handle(Request $request, Closure $next)
    {
        $user = app('admin.auth')->user();

        abort_unless(
            $user instanceof User && $user->isSuperUser(),
            403,
            'The legacy administration area is restricted to the Super Admin. Restaurant owners must use /vondo-admin/.',
        );

        return $next($request);
    }
}
