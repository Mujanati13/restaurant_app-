<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Models\CustomerSocialIdentity;
use App\Platform\Security\GoogleIdTokenVerifier;
use App\Platform\Support\SessionTokenService;
use App\Platform\Tenancy\TenantContext;
use Igniter\User\Models\Customer;
use Igniter\User\Models\CustomerGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class StorefrontGoogleLoginController extends Controller
{
    public function __construct(
        private readonly TenantContext $tenant,
        private readonly SessionTokenService $tokens,
        private readonly GoogleIdTokenVerifier $google,
    ) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_token' => ['required', 'string', 'max:8192'],
            'device_name' => ['required', 'string', 'max:255'],
        ]);
        $claims = $this->google->verify($data['id_token']);
        $email = Str::lower((string) $claims['email']);

        $customer = DB::transaction(function () use ($claims, $email): Customer {
            $identity = CustomerSocialIdentity::query()
                ->where('restaurant_id', $this->tenant->id())
                ->where('provider', 'google')
                ->where('provider_subject', (string) $claims['sub'])
                ->lockForUpdate()
                ->first();

            if ($identity) {
                $customer = Customer::query()
                    ->where('restaurant_id', $this->tenant->id())
                    ->find($identity->customer_id);
                if (!$customer || !$customer->is_activated) {
                    throw ValidationException::withMessages(['id_token' => ['This Google account is not available for this restaurant.']]);
                }

                if ($identity->email !== $email) {
                    $identity->forceFill(['email' => $email])->save();
                }

                return $customer;
            }

            // Never link an existing password account from an unprompted social login.
            // The customer can continue with their existing sign-in method.
            if (Customer::query()->where('restaurant_id', $this->tenant->id())->where('email', $email)->exists()) {
                throw ValidationException::withMessages(['email' => ['An account with this email already exists. Sign in with your password instead.']]);
            }

            $customerGroupId = CustomerGroup::query()->where('is_default', true)->value('customer_group_id')
                ?? CustomerGroup::query()->value('customer_group_id');
            abort_unless($customerGroupId, 503, 'Customer registration is not configured.');

            $firstName = trim((string) ($claims['given_name'] ?? 'Guest')) ?: 'Guest';
            $lastName = trim((string) ($claims['family_name'] ?? ''));
            $customer = (new Customer)->register([
                'first_name' => Str::limit($firstName, 48, ''),
                'last_name' => Str::limit($lastName, 48, ''),
                'email' => $email,
                'telephone' => '',
                'password' => Str::password(40),
                'customer_group_id' => $customerGroupId,
                'status' => true,
                'is_activated' => true,
                'activated_at' => now(),
            ]);
            $customer->forceFill(['restaurant_id' => $this->tenant->id()])->save();

            CustomerSocialIdentity::query()->create([
                'restaurant_id' => $this->tenant->id(),
                'customer_id' => $customer->getKey(),
                'provider' => 'google',
                'provider_subject' => (string) $claims['sub'],
                'email' => $email,
            ]);

            return $customer;
        });

        return response()->json($this->tokens->issue(
            $customer,
            $this->tenant->id(),
            'storefront',
            $data['device_name'],
            ['storefront:*'],
        ), 201);
    }
}
