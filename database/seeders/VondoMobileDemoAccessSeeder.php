<?php

namespace Database\Seeders;

use App\Platform\Models\Restaurant;
use Igniter\Local\Models\Location;
use Igniter\User\Models\Customer;
use Igniter\User\Models\CustomerGroup;
use Igniter\User\Models\User;
use Igniter\User\Models\UserRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Creates only repeatable demo logins for the Flutter customer and vendor apps.
 * It never resets catalogue, orders, or production-like tenant configuration.
 */
class VondoMobileDemoAccessSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $userRoleId = UserRole::query()->orderBy('user_role_id')->value('user_role_id');
            $customerGroupId = CustomerGroup::query()->where('is_default', true)->value('customer_group_id')
                ?? CustomerGroup::query()->value('customer_group_id');

            Restaurant::query()->whereIn('slug', VondoMarketplaceDemoSeeder::SLUGS)->each(function (Restaurant $restaurant) use ($userRoleId, $customerGroupId): void {
                $location = Location::query()->where('restaurant_id', $restaurant->getKey())
                    ->where('location_status', true)->orderByDesc('is_default')->orderBy('location_id')->first();
                if (!$location || !$userRoleId || !$customerGroupId) {
                    return;
                }

                $manager = User::query()->firstOrNew(['email' => "ops-{$restaurant->slug}@vondo.local"]);
                $manager->forceFill([
                    'name' => "{$restaurant->name} Demo Manager",
                    'username' => 'ops_'.str_replace('-', '_', $restaurant->slug),
                    'password' => 'DemoManager!2026',
                    'user_role_id' => $userRoleId,
                    'super_user' => false,
                    'status' => true,
                    'is_activated' => true,
                    'activated_at' => now(),
                ])->save();
                $restaurant->memberships()->updateOrCreate(['user_id' => $manager->getKey()], [
                    'role' => 'manager', 'status' => 'active', 'location_ids' => [$location->getKey()],
                ]);
                $manager->locations()->syncWithoutDetaching([$location->getKey()]);

                $customer = Customer::query()->where('restaurant_id', $restaurant->getKey())
                    ->where('email', "demo-{$restaurant->slug}-1@vondo.local")->first() ?? new Customer;
                $customer->forceFill([
                    'restaurant_id' => $restaurant->getKey(),
                    'first_name' => 'Demo',
                    'last_name' => 'Customer',
                    'email' => "demo-{$restaurant->slug}-1@vondo.local",
                    'telephone' => '+41 44 555 01 01',
                    'password' => 'DemoCustomer!2026',
                    'customer_group_id' => $customerGroupId,
                    'status' => true,
                    'is_activated' => true,
                    'activated_at' => now(),
                ])->save();
            });
        });

        $this->command?->info('Vondo mobile demo logins are ready for every seeded marketplace restaurant.');
    }
}
