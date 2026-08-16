<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Support\SessionTokenService;
use Igniter\User\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\ValidationException;
use App\Platform\Tenancy\TenantContext;

class StorefrontLoginController extends Controller
{
    public function __construct(private readonly TenantContext $tenant, private readonly SessionTokenService $tokens) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email:filter'], 'password' => ['required', 'string'],
            'device_name' => ['required', 'string', 'max:255'],
        ]);
        $credentials = ['email' => strtolower($data['email']), 'password' => $data['password']];
        $auth = app('main.auth');
        /** @var Customer|null $customer */
        $customer = Customer::query()
            ->where('restaurant_id', $this->tenant->id())
            ->where('email', $credentials['email'])
            ->first();
        if (!$customer || !$auth->validateCredentials($customer, $credentials)) {
            throw ValidationException::withMessages(['email' => ['The provided credentials are incorrect.']]);
        }
        if (!$customer->is_activated) {
            throw ValidationException::withMessages(['email' => ['Inactive customer account.']]);
        }
        return response()->json($this->tokens->issue(
            $customer,
            $this->tenant->id(),
            'storefront',
            $data['device_name'],
            ['storefront:*'],
        ), 201);
    }
}
