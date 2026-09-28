<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Models\CustomerSocialIdentity;
use App\Platform\Security\FirebaseIdTokenVerifier;
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

class StorefrontFirebaseGoogleLoginController extends Controller
{
    private const string PROVIDER = 'firebase-google';

    public function __construct(
        private readonly TenantContext $tenant,
        private readonly SessionTokenService $tokens,
        private readonly FirebaseIdTokenVerifier $firebase,
    ) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_token' => ['required', 'string', 'max:8192'],
            'device_name' => ['required', 'string', 'max:255'],
        ]);
        $claims = $this->firebase->verifyGoogleSignIn($data['id_token']);
        $email = Str::lower((string) $claims['email']);

        $customer = DB::transaction(function () use ($claims, $email): Customer {
            $identity = CustomerSocialIdentity::query()
                ->where('restaurant_id', $this->tenant->id())
                ->where('provider', self::PROVIDER)
                ->where('provider_subject', (string) $claims['sub'])
                ->lockForUpdate()
                ->first();

            // Firebase ID tokens expose the underlying Google subject. When it
            // matches a customer created by the former direct-Google flow, add
            // a Firebase identity without ever linking accounts by email alone.
            if (! $identity && ($googleSubject = $this->googleSubject($claims))) {
                $legacyIdentity = CustomerSocialIdentity::query()
                    ->where('restaurant_id', $this->tenant->id())
                    ->where('provider', 'google')
                    ->where('provider_subject', $googleSubject)
                    ->lockForUpdate()
                    ->first();
                if ($legacyIdentity) {
                    $identity = CustomerSocialIdentity::query()->create([
                        'restaurant_id' => $this->tenant->id(),
                        'customer_id' => $legacyIdentity->customer_id,
                        'provider' => self::PROVIDER,
                        'provider_subject' => (string) $claims['sub'],
                        'email' => $email,
                    ]);
                }
            }

            if ($identity) {
                $customer = Customer::query()
                    ->where('restaurant_id', $this->tenant->id())
                    ->find($identity->customer_id);
                if (! $customer || ! $customer->is_activated) {
                    throw ValidationException::withMessages(['id_token' => ['This Firebase account is not available for this restaurant.']]);
                }

                if ($identity->email !== $email) {
                    $identity->forceFill(['email' => $email])->save();
                }

                return $customer;
            }

            // Do not attach a Firebase account to an existing password account
            // merely because they share an email address.
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
                'provider' => self::PROVIDER,
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

    /** @param array<string, mixed> $claims */
    private function googleSubject(array $claims): ?string
    {
        $identities = $claims['firebase']['identities']['google.com'] ?? null;
        $subject = is_array($identities) ? ($identities[0] ?? null) : null;

        return is_string($subject) && $subject !== '' ? $subject : null;
    }
}
