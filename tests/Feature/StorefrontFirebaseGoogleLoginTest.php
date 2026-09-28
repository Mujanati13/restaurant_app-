<?php

namespace Tests\Feature;

use App\Platform\Models\Restaurant;
use App\Platform\Security\FirebaseIdTokenVerifier;
use App\Platform\Security\GoogleIdTokenVerifier;
use Igniter\User\Models\Customer;
use Illuminate\Support\Str;
use Tests\TestCase;

class StorefrontFirebaseGoogleLoginTest extends TestCase
{
    private Restaurant $restaurant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->restaurant = Restaurant::query()->where('slug', 'default')->firstOrFail();
    }

    public function test_a_verified_firebase_google_identity_creates_a_tenant_customer_and_session(): void
    {
        $email = 'firebase-google-'.Str::lower(Str::random(12)).'@gmail.com';
        $firebaseUid = 'firebase-uid-'.Str::random(20);
        $this->fakeFirebaseClaims($firebaseUid, $email, 'google-subject-'.Str::random(20));

        $response = $this->withTenant()->postJson('/api/v1/storefront/firebase/google', [
            'id_token' => 'verified-by-test-double',
            'device_name' => 'feature-test',
        ])->assertCreated()->assertJsonStructure(['token', 'refresh_token', 'expires_at']);

        $this->assertDatabaseHas('customers', [
            'restaurant_id' => $this->restaurant->getKey(),
            'email' => $email,
            'is_activated' => 1,
        ]);
        $this->assertDatabaseHas('customer_social_identities', [
            'restaurant_id' => $this->restaurant->getKey(),
            'provider' => 'firebase-google',
            'provider_subject' => $firebaseUid,
            'email' => $email,
        ]);
        $this->withTenant()->withToken($response->json('token'))
            ->getJson('/api/v1/storefront/account')
            ->assertOk();
    }

    public function test_an_existing_password_account_is_not_automatically_linked_to_firebase(): void
    {
        $email = 'existing-firebase-'.Str::lower(Str::random(12)).'@example.test';
        $this->withTenant()->postJson('/api/v1/storefront/register', [
            'first_name' => 'Existing', 'last_name' => 'Customer', 'email' => $email,
            'telephone' => '+41440000000', 'password' => 'Customer!2026', 'password_confirm' => 'Customer!2026',
        ])->assertCreated();
        $this->fakeFirebaseClaims('firebase-uid-'.Str::random(20), $email, 'google-subject-'.Str::random(20));

        $this->withTenant()->postJson('/api/v1/storefront/firebase/google', [
            'id_token' => 'verified-by-test-double', 'device_name' => 'feature-test',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_a_legacy_google_identity_is_safely_migrated_to_firebase(): void
    {
        $email = 'legacy-google-'.Str::lower(Str::random(12)).'@gmail.com';
        $googleSubject = 'google-subject-'.Str::random(20);
        $this->fakeGoogleClaims($googleSubject, $email);
        $this->withTenant()->postJson('/api/v1/storefront/google', [
            'id_token' => 'legacy-google-token', 'device_name' => 'feature-test',
        ])->assertCreated();

        $firebaseUid = 'firebase-uid-'.Str::random(20);
        $this->fakeFirebaseClaims($firebaseUid, $email, $googleSubject);
        $this->withTenant()->postJson('/api/v1/storefront/firebase/google', [
            'id_token' => 'firebase-token', 'device_name' => 'feature-test',
        ])->assertCreated();

        $this->assertSame(1, Customer::query()
            ->where('restaurant_id', $this->restaurant->getKey())
            ->where('email', $email)
            ->count());
        $this->assertDatabaseHas('customer_social_identities', [
            'restaurant_id' => $this->restaurant->getKey(),
            'provider' => 'firebase-google',
            'provider_subject' => $firebaseUid,
            'email' => $email,
        ]);
    }

    private function withTenant(): static
    {
        return $this->withHeader((string) config('vondo.tenant_header'), $this->restaurant->public_id);
    }

    private function fakeGoogleClaims(string $subject, string $email): void
    {
        $this->app->instance(GoogleIdTokenVerifier::class, new class($subject, $email) extends GoogleIdTokenVerifier
        {
            public function __construct(private readonly string $subject, private readonly string $email) {}

            public function verify(string $idToken): array
            {
                return ['sub' => $this->subject, 'email' => $this->email, 'email_verified' => true, 'given_name' => 'Google'];
            }
        });
    }

    private function fakeFirebaseClaims(string $firebaseUid, string $email, string $googleSubject): void
    {
        $this->app->instance(FirebaseIdTokenVerifier::class, new class($firebaseUid, $email, $googleSubject) extends FirebaseIdTokenVerifier
        {
            public function __construct(
                private readonly string $firebaseUid,
                private readonly string $email,
                private readonly string $googleSubject,
            ) {}

            public function verifyGoogleSignIn(string $idToken): array
            {
                return [
                    'sub' => $this->firebaseUid,
                    'email' => $this->email,
                    'email_verified' => true,
                    'given_name' => 'Firebase',
                    'family_name' => 'Customer',
                    'firebase' => [
                        'sign_in_provider' => 'google.com',
                        'identities' => ['google.com' => [$this->googleSubject]],
                    ],
                ];
            }
        });
    }
}
