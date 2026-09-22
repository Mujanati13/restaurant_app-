<?php

namespace App\Console\Commands;

use App\Platform\Models\Restaurant;
use Database\Seeders\VondoMarketplaceDemoSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SeedMarketplaceDemo extends Command
{
    protected $signature = 'vondo:seed-marketplace-demo {--reset : Remove only the named Vondo demo fixtures before seeding}';
    protected $description = 'Seed the deterministic Deliveriano marketplace demo data.';

    public function handle(): int
    {
        if (!app()->environment('local', 'development', 'testing')) {
            $this->error('Marketplace demo fixtures can only be seeded in a local, development, or testing environment.');
            return self::FAILURE;
        }
        if ($this->option('reset')) {
            $ids = Restaurant::query()->whereIn('slug', VondoMarketplaceDemoSeeder::SLUGS)->pluck('id');
            DB::transaction(function () use ($ids): void {
                foreach (['order_menu_options', 'order_menus', 'order_totals', 'payment_logs', 'status_history', 'reservation_tables', 'addresses', 'orders', 'reservations', 'customers', 'menus_specials', 'menu_item_option_linked_values', 'menu_item_option_values', 'menu_item_options', 'menu_option_values', 'menu_categories', 'menus', 'menu_options', 'categories', 'locations', 'restaurant_page_sections', 'restaurant_pages', 'restaurant_brand_revisions', 'restaurant_location_settings', 'restaurant_settings', 'restaurant_features', 'restaurant_subscriptions', 'platform_alerts'] as $table) {
                    if (Schema::hasTable($table) && Schema::hasColumn($table, 'restaurant_id')) {
                        DB::table($table)->whereIn('restaurant_id', $ids)->delete();
                    }
                }
                foreach (['storefront_reviews', 'storefront_favorites', 'storefront_offers'] as $table) {
                    if (Schema::hasTable($table)) DB::table($table)->whereIn('restaurant_id', $ids)->delete();
                }
                Restaurant::query()->whereIn('id', $ids)->delete();
            });
            $this->info('Removed only the named Vondo marketplace demo fixtures.');
        }
        $this->call('db:seed', ['--class' => VondoMarketplaceDemoSeeder::class, '--force' => true]);
        return self::SUCCESS;
    }
}
