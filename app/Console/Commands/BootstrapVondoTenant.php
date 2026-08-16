<?php

namespace App\Console\Commands;

use App\Platform\Branding\BrandConfiguration;
use App\Platform\Models\Restaurant;
use App\Platform\Provisioning\RestaurantDefaults;
use App\Platform\Tenancy\TenantSchemaManager;
use Igniter\User\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class BootstrapVondoTenant extends Command
{
    protected $signature = 'vondo:bootstrap-tenant {--slug= : Slug for the existing installation} {--name= : Restaurant name}';

    protected $description = 'Idempotently adopt the existing single-restaurant installation as the initial Vondo tenant';

    public function handle(RestaurantDefaults $defaults, TenantSchemaManager $schema): int
    {
        if (!Schema::hasTable('restaurants')) {
            $this->error('Run migrations before bootstrapping the initial tenant.');
            return self::FAILURE;
        }

        $schema->ensureOwnershipColumns();
        $slug = (string)($this->option('slug') ?: config('vondo.default_restaurant_slug'));
        $name = (string)($this->option('name') ?: setting('site_name', config('app.name')));
        $restaurant = DB::transaction(function () use ($slug, $name, $defaults): Restaurant {
            $restaurant = Restaurant::query()->firstOrCreate(['slug' => $slug], [
                'name' => $name, 'status' => 'active', 'timezone' => config('app.timezone'),
                'currency_code' => 'USD', 'onboarding_completed_at' => now(),
            ]);
            $baseHost = strtolower((string)config('vondo.base_domain'));
            $restaurant->domains()->firstOrCreate(['host' => $baseHost], ['is_primary' => true, 'verified_at' => now()]);
            $restaurant->brandRevisions()->firstOrCreate(['version' => 1], [
                'configuration' => BrandConfiguration::defaults($restaurant->name), 'published_at' => now(),
            ]);
            $defaults->apply($restaurant);

            foreach (['locations', 'categories', 'menus', 'customers', 'orders', 'reservations'] as $table) {
                if (Schema::hasTable($table) && Schema::hasColumn($table, 'restaurant_id')) {
                    DB::table($table)->whereNull('restaurant_id')->update(['restaurant_id' => $restaurant->getKey()]);
                }
            }

            User::query()->orderBy('user_id')->each(function (User $user) use ($restaurant): void {
                $restaurant->memberships()->firstOrCreate(['user_id' => $user->getKey()], [
                    'role' => $user->isSuperUser() ? 'owner' : 'staff', 'status' => 'active',
                ]);
            });

            return $restaurant;
        });
        $schema->finalize($restaurant->getKey());

        $this->info("Initial tenant ready: {$restaurant->name} ({$restaurant->public_id})");
        foreach (['locations', 'categories', 'menus', 'customers', 'orders', 'reservations'] as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'restaurant_id')) {
                $owned = DB::table($table)->where('restaurant_id', $restaurant->getKey())->count();
                $unowned = DB::table($table)->whereNull('restaurant_id')->count();
                $this->line("{$table}: {$owned} owned, {$unowned} unowned");
            }
        }

        return self::SUCCESS;
    }
}
