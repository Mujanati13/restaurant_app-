<?php

namespace Tests\Feature;

use App\Platform\Models\Restaurant;
use App\Platform\Security\GoogleIdTokenVerifier;
use Illuminate\Support\Str;
use Tests\TestCase;

class StorefrontGoogleLoginTest extends TestCase
{
    private Restaurant $restaurant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->restaurant = Restaurant::query()->where('slug', 'default')->firstOrFail();
    }

    public function test_a_verified_google_identity_creates_a_tenant_customer_and_session(): void
    {
        $email = 'google-'.Str::lower(Str::random(12)).'@gmail.com';
        $subject = 'google-subject-'.Str::random(20);
        $this->fakeGoogleClaims($subject, $email);

        $response = $this->withTenant()->postJson('/api/v1/storefront/google', [
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
            'provider' => 'google',
            'provider_subject' => $subject,
            'email' => $email,
        ]);
        $this->withTenant()->withToken($response->json('token'))
            ->getJson('/api/v1/storefront/account')
            ->assertOk();
    }

    public function test_an_existing_password_account_is_not_automatically_linked_to_google(): void
    {
        $email = 'existing-'.Str::lower(Str::random(12)).'@example.test';
        $this->withTenant()->postJson('/api/v1/storefront/register', [
            'first_name' => 'Existing', 'last_name' => 'Customer', 'email' => $email,
            'telephone' => '+41440000000', 'password' => 'Customer!2026', 'password_confirm' => 'Customer!2026',
        ])->assertCreated();
        $this->fakeGoogleClaims('google-subject-'.Str::random(20), $email);

        $this->withTenant()->postJson('/api/v1/storefront/google', [
            'id_token' => 'verified-by-test-double', 'device_name' => 'feature-test',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
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
                return [
                    'sub' => $this->subject,
                    'email' => $this->email,
                    'email_verified' => true,
                    'given_name' => 'Google',
                    'family_name' => 'Customer',
                ];
            }
        });
    }
}
