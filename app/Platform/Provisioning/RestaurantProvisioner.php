<?php

namespace App\Platform\Provisioning;

use App\Platform\Branding\BrandConfiguration;
use App\Platform\Models\PlatformAuditLog;
use App\Platform\Models\Restaurant;
use App\Platform\Models\PlatformTemplate;
use Igniter\Local\Models\Location;
use Igniter\System\Models\Country;
use Igniter\User\Models\User;
use Igniter\User\Models\UserRole;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RestaurantProvisioner
{
    public function __construct(private readonly RestaurantDefaults $defaults) {}

    public function provision(array $data, ?string $ipAddress = null): Restaurant
    {
        return DB::transaction(function () use ($data, $ipAddress): Restaurant {
            $slug = $this->uniqueSlug($data['restaurant_name']);
            $roleId = UserRole::query()->orderBy('user_role_id')->value('user_role_id');
            abort_if(!$roleId, 503, 'No staff role is configured for restaurant owners.');

            $user = (new User)->register([
                'name' => $data['owner_name'],
                'email' => strtolower($data['email']),
                'username' => $this->uniqueUsername($data['email']),
                'password' => $data['password'],
                'user_role_id' => $roleId,
                'status' => true,
            ], true);
            $requireVerification = (bool) config('vondo.require_email_verification', false);
            $user->forceFill([
                'is_activated' => !$requireVerification,
                'activated_at' => !$requireVerification ? now() : null,
            ])->saveQuietly();

            $restaurant = Restaurant::query()->create([
                'name' => $data['restaurant_name'],
                'slug' => $slug,
                'status' => 'trial',
                'timezone' => $data['timezone'] ?? config('app.timezone'),
                'currency_code' => strtoupper($data['currency_code'] ?? 'USD'),
            ]);
            $host = $slug.'.'.config('vondo.base_domain');
            $restaurant->domains()->create(['host' => strtolower($host), 'is_primary' => true, 'verified_at' => now()]);
            $restaurant->memberships()->create(['user_id' => $user->getKey(), 'role' => 'owner', 'status' => 'active']);
            $template = PlatformTemplate::query()->where('active', true)
                ->when($data['template_code'] ?? null, fn($query, $code) => $query->where('code', $code), fn($query) => $query->where('is_default', true))
                ->first();
            $brandConfiguration = $template?->configuration ?? BrandConfiguration::defaults($restaurant->name);
            $brandConfiguration['identity']['name'] = $restaurant->name;
            $restaurant->brandRevisions()->create([
                'version' => 1,
                'configuration' => $brandConfiguration,
                'created_by' => $user->getKey(),
                'published_at' => now(),
            ]);

            $this->defaults->apply($restaurant);

            $location = Location::query()->create([
                'restaurant_id' => $restaurant->getKey(),
                'location_name' => $data['restaurant_name'],
                'location_email' => strtolower($data['email']),
                'location_country_id' => Country::getDefaultKey(),
                'location_status' => true,
                'is_default' => true,
                'permalink_slug' => $slug,
            ]);
            $user->locations()->syncWithoutDetaching([$location->getKey()]);

            PlatformAuditLog::query()->create([
                'restaurant_id' => $restaurant->getKey(), 'actor_type' => 'owner', 'actor_id' => $user->getKey(),
                'action' => 'restaurant.provisioned', 'subject_type' => Restaurant::class,
                'subject_id' => (string)$restaurant->getKey(), 'metadata' => ['host' => $host, 'template' => $template?->code], 'ip_address' => $ipAddress,
            ]);

            return $restaurant->load('domains');
        });
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::limit(Str::slug($name), 65, '') ?: 'restaurant';
        $slug = $base;
        for ($suffix = 2; Restaurant::query()->where('slug', $slug)->exists(); $suffix++) {
            $slug = $base.'-'.$suffix;
        }
        return $slug;
    }

    private function uniqueUsername(string $email): string
    {
        $base = Str::limit(Str::slug(Str::before($email, '@'), '_'), 24, '') ?: 'owner';
        $username = $base;
        for ($suffix = 2; User::query()->where('username', $username)->exists(); $suffix++) {
            $username = $base.'_'.$suffix;
        }
        return $username;
    }
}
