<?php

namespace Database\Seeders;

use App\Platform\Models\Restaurant;
use App\Platform\Models\PlatformAdmin;
use App\Platform\Models\RestaurantSubscription;
use App\Platform\Models\SubscriptionPlan;
use Igniter\Local\Models\Location;
use Igniter\User\Models\User;
use Igniter\User\Models\UserRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class VondoDemoAccountSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $roleId = UserRole::query()->orderBy('user_role_id')->value('user_role_id');
            $restaurant = Restaurant::query()->where('slug', 'default')->firstOrFail();

            PlatformAdmin::query()->updateOrCreate(['email' => 'admin@vondo.local'], [
                'name' => 'Vondo Super Admin', 'password' => Hash::make('VondoAdmin!2026'), 'active' => true,
            ]);

            $user = User::query()->firstOrNew(['email' => 'admin@vondo.local']);
            $user->forceFill([
                'name' => 'Vondo Super Admin',
                'username' => 'vondo_admin',
                'password' => 'VondoAdmin!2026',
                'user_role_id' => $roleId,
                'super_user' => true,
                'status' => true,
                'is_activated' => true,
                'activated_at' => now(),
            ])->save();

            $restaurant->memberships()->updateOrCreate(
                ['user_id' => $user->getKey()],
                ['role' => 'owner', 'status' => 'active'],
            );
            $locationIds = Location::query()->withoutGlobalScopes()->where('restaurant_id', $restaurant->getKey())
                ->pluck('location_id')->all();
            $user->locations()->sync($locationIds);

            $owner = User::query()->firstOrNew(['email' => 'owner@vondo.local']);
            $owner->forceFill([
                'name' => 'Foodly Restaurant Owner', 'username' => 'foodly_owner',
                'password' => 'RestaurantOwner!2026', 'user_role_id' => $roleId,
                'super_user' => false, 'status' => true, 'is_activated' => true, 'activated_at' => now(),
            ])->save();
            $restaurant->memberships()->updateOrCreate(
                ['user_id' => $owner->getKey()], ['role' => 'owner', 'status' => 'active', 'location_ids' => $locationIds],
            );
            $owner->locations()->sync($locationIds);

            $plan = SubscriptionPlan::query()->updateOrCreate(['code' => 'growth'], [
                'name' => 'Growth', 'price_minor' => 4900, 'currency_code' => 'USD', 'active' => true,
                'features' => ['online_ordering', 'reservations', 'custom_domain', 'customer_app', 'vendor_app'],
            ]);
            SubscriptionPlan::query()->updateOrCreate(['code' => 'starter'], [
                'name' => 'Starter', 'price_minor' => 1900, 'currency_code' => 'USD', 'active' => true,
                'features' => ['online_ordering', 'reservations'],
            ]);
            RestaurantSubscription::query()->updateOrCreate(['restaurant_id' => $restaurant->getKey()], [
                'subscription_plan_id' => $plan->getKey(), 'status' => 'active', 'current_period_ends_at' => now()->addMonth(),
            ]);
        });

        $this->command?->info('Vondo accounts seeded: admin@vondo.local and owner@vondo.local');
    }
}
