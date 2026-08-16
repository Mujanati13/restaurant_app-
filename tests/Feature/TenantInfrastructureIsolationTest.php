<?php

namespace Tests\Feature;

use App\Jobs\PrepareAppBuild;
use App\Notifications\OwnerResetPassword;
use App\Notifications\OwnerVerifyEmail;
use App\Notifications\AppBuildFailed;
use App\Notifications\RestaurantStaffInvitation;
use App\Platform\Models\AppBuild;
use App\Platform\Models\PlatformIdempotencyKey;
use App\Platform\Models\Restaurant;
use App\Platform\Support\IdempotentRequest;
use App\Platform\Support\TenantCache;
use App\Platform\Support\TenantRateLimitKey;
use App\Platform\Support\PlatformMfa;
use App\Platform\Tenancy\TenantContext;
use Igniter\Coupons\Models\Coupon;
use Igniter\Cart\Models\OrderMenu;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class TenantInfrastructureIsolationTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(ThrottleRequests::class);
    }

    public function test_build_job_requires_matching_restaurant_and_writes_tenant_prefixed_manifest(): void
    {
        Storage::fake('local');
        $restaurant = $this->restaurant('build');
        $build = AppBuild::query()->create([
            'restaurant_id' => $restaurant->getKey(),
            'platform' => 'android',
            'status' => 'queued',
            'configuration' => ['app_name' => 'Tenant Build'],
        ]);

        (new PrepareAppBuild($build->getKey(), $restaurant->getKey()))->handle();

        $expectedPath = 'builds/'.$restaurant->public_id.'/'.$build->public_id.'/manifest.json';
        Storage::disk('local')->assertExists($expectedPath);
        $manifest = json_decode(Storage::disk('local')->get($expectedPath), true, flags: JSON_THROW_ON_ERROR);
        $this->assertSame($restaurant->public_id, $manifest['restaurant_id']);
        $this->assertSame('configuration_ready', $build->fresh()->status);
        $this->assertSame($expectedPath, $build->fresh()->artifact_path);
        $this->assertDatabaseHas('app_build_events', ['app_build_id' => $build->getKey(), 'event' => 'build.configuration_ready']);
        $this->assertDatabaseHas('app_build_artifacts', [
            'app_build_id' => $build->getKey(), 'restaurant_id' => $restaurant->getKey(),
            'kind' => 'manifest', 'path' => $expectedPath,
        ]);
    }

    public function test_build_job_rejects_mismatched_restaurant_context(): void
    {
        Storage::fake('local');
        $restaurantA = $this->restaurant('build-a');
        $restaurantB = $this->restaurant('build-b');
        $build = AppBuild::query()->create([
            'restaurant_id' => $restaurantA->getKey(),
            'platform' => 'ios',
            'status' => 'queued',
            'configuration' => ['app_name' => 'Private Build'],
        ]);

        $this->expectException(ModelNotFoundException::class);
        (new PrepareAppBuild($build->getKey(), $restaurantB->getKey()))->handle();
    }

    public function test_external_compiler_submission_and_signed_callback_verify_the_tenant_artifact(): void
    {
        Storage::fake('local');
        $secret = 'compiler-test-secret-'.Str::random(24);
        config()->set('vondo.build_compiler', [
            'url' => 'https://compiler.example.test/v1/jobs',
            'secret_ref' => $secret,
            'callback_url' => 'https://vondo.example.test/api/v1/builds/callback',
            'timeout_seconds' => 10,
            'callback_tolerance_seconds' => 300,
        ]);
        Http::fake([
            'compiler.example.test/*' => Http::response(['job_id' => 'compiler-job-123'], 202),
        ]);
        $restaurant = $this->restaurant('external-compiler');
        $build = AppBuild::query()->create([
            'restaurant_id' => $restaurant->getKey(), 'platform' => 'android', 'status' => 'queued',
            'configuration' => ['app_name' => 'Signed Tenant App', 'bundle_id' => 'com.vondo.signed'],
        ]);

        (new PrepareAppBuild($build->getKey(), $restaurant->getKey()))->handle();
        $build->refresh();
        $this->assertSame('submitted', $build->status);
        $this->assertSame('compiler-job-123', $build->external_job_id);
        $manifest = json_decode(Storage::disk('local')->get($build->artifact_path), true, flags: JSON_THROW_ON_ERROR);
        $this->assertSame($restaurant->public_id, $manifest['dart_defines']['VONDO_RESTAURANT']);
        $this->assertSame($restaurant->domains()->value('host'), $manifest['dart_defines']['VONDO_APP_HOST']);
        $this->assertSame('vondo-'.$restaurant->slug, $manifest['configuration']['url_scheme']);
        Http::assertSent(fn($request) => $request->url() === 'https://compiler.example.test/v1/jobs'
            && str_starts_with((string) $request->header('X-Vondo-Signature')[0], 'sha256=')
            && $request['job']['restaurant_id'] === $restaurant->public_id);

        $artifactPath = 'builds/'.$restaurant->public_id.'/'.$build->public_id.'/app-release.aab';
        $artifactContents = 'verified signed artifact';
        Storage::disk('local')->put($artifactPath, $artifactContents);
        $payload = [
            'build_id' => $build->public_id, 'job_id' => 'compiler-job-123', 'status' => 'succeeded',
            'message' => 'Compilation and signing completed.',
            'artifact' => [
                'kind' => 'aab', 'disk' => 'local', 'path' => $artifactPath,
                'size_bytes' => strlen($artifactContents), 'sha256' => hash('sha256', $artifactContents),
            ],
            'identity' => ['package_name' => 'com.vondo.signed', 'sha256_cert_fingerprints' => [
                'AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA',
            ]],
        ];
        $raw = json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
        $timestamp = (string) now()->timestamp;
        $signature = 'sha256='.hash_hmac('sha256', $timestamp.'.'.$raw, $secret);

        $this->call('POST', '/api/v1/builds/callback', [], [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json',
            'HTTP_X_VONDO_TIMESTAMP' => $timestamp, 'HTTP_X_VONDO_SIGNATURE' => 'sha256=invalid',
        ], $raw)->assertUnauthorized();
        $this->call('POST', '/api/v1/builds/callback', [], [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json',
            'HTTP_X_VONDO_TIMESTAMP' => $timestamp, 'HTTP_X_VONDO_SIGNATURE' => $signature,
        ], $raw)->assertOk()->assertJsonPath('data.status', 'succeeded');
        $this->assertSame('com.vondo.signed', $build->fresh()->configuration['mobile_identity']['package_name']);
        $this->call('POST', '/api/v1/builds/callback', [], [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json',
            'HTTP_X_VONDO_TIMESTAMP' => $timestamp, 'HTTP_X_VONDO_SIGNATURE' => $signature,
        ], $raw)->assertOk()->assertJsonPath('data.status', 'succeeded');

        $this->assertDatabaseHas('app_build_artifacts', [
            'app_build_id' => $build->getKey(), 'restaurant_id' => $restaurant->getKey(),
            'kind' => 'aab', 'path' => $artifactPath, 'sha256' => hash('sha256', $artifactContents),
        ]);
        $this->assertSame(1, $build->artifacts()->where('path', $artifactPath)->count());
    }

    public function test_build_failures_are_logged_notified_and_expired_artifacts_are_pruned(): void
    {
        Notification::fake();
        Storage::fake('local');
        $restaurant = $this->restaurant('build-failure');
        $owner = \Igniter\User\Models\User::query()->where('email', 'owner@vondo.local')->firstOrFail();
        $build = AppBuild::query()->create([
            'restaurant_id' => $restaurant->getKey(), 'platform' => 'android', 'status' => 'preparing',
            'configuration' => ['app_name' => 'Failure Test'], 'requested_by' => $owner->getKey(),
        ]);
        (new PrepareAppBuild($build->getKey(), $restaurant->getKey()))->failed(new \RuntimeException('Compiler unavailable'));

        $this->assertSame('failed', $build->fresh()->status);
        $this->assertDatabaseHas('app_build_events', ['app_build_id' => $build->getKey(), 'event' => 'build.failed', 'level' => 'error']);
        Notification::assertSentTo($owner, AppBuildFailed::class);

        $path = 'builds/'.$restaurant->public_id.'/'.$build->public_id.'/expired.txt';
        Storage::disk('local')->put($path, 'expired');
        $build->artifacts()->create([
            'restaurant_id' => $restaurant->getKey(), 'kind' => 'log', 'disk' => 'local', 'path' => $path,
            'size_bytes' => 7, 'sha256' => hash('sha256', 'expired'), 'expires_at' => now()->subMinute(),
        ]);
        $this->artisan('vondo:prune-build-artifacts')->assertSuccessful();
        Storage::disk('local')->assertMissing($path);
        $this->assertDatabaseMissing('app_build_artifacts', ['path' => $path]);
    }

    public function test_same_idempotency_key_is_independent_between_restaurants(): void
    {
        $restaurantA = $this->restaurant('idempotency-a');
        $restaurantB = $this->restaurant('idempotency-b');
        $request = Request::create('/test', 'POST', ['value' => 42]);
        $request->headers->set('Idempotency-Key', 'shared-isolation-key');

        $contextA = new TenantContext;
        $contextA->set($restaurantA);
        $responseA = (new IdempotentRequest($contextA))->run($request, 'isolation.test', fn() => [['tenant' => 'A'], 201]);
        $contextB = new TenantContext;
        $contextB->set($restaurantB);
        $responseB = (new IdempotentRequest($contextB))->run($request, 'isolation.test', fn() => [['tenant' => 'B'], 201]);

        $this->assertSame('A', $responseA->getData(true)['tenant']);
        $this->assertSame('B', $responseB->getData(true)['tenant']);
        $this->assertSame(2, PlatformIdempotencyKey::query()->where('operation', 'isolation.test')->count());
    }

    public function test_rate_limit_keys_are_partitioned_by_restaurant(): void
    {
        $restaurantA = $this->restaurant('rate-a');
        $restaurantB = $this->restaurant('rate-b');
        $request = Request::create('/api/v1/storefront/bootstrap', 'GET', server: ['REMOTE_ADDR' => '203.0.113.10']);
        $context = app(TenantContext::class);
        $context->set($restaurantA);
        $keyA = app(TenantRateLimitKey::class)->for($request);
        $context->set($restaurantB);
        $keyB = app(TenantRateLimitKey::class)->for($request);
        $context->clear();

        $this->assertNotSame($keyA, $keyB);
        $this->assertStringContainsString('restaurant:'.$restaurantA->getKey(), $keyA);
        $this->assertStringContainsString('restaurant:'.$restaurantB->getKey(), $keyB);
    }

    public function test_secondary_tenant_models_are_scoped_and_auto_owned(): void
    {
        $restaurantA = $this->restaurant('secondary-a');
        $restaurantB = $this->restaurant('secondary-b');
        $source = Coupon::query()->withoutGlobalScopes()->firstOrFail();
        $couponA = $source->replicate();
        $couponA->forceFill([
            'restaurant_id' => $restaurantA->getKey(),
            'name' => 'Tenant A coupon',
            'code' => 'A'.Str::upper(Str::random(10)),
        ])->save();
        $couponB = $source->replicate();
        $couponB->forceFill([
            'restaurant_id' => $restaurantB->getKey(),
            'name' => 'Tenant B coupon',
            'code' => 'B'.Str::upper(Str::random(10)),
        ])->save();
        $sourceOrderMenu = OrderMenu::withoutGlobalScopes()->firstOrFail();

        $context = app(TenantContext::class);
        $context->set($restaurantA);

        try {
            $this->assertNotNull(Coupon::query()->find($couponA->getKey()));
            $this->assertNull(Coupon::query()->find($couponB->getKey()));

            $autoOwned = $source->replicate();
            $autoOwned->offsetUnset('restaurant_id');
            $autoOwned->forceFill([
                'name' => 'Automatically owned coupon',
                'code' => 'AUTO'.Str::upper(Str::random(8)),
            ])->save();
            $this->assertSame($restaurantA->getKey(), (int)$autoOwned->restaurant_id);

            $foreignOrderMenu = $sourceOrderMenu->replicate();
            $foreignOrderMenu->forceFill(['restaurant_id' => $restaurantB->getKey()])->save();
            $this->assertNull(OrderMenu::query()->find($foreignOrderMenu->getKey()));
            $this->assertNotNull(OrderMenu::withoutGlobalScopes()->find($foreignOrderMenu->getKey()));

            $autoOwnedOrderMenu = $sourceOrderMenu->replicate();
            $autoOwnedOrderMenu->offsetUnset('restaurant_id');
            $autoOwnedOrderMenu->save();
            $this->assertSame($restaurantA->getKey(), (int)$autoOwnedOrderMenu->restaurant_id);
        } finally {
            $context->clear();
        }
    }

    public function test_cache_keys_are_partitioned_by_restaurant(): void
    {
        $restaurantA = $this->restaurant('cache-a');
        $restaurantB = $this->restaurant('cache-b');
        $contextA = new TenantContext;
        $contextA->set($restaurantA);
        $contextB = new TenantContext;
        $contextB->set($restaurantB);

        $keyA = (new TenantCache($contextA))->key('published-brand', 3);
        $keyB = (new TenantCache($contextB))->key('published-brand', 3);

        $this->assertNotSame($keyA, $keyB);
        $this->assertStringContainsString(':'.$restaurantA->getKey().':', $keyA);
        $this->assertStringContainsString(':'.$restaurantB->getKey().':', $keyB);
    }

    public function test_owner_onboarding_is_idempotent(): void
    {
        Notification::fake();
        $email = 'onboarding-'.Str::lower(Str::random(10)).'@example.test';
        $key = 'onboarding-'.Str::lower(Str::random(16));
        $payload = [
            'owner_name' => 'Idempotent Owner',
            'restaurant_name' => 'Idempotent Kitchen '.Str::random(5),
            'email' => $email,
            'password' => 'Onboarding!2026',
            'password_confirmation' => 'Onboarding!2026',
            'timezone' => 'UTC',
            'currency_code' => 'USD',
        ];

        $first = $this->withHeader('Idempotency-Key', $key)
            ->postJson('/api/v1/owner/register', $payload)
            ->assertCreated();
        $second = $this->withHeader('Idempotency-Key', $key)
            ->postJson('/api/v1/owner/register', $payload)
            ->assertCreated()
            ->assertHeader('Idempotent-Replay', 'true');

        $this->assertSame($first->json('data.restaurant_id'), $second->json('data.restaurant_id'));
        $this->assertSame(1, \Igniter\User\Models\User::query()->where('email', $email)->count());
        $restaurant = Restaurant::query()->where('public_id', $first->json('data.restaurant_id'))->firstOrFail();
        $this->assertTrue($restaurant->settings()->where('key', 'orders_enabled')->exists());
        $this->assertTrue($restaurant->features()->where('feature', 'online_ordering')->exists());
        $this->assertTrue($restaurant->pages()->where('is_home', true)->whereHas('sections')->exists());
    }

    public function test_owner_email_verification_and_password_recovery_are_tenant_bound(): void
    {
        Notification::fake();
        config()->set('vondo.allow_tenant_header', true);
        $email = 'account-'.Str::lower(Str::random(10)).'@example.test';
        $password = 'AccountStart!2026';
        $payload = [
            'owner_name' => 'Account Owner', 'restaurant_name' => 'Account Kitchen '.Str::random(5),
            'email' => $email, 'password' => $password, 'password_confirmation' => $password,
            'timezone' => 'UTC', 'currency_code' => 'USD',
        ];
        $registered = $this->withHeader('Idempotency-Key', 'account-'.Str::lower(Str::random(16)))
            ->postJson('/api/v1/owner/register', $payload)->assertCreated()
            ->assertJsonPath('data.verification_required', true);
        $restaurant = Restaurant::query()->where('public_id', $registered->json('data.restaurant_id'))->firstOrFail();
        $owner = \Igniter\User\Models\User::query()->where('email', $email)->firstOrFail();
        $this->assertFalse((bool) $owner->is_activated);

        $verifyToken = null;
        Notification::assertSentTo($owner, OwnerVerifyEmail::class, function (OwnerVerifyEmail $notification) use (&$verifyToken): bool {
            $verifyToken = $notification->token;
            return true;
        });
        $this->withHeader(config('vondo.tenant_header'), $restaurant->public_id)
            ->postJson('/api/v1/owner/email/verify', ['token' => $verifyToken])->assertOk();

        $login = $this->withHeader(config('vondo.tenant_header'), $restaurant->public_id)
            ->postJson('/api/v1/owner/token', [
                'email' => $email, 'password' => $password, 'device_name' => 'account-security-test',
            ])->assertCreated();

        $this->withHeader(config('vondo.tenant_header'), $restaurant->public_id)
            ->postJson('/api/v1/owner/password/forgot', ['email' => $email])->assertOk();
        $resetToken = null;
        Notification::assertSentTo($owner, OwnerResetPassword::class, function (OwnerResetPassword $notification) use (&$resetToken): bool {
            $resetToken = $notification->token;
            return true;
        });
        $newPassword = 'AccountChanged!2026';
        $this->withHeader(config('vondo.tenant_header'), $restaurant->public_id)
            ->postJson('/api/v1/owner/password/reset', [
                'token' => $resetToken, 'password' => $newPassword, 'password_confirmation' => $newPassword,
            ])->assertOk();
        $this->withHeader(config('vondo.tenant_header'), $restaurant->public_id)
            ->postJson('/api/v1/owner/password/reset', [
                'token' => $resetToken, 'password' => $newPassword, 'password_confirmation' => $newPassword,
            ])->assertUnprocessable();
        $this->withHeader(config('vondo.tenant_header'), $restaurant->public_id)->withToken($login->json('token'))
            ->getJson('/api/v1/owner/bootstrap')->assertForbidden();
        $this->withHeader(config('vondo.tenant_header'), $restaurant->public_id)
            ->postJson('/api/v1/owner/token', [
                'email' => $email, 'password' => $newPassword, 'device_name' => 'account-security-test-new',
            ])->assertCreated();
    }

    public function test_super_admin_reports_are_bounded_and_exportable(): void
    {
        $login = $this->postJson('/api/v1/platform/token', [
            'email' => 'admin@vondo.local', 'password' => 'VondoAdmin!2026',
            'device_name' => 'platform-report-test',
        ])->assertCreated();
        $from = now()->subDays(6)->toDateString();
        $to = now()->toDateString();

        $this->withToken($login->json('token'))->getJson('/api/v1/platform/reports?from='.$from.'&to='.$to)
            ->assertOk()->assertJsonCount(7, 'data')
            ->assertJsonStructure(['data' => [['date', 'orders', 'revenue', 'reservations', 'new_restaurants']], 'meta']);
        $this->withToken($login->json('token'))->get('/api/v1/platform/reports/export?from='.$from.'&to='.$to)
            ->assertOk()->assertHeader('Content-Type', 'text/csv; charset=UTF-8')
            ->assertDownload('vondo-platform-report-'.$from.'-'.$to.'.csv');
        $this->withToken($login->json('token'))->getJson('/api/v1/platform/reports?from=2024-01-01&to=2026-01-01')
            ->assertUnprocessable();
    }

    public function test_owner_can_create_tenant_role_and_send_single_use_staff_invitation(): void
    {
        Notification::fake();
        config()->set('vondo.allow_tenant_header', true);
        $owner = \Igniter\User\Models\User::query()->where('email', 'owner@vondo.local')->firstOrFail();
        $membership = \App\Platform\Models\RestaurantMembership::query()->with('restaurant')
            ->where('user_id', $owner->getKey())->where('role', 'owner')->firstOrFail();
        $restaurant = $membership->restaurant;
        $locationId = \Igniter\Local\Models\Location::query()->where('restaurant_id', $restaurant->getKey())->value('location_id');
        $login = $this->withHeader(config('vondo.tenant_header'), $restaurant->public_id)
            ->postJson('/api/v1/owner/token', [
                'email' => 'owner@vondo.local', 'password' => 'RestaurantOwner!2026', 'device_name' => 'team-access-test',
            ])->assertCreated();
        $token = $login->json('token');

        $role = $this->withHeader(config('vondo.tenant_header'), $restaurant->public_id)->withToken($token)
            ->postJson('/api/v1/owner/team-access/roles', [
                'name' => 'Order lead', 'base_role' => 'staff',
                'permissions' => ['dashboard.view', 'orders.manage'],
            ])->assertCreated()->assertJsonPath('data.permissions.1', 'orders.manage');

        $foreignRestaurant = $this->restaurant('foreign-role');
        $foreignRole = \App\Platform\Models\RestaurantRole::query()->create([
            'restaurant_id' => $foreignRestaurant->getKey(), 'name' => 'Foreign', 'slug' => 'foreign',
            'base_role' => 'staff', 'permissions' => [],
        ]);
        $email = 'invited-'.Str::lower(Str::random(10)).'@example.test';
        $this->withHeader(config('vondo.tenant_header'), $restaurant->public_id)->withToken($token)
            ->postJson('/api/v1/owner/team-access/invitations', [
                'name' => 'Invited Staff', 'email' => $email, 'restaurant_role_id' => $foreignRole->getKey(),
                'location_ids' => [$locationId],
            ])->assertNotFound();

        $invitation = $this->withHeader(config('vondo.tenant_header'), $restaurant->public_id)->withToken($token)
            ->postJson('/api/v1/owner/team-access/invitations', [
                'name' => 'Invited Staff', 'email' => $email, 'restaurant_role_id' => $role->json('data.id'),
                'location_ids' => [$locationId],
            ])->assertCreated();
        $invitationToken = null;
        Notification::assertSentOnDemand(RestaurantStaffInvitation::class, function (RestaurantStaffInvitation $notification) use (&$invitationToken): bool {
            $invitationToken = $notification->token;
            return true;
        });

        $password = 'InvitedStaff!2026';
        $accept = [
            'invitation_id' => $invitation->json('data.id'), 'token' => $invitationToken,
            'password' => $password, 'password_confirmation' => $password,
        ];
        $this->withHeader(config('vondo.tenant_header'), $restaurant->public_id)
            ->postJson('/api/v1/owner/invitations/accept', $accept)->assertCreated();
        $this->withHeader(config('vondo.tenant_header'), $restaurant->public_id)
            ->postJson('/api/v1/owner/invitations/accept', $accept)->assertUnprocessable();
        $invitedUser = \Igniter\User\Models\User::query()->where('email', $email)->firstOrFail();
        $this->assertDatabaseHas('restaurant_memberships', [
            'restaurant_id' => $restaurant->getKey(), 'user_id' => $invitedUser->getKey(),
            'restaurant_role_id' => $role->json('data.id'), 'status' => 'active',
        ]);
        $staffLogin = $this->withHeader(config('vondo.tenant_header'), $restaurant->public_id)
            ->postJson('/api/v1/vendor/token', ['email' => $email, 'password' => $password, 'device_name' => 'invited-test'])
            ->assertCreated();
        $this->app['auth']->forgetGuards();
        $staff = $this->withHeader(config('vondo.tenant_header'), $restaurant->public_id)->withToken($staffLogin->json('token'));
        $staff->getJson('/api/v1/owner/bootstrap')->assertOk();
        $staff->getJson('/api/v1/owner/orders')->assertOk();
        $staff->getJson('/api/v1/owner/reservations')->assertForbidden()
            ->assertJsonPath('message', 'Your restaurant role does not grant this permission.');
        $staff->getJson('/api/v1/owner/brand-revisions')->assertForbidden();
    }

    public function test_super_admin_mfa_supports_totp_replay_protection_and_recovery_codes(): void
    {
        $credentials = ['email' => 'admin@vondo.local', 'password' => 'VondoAdmin!2026', 'device_name' => 'mfa-test'];
        $initial = $this->postJson('/api/v1/platform/token', $credentials)->assertCreated();
        $setup = $this->withToken($initial->json('token'))
            ->postJson('/api/v1/platform/security/mfa/setup', [])->assertCreated();
        $secret = $setup->json('data.secret');
        $recoveryCode = $setup->json('data.recovery_codes.0');
        $code = app(PlatformMfa::class)->codeAt($secret, now()->timestamp);
        $this->withToken($initial->json('token'))
            ->postJson('/api/v1/platform/security/mfa/confirm', ['code' => $code])
            ->assertOk()->assertJsonPath('data.enabled', true);

        $this->postJson('/api/v1/platform/token', $credentials)
            ->assertUnprocessable()->assertJsonValidationErrors('mfa_code');
        $this->postJson('/api/v1/platform/token', [...$credentials, 'mfa_code' => $code])->assertCreated();
        $this->postJson('/api/v1/platform/token', [...$credentials, 'mfa_code' => $code])
            ->assertUnprocessable()->assertJsonValidationErrors('mfa_code');
        $this->postJson('/api/v1/platform/token', [...$credentials, 'mfa_code' => $recoveryCode])->assertCreated();
        $this->postJson('/api/v1/platform/token', [...$credentials, 'mfa_code' => $recoveryCode])
            ->assertUnprocessable()->assertJsonValidationErrors('mfa_code');
    }

    public function test_super_admin_can_inspect_cancel_and_retry_build_history(): void
    {
        Queue::fake();
        $restaurant = $this->restaurant('platform-build');
        $build = AppBuild::query()->create([
            'restaurant_id' => $restaurant->getKey(), 'platform' => 'ios', 'status' => 'queued',
            'configuration' => ['app_name' => 'History Test'],
        ]);
        $build->recordEvent('build.queued', 'Queued for test.');
        $login = $this->postJson('/api/v1/platform/token', [
            'email' => 'admin@vondo.local', 'password' => 'VondoAdmin!2026', 'device_name' => 'build-history-test',
        ])->assertCreated();
        $token = $login->json('token');

        $this->withToken($token)->getJson('/api/v1/platform/app-builds/'.$build->public_id)
            ->assertOk()->assertJsonPath('data.events.0.event', 'build.queued');
        $this->withToken($token)->postJson('/api/v1/platform/app-builds/'.$build->public_id.'/cancel', ['reason' => 'Test cancellation'])
            ->assertOk()->assertJsonPath('data.status', 'cancelled');
        $this->withToken($token)->postJson('/api/v1/platform/app-builds/'.$build->public_id.'/retry', ['reason' => 'Test retry'])
            ->assertAccepted()->assertJsonPath('data.status', 'queued');
        Queue::assertPushed(PrepareAppBuild::class, fn(PrepareAppBuild $job) => $job->buildId === $build->getKey() && $job->restaurantId === $restaurant->getKey());
        $this->assertDatabaseHas('platform_audit_logs', [
            'restaurant_id' => $restaurant->getKey(), 'action' => 'app_build.retried_by_platform',
        ]);
    }

    private function restaurant(string $prefix): Restaurant
    {
        $restaurant = Restaurant::query()->create([
            'name' => Str::headline($prefix),
            'slug' => $prefix.'-'.Str::lower(Str::random(10)),
            'status' => 'active',
            'timezone' => 'UTC',
            'currency_code' => 'USD',
        ]);
        $restaurant->domains()->create(['host' => $restaurant->slug.'.example.test', 'is_primary' => true, 'verified_at' => now()]);
        return $restaurant;
    }
}
