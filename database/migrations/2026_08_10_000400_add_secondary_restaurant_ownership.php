<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = [
        'addresses', 'dining_areas', 'dining_sections', 'dining_tables', 'tables',
        'igniter_coupons', 'igniter_coupons_history', 'igniter_reviews',
        'ingredients', 'mealtimes', 'menu_options', 'payment_profiles',
        'igniter_frontend_banners', 'igniter_frontend_sliders', 'igniter_frontend_subscribers',
        'media_attachments', 'notifications', 'assignable_logs', 'status_history',
        'igniter_cart_cart', 'igniter_automation_rules', 'igniter_automation_logs',
        'location_areas', 'location_options', 'location_settings', 'stocks', 'working_hours',
        'order_menus', 'order_menu_options', 'order_totals', 'payment_logs', 'stock_history',
        'reservation_tables', 'ingredientables', 'menu_categories', 'menu_item_options',
        'menu_item_option_values', 'menu_item_option_linked_values', 'menu_mealtimes',
        'menu_option_values', 'menus_specials', 'igniter_coupon_categories',
        'igniter_coupon_customer_groups', 'igniter_coupon_customers', 'igniter_coupon_menus',
    ];

    public function up(): void
    {
        foreach ($this->tables as $tableName) {
            if (!Schema::hasTable($tableName) || Schema::hasColumn($tableName, 'restaurant_id')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table): void {
                $table->unsignedBigInteger('restaurant_id')->nullable()->index();
            });
        }

        $this->backfillFrom('addresses', 'customers', 'customer_id', 'customer_id');
        $this->backfillFrom('dining_areas', 'locations', 'location_id', 'location_id');
        $this->backfillFrom('dining_sections', 'locations', 'location_id', 'location_id');
        $this->backfillFrom('dining_tables', 'dining_areas', 'dining_area_id', 'id');
        $this->backfillFrom('igniter_reviews', 'locations', 'location_id', 'location_id');
        $this->backfillFrom('payment_profiles', 'customers', 'customer_id', 'customer_id');

        foreach (['location_areas', 'location_options', 'location_settings', 'stocks', 'working_hours'] as $table) {
            $this->backfillFrom($table, 'locations', 'location_id', 'location_id');
        }

        foreach (['order_menus', 'order_menu_options', 'order_totals', 'payment_logs', 'stock_history'] as $table) {
            $this->backfillFrom($table, 'orders', 'order_id', 'order_id');
        }

        $this->backfillFrom('reservation_tables', 'reservations', 'reservation_id', 'reservation_id');

        foreach (['menu_categories', 'menu_item_options', 'menu_mealtimes', 'menus_specials'] as $table) {
            $this->backfillFrom($table, 'menus', 'menu_id', 'menu_id');
        }

        foreach (['menu_item_option_values', 'menu_item_option_linked_values'] as $table) {
            $this->backfillFrom($table, 'menu_item_options', 'menu_option_id', 'menu_option_id');
        }

        $this->backfillFrom('menu_option_values', 'menu_options', 'option_id', 'option_id');

        foreach (['igniter_coupon_categories', 'igniter_coupon_customer_groups', 'igniter_coupon_customers', 'igniter_coupon_menus'] as $table) {
            $this->backfillFrom($table, 'igniter_coupons', 'coupon_id', 'coupon_id');
        }

        // All records predating Vondo came from the verified initial single-restaurant
        // installation. Rows that cannot be derived through a trusted parent are
        // assigned only to that explicitly provisioned migration target.
        $initialRestaurantId = DB::table('restaurants')->where('slug', 'default')->value('id')
            ?? DB::table('restaurants')->orderBy('id')->value('id');

        if ($initialRestaurantId) {
            foreach ($this->tables as $tableName) {
                if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'restaurant_id')) {
                    DB::table($tableName)->whereNull('restaurant_id')->update(['restaurant_id' => $initialRestaurantId]);
                }
            }
        }
    }

    public function down(): void
    {
        foreach (array_reverse($this->tables) as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'restaurant_id')) {
                Schema::table($tableName, fn(Blueprint $table) => $table->dropColumn('restaurant_id'));
            }
        }
    }

    private function backfillFrom(string $child, string $parent, string $childKey, string $parentKey): void
    {
        if (!Schema::hasTable($child) || !Schema::hasTable($parent)
            || !Schema::hasColumn($child, 'restaurant_id') || !Schema::hasColumn($parent, 'restaurant_id')
            || !Schema::hasColumn($child, $childKey) || !Schema::hasColumn($parent, $parentKey)) {
            return;
        }

        DB::statement(sprintf(
            'UPDATE `%s` child JOIN `%s` parent ON parent.`%s` = child.`%s` '
            .'SET child.`restaurant_id` = parent.`restaurant_id` '
            .'WHERE child.`restaurant_id` IS NULL AND parent.`restaurant_id` IS NOT NULL',
            $child,
            $parent,
            $parentKey,
            $childKey,
        ));
    }
};
