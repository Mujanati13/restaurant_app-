<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Models\RestaurantMembership;
use App\Platform\Support\SessionTokenService;
use App\Platform\Tenancy\TenantContext;
use Igniter\User\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\ValidationException;

class VendorLoginController extends Controller
{
    public function __construct(private readonly TenantContext $tenant, private readonly SessionTokenService $tokens) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email:filter'], 'password' => ['required', 'string'],
            'device_name' => ['required', 'string', 'max:255'],
        ]);
        $credentials = ['email' => strtolower($data['email']), 'password' => $data['password']];
        $auth = app('admin.auth');
        /** @var User|null $user */
        $user = $auth->getByCredentials($credentials);
        if (!$user || !$auth->validateCredentials($user, $credentials)) {
            throw ValidationException::withMessages(['email' => ['The provided credentials are incorrect.']]);
        }
        if (config('vondo.require_email_verification', false)) {
            abort_unless($user->is_activated, 403, 'Verify your email address before signing in.');
        }
        $allowed = $user->isSuperUser() || RestaurantMembership::query()
            ->where('restaurant_id', $this->tenant->id())->where('user_id', $user->getKey())->where('status', 'active')->exists();
        abort_unless($allowed, 403, 'This staff account does not belong to this restaurant.');

        $audience = $request->is('api/v1/owner/*') ? 'owner' : 'vendor';
        return response()->json($this->tokens->issue(
            $user,
            $this->tenant->id(),
            $audience,
            $data['device_name'],
            ['orders:*', 'reservations:*', 'menus:*'],
        ), 201);
    }
}
