<?php

namespace Tests\Feature;

use App\Jobs\ProvisionDomainTls;
use App\Jobs\RecordQueueHeartbeat;
use App\Jobs\SendTenantPush;
use App\Platform\Domains\DomainVerifier;
use App\Platform\Models\PlatformTemplate;
use App\Platform\Models\MobilePushSubscription;
use App\Platform\Models\Restaurant;
use App\Platform\Models\RestaurantDomain;
use App\Platform\Models\SupportImpersonation;
use App\Platform\Monitoring\PlatformHealth;
use App\Platform\Secrets\SecretResolver;
use App\Platform\Tenancy\TenantSchemaManager;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PlatformCompletionTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(ThrottleRequests::class);
        config()->set('vondo.allow_tenant_header', true);
    }

    public function test_super_admin_manages_validated_default_templates(): void
    {
        $token = $this->platformToken();
        $configuration = \App\Platform\Branding\BrandConfiguration::defaults('Template Kitchen');
        $created = $this->withToken($token)->postJson('/api/v1/platform/templates', [
            'code' => 'completion-template', 'name' => 'Completion Template', 'description' => 'Verified template',
            'configuration' => $configuration, 'active' => true, 'is_default' => true,
        ])->assertCreated()->assertJsonPath('data.is_default', true);
        $this->assertDatabaseHas('platform_templates', ['code' => 'completion-template', 'active' => true, 'is_default' => true]);
        $this->assertSame(1, PlatformTemplate::query()->where('is_default', true)->count());

        $configuration['theme']['primary'] = 'javascript:alert(1)';
        $this->withToken($token)->putJson('/api/v1/platform/templates/'.$created->json('data.id'), [
            'name' => 'Unsafe', 'description' => null, 'configuration' => $configuration, 'active' => true, 'is_default' => true,
        ])->assertUnprocessable()->assertJsonValidationErrors('theme.primary');
    }

    public function test_support_impersonation_is_single_use_tenant_bound_visible_and_audited(): void
    {
        $restaurant = Restaurant::query()->whereHas('memberships', fn($query) => $query->where('status', 'active'))->firstOrFail();
        $token = $this->platformToken();
        $created = $this->withToken($token)->postJson('/api/v1/platform/restaurants/'.$restaurant->public_id.'/support-sessions', [
            'reason' => 'Investigating support ticket VONDO-42', 'duration_minutes' => 15,
        ])->assertCreated();
        $exchange = ['exchange_token' => $created->json('data.exchange_token')];
        $session = $this->withHeader(config('vondo.tenant_header'), $restaurant->public_id)
            ->postJson('/api/v1/owner/support-session/exchange', $exchange)->assertCreated();
        $this->withHeader(config('vondo.tenant_header'), $restaurant->public_id)
            ->postJson('/api/v1/owner/support-session/exchange', $exchange)->assertUnprocessable();
        $this->app['auth']->forgetGuards();
        $this->withHeader(config('vondo.tenant_header'), $restaurant->public_id)->withToken($session->json('token'))
            ->getJson('/api/v1/owner/bootstrap')->assertOk()
            ->assertJsonPath('data.support_impersonation.id', $created->json('data.id'));
        $this->assertDatabaseHas('platform_audit_logs', ['restaurant_id' => $restaurant->getKey(), 'action' => 'support_impersonation.created']);
        $this->assertNotNull(SupportImpersonation::query()->where('public_id', $created->json('data.id'))->value('exchanged_at'));
    }

    public function test_verified_domain_queues_tls_automation(): void
    {
        Queue::fake();
        $restaurant = Restaurant::query()->firstOrFail();
        $domain = RestaurantDomain::query()->create(['restaurant_id' => $restaurant->getKey(), 'host' => 'custom.example.test',
            'verification_token' => 'verification-token-for-completion-test', 'tls_status' => 'pending']);
        Http::fake(['custom.example.test/*' => Http::response('vondo-verification='.$domain->verification_token)]);
        $this->assertTrue(app(DomainVerifier::class)->verify($domain));
        ProvisionDomainTls::dispatch($domain->getKey(), $restaurant->getKey());
        Queue::assertPushed(ProvisionDomainTls::class, fn($job) => $job->domainId === $domain->getKey() && $job->restaurantId === $restaurant->getKey());
    }

    public function test_all_classified_business_tables_enforce_non_null_tenant_ownership(): void
    {
        $classified = collect(app(TenantSchemaManager::class)->ownershipTables())
            ->filter(fn(string $table) => \Illuminate\Support\Facades\Schema::hasTable($table))->values()->all();
        $nullable = DB::table('information_schema.columns')->where('table_schema', DB::getDatabaseName())
            ->where('column_name', 'restaurant_id')->whereIn('table_name', $classified)
            ->where('is_nullable', 'YES')->selectRaw('TABLE_NAME AS tenant_table')->pluck('tenant_table')->all();
        $this->assertSame([], $nullable);
        $present = DB::table('information_schema.columns')->where('table_schema', DB::getDatabaseName())
            ->where('column_name', 'restaurant_id')->whereIn('table_name', $classified)
            ->selectRaw('TABLE_NAME AS tenant_table')->pluck('tenant_table')->all();
        $this->assertEmpty(array_diff($classified, $present), 'Every classified table must expose restaurant_id.');
    }

    public function test_queue_and_storage_health_use_real_heartbeat_and_both_disks(): void
    {
        Storage::fake('health-media');
        Storage::fake('health-builds');
        config()->set('vondo.media_disk', 'health-media');
        config()->set('vondo.build_disk', 'health-builds');
        DB::table('failed_jobs')->delete();
        (new RecordQueueHeartbeat)->handle();
        $snapshot = app(PlatformHealth::class)->snapshot(false, false);
        $this->assertTrue($snapshot['checks']['queue']['ok']);
        $this->assertTrue($snapshot['checks']['object_storage_health-media']['ok']);
        $this->assertTrue($snapshot['checks']['object_storage_health-builds']['ok']);
    }

    public function test_expiring_verified_custom_domain_is_queued_for_tls_renewal(): void
    {
        Queue::fake();
        $restaurant = Restaurant::query()->firstOrFail();
        $domain = RestaurantDomain::query()->create(['restaurant_id' => $restaurant->getKey(), 'host' => 'renewal.example.test',
            'verification_token' => 'renewal-token', 'verified_at' => now(), 'tls_status' => 'active',
            'tls_provisioned_at' => now()->subMonths(2), 'certificate_expires_at' => now()->addDays(7)]);
        $this->assertSame(0, Artisan::call('vondo:renew-domain-tls'));
        Queue::assertPushed(ProvisionDomainTls::class, fn($job) => $job->domainId === $domain->getKey());
        $this->assertSame('queued', $domain->fresh()->tls_status);
    }

    public function test_push_delivery_is_tenant_scoped_signed_and_revokes_invalid_devices(): void
    {
        $restaurant = Restaurant::query()->firstOrFail();
        $other = Restaurant::query()->where($restaurant->getKeyName(), '!=', $restaurant->getKey())->first()
            ?? Restaurant::query()->create(['name' => 'Push Isolation', 'slug' => 'push-isolation', 'status' => 'active', 'timezone' => 'UTC', 'currency_code' => 'USD']);
        $target = MobilePushSubscription::query()->create(['restaurant_id' => $restaurant->getKey(), 'audience' => 'customer', 'principal_id' => 101,
            'platform' => 'android', 'token_hash' => hash('sha256', 'target-device-token-value'), 'token' => 'target-device-token-value', 'topics' => [], 'last_seen_at' => now()]);
        MobilePushSubscription::query()->create(['restaurant_id' => $other->getKey(), 'audience' => 'customer', 'principal_id' => 101,
            'platform' => 'android', 'token_hash' => hash('sha256', 'foreign-device-token-value'), 'token' => 'foreign-device-token-value', 'topics' => [], 'last_seen_at' => now()]);
        config()->set('vondo.push.provider_url', 'https://push.example.test/send');
        config()->set('vondo.push.secret_ref', 'test-push-hmac');
        Http::fake(fn($request) => Http::response(['invalid_device_ids' => [$target->getKey()]], 200));
        (new SendTenantPush($restaurant->getKey(), 'customer', 'Order updated', 'Ready', ['type' => 'order'], 101))
            ->handle(app(SecretResolver::class));
        Http::assertSent(function ($request): bool {
            $devices = $request->data()['devices'] ?? [];
            return count($devices) === 1 && $devices[0]['token'] === 'target-device-token-value'
                && is_string($request->header('X-Vondo-Signature')[0] ?? null);
        });
        $this->assertNotNull($target->fresh()->revoked_at);
    }

    public function test_owner_build_cannot_reference_another_restaurants_secret_namespace(): void
    {
        $restaurant = Restaurant::query()->where('slug', 'default')->firstOrFail();
        $login = $this->withHeader(config('vondo.tenant_header'), $restaurant->public_id)->postJson('/api/v1/owner/token', [
            'email' => 'owner@vondo.local', 'password' => 'RestaurantOwner!2026', 'device_name' => 'secret-namespace-test',
        ])->assertCreated();
        $this->app['auth']->forgetGuards();
        $this->withHeader(config('vondo.tenant_header'), $restaurant->public_id)->withToken($login->json('token'))
            ->postJson('/api/v1/owner/app-builds', ['platform' => 'android', 'app_name' => 'Tenant App',
                'bundle_id' => 'com.vondo.tenantapp', 'signing_secret_ref' => 'secret://restaurant-another-tenant-signing'])
            ->assertUnprocessable()->assertJsonValidationErrors('signing_secret_ref');
    }

    private function platformToken(): string
    {
        return $this->postJson('/api/v1/platform/token', ['email' => 'admin@vondo.local', 'password' => 'VondoAdmin!2026', 'device_name' => 'completion-test'])
            ->assertCreated()->json('token');
    }
}
