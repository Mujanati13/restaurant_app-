<?php

namespace App\Platform\Tenancy;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class TenantSchemaManager
{
    private const ROOT_TABLES = [
        'locations', 'categories', 'menus', 'customers', 'orders', 'reservations',
    ];

    private const SECONDARY_TABLES = [
        'addresses', 'dining_areas', 'dining_sections', 'dining_tables', 'tables',
        'igniter_coupons', 'igniter_coupons_history', 'igniter_reviews',
        'ingredients', 'mealtimes', 'menu_options', 'payment_profiles',
        'igniter_frontend_banners', 'igniter_frontend_sliders', 'igniter_frontend_subscribers',
        'media_attachments', 'notifications', 'assignable_logs', 'status_history',
        'igniter_cart_cart', 'igniter_automation_rules', 'igniter_automation_logs',
        'location_areas', 'location_options', 'location_settings', 'stocks', 'working_hours',
        'order_menus', 'order_menu_options', 'order_totals', 'payment_logs', 'stock_history',
        'reservation_tables', 'ingredientables', 'locationables', 'menu_categories', 'menu_item_options',
        'menu_item_option_values', 'menu_item_option_linked_values', 'menu_mealtimes',
        'menu_option_values', 'menus_specials', 'igniter_coupon_categories',
        'igniter_coupon_customer_groups', 'igniter_coupon_customers', 'igniter_coupon_menus',
    ];

    private const PARENT_PATHS = [
        ['addresses', 'customers', 'customer_id', 'customer_id'],
        ['dining_areas', 'locations', 'location_id', 'location_id'],
        ['dining_sections', 'locations', 'location_id', 'location_id'],
        ['dining_tables', 'dining_areas', 'dining_area_id', 'id'],
        ['igniter_reviews', 'locations', 'location_id', 'location_id'],
        ['payment_profiles', 'customers', 'customer_id', 'customer_id'],
        ['location_areas', 'locations', 'location_id', 'location_id'],
        ['location_options', 'locations', 'location_id', 'location_id'],
        ['location_settings', 'locations', 'location_id', 'location_id'],
        ['stocks', 'locations', 'location_id', 'location_id'],
        ['working_hours', 'locations', 'location_id', 'location_id'],
        ['order_menus', 'orders', 'order_id', 'order_id'],
        ['order_menu_options', 'orders', 'order_id', 'order_id'],
        ['order_totals', 'orders', 'order_id', 'order_id'],
        ['payment_logs', 'orders', 'order_id', 'order_id'],
        ['stock_history', 'orders', 'order_id', 'order_id'],
        ['igniter_coupons_history', 'orders', 'order_id', 'order_id'],
        ['reservation_tables', 'reservations', 'reservation_id', 'reservation_id'],
        ['ingredientables', 'ingredients', 'ingredient_id', 'ingredient_id'],
        ['locationables', 'locations', 'location_id', 'location_id'],
        ['menu_categories', 'menus', 'menu_id', 'menu_id'],
        ['menu_item_options', 'menus', 'menu_id', 'menu_id'],
        ['menu_mealtimes', 'menus', 'menu_id', 'menu_id'],
        ['menus_specials', 'menus', 'menu_id', 'menu_id'],
        ['menu_item_option_values', 'menu_item_options', 'menu_option_id', 'menu_option_id'],
        ['menu_item_option_linked_values', 'menu_item_options', 'menu_option_id', 'menu_option_id'],
        ['menu_option_values', 'menu_options', 'option_id', 'option_id'],
        ['igniter_coupon_categories', 'igniter_coupons', 'coupon_id', 'coupon_id'],
        ['igniter_coupon_customer_groups', 'igniter_coupons', 'coupon_id', 'coupon_id'],
        ['igniter_coupon_customers', 'igniter_coupons', 'coupon_id', 'coupon_id'],
        ['igniter_coupon_menus', 'igniter_coupons', 'coupon_id', 'coupon_id'],
    ];

    public function ensureOwnershipColumns(): void
    {
        foreach ([...self::ROOT_TABLES, ...self::SECONDARY_TABLES, 'igniter_api_access_tokens'] as $tableName) {
            if (!Schema::hasTable($tableName) || Schema::hasColumn($tableName, 'restaurant_id')) {
                continue;
            }
            Schema::table($tableName, function (Blueprint $table): void {
                $table->unsignedBigInteger('restaurant_id')->nullable()->index();
            });
        }
        $this->ensureCustomerEmailUniqueness();
        $this->ensureCompositeIndexes();
    }

    public function finalize(int $initialRestaurantId): array
    {
        $this->ensureOwnershipColumns();
        foreach (self::ROOT_TABLES as $table) {
            if ($this->ownedTable($table)) {
                DB::table($table)->whereNull('restaurant_id')->update(['restaurant_id' => $initialRestaurantId]);
            }
        }
        foreach (self::PARENT_PATHS as [$child, $parent, $childKey, $parentKey]) {
            $this->backfillFrom($child, $parent, $childKey, $parentKey);
        }

        if (DB::table('restaurants')->count() === 1) {
            foreach (self::SECONDARY_TABLES as $table) {
                if ($this->ownedTable($table)) {
                    DB::table($table)->whereNull('restaurant_id')->update(['restaurant_id' => $initialRestaurantId]);
                }
            }
        }

        $report = [];
        foreach ([...self::ROOT_TABLES, ...self::SECONDARY_TABLES] as $table) {
            if (!$this->ownedTable($table)) continue;
            $unowned = DB::table($table)->whereNull('restaurant_id')->count();
            $invalid = DB::table($table.' as child')->leftJoin('restaurants as tenant', 'tenant.id', '=', 'child.restaurant_id')
                ->whereNotNull('child.restaurant_id')->whereNull('tenant.id')->count();
            if ($unowned || $invalid) {
                throw new RuntimeException("Tenant ownership validation failed for {$table}: {$unowned} unowned, {$invalid} invalid.");
            }
            $report[$table] = ['unowned' => 0, 'invalid' => 0];
        }
        foreach (self::PARENT_PATHS as [$child, $parent, $childKey, $parentKey]) {
            if (!$this->ownedTable($child) || !$this->ownedTable($parent)
                || !Schema::hasColumn($child, $childKey) || !Schema::hasColumn($parent, $parentKey)) continue;
            $mismatch = DB::table($child.' as child')->join($parent.' as parent', 'parent.'.$parentKey, '=', 'child.'.$childKey)
                ->whereColumn('child.restaurant_id', '!=', 'parent.restaurant_id')->count();
            if ($mismatch) {
                throw new RuntimeException("Cross-parent tenant mismatch detected for {$child}: {$mismatch} row(s).");
            }
        }

        $this->ensureTenantForeignKeys();
        $this->ensureLocationSettingForeignKey();

        return $report;
    }

    public function enforceNonNullOwnership(): void
    {
        foreach ($this->ownershipTables() as $table) {
            if (!$this->ownedTable($table)) continue;
            $unowned = DB::table($table)->whereNull('restaurant_id')->count();
            if ($unowned) {
                throw new RuntimeException("Cannot enforce tenant ownership for {$table}: {$unowned} unowned row(s).");
            }
            DB::statement("ALTER TABLE `{$table}` MODIFY `restaurant_id` BIGINT UNSIGNED NOT NULL");
        }
    }

    public function allowNullableOwnership(): void
    {
        foreach ($this->ownershipTables() as $table) {
            if ($this->ownedTable($table)) {
                DB::statement("ALTER TABLE `{$table}` MODIFY `restaurant_id` BIGINT UNSIGNED NULL");
            }
        }
    }

    public function ownershipTables(): array
    {
        return [...self::ROOT_TABLES, ...self::SECONDARY_TABLES];
    }

    private function backfillFrom(string $child, string $parent, string $childKey, string $parentKey): void
    {
        if (!$this->ownedTable($child) || !$this->ownedTable($parent)
            || !Schema::hasColumn($child, $childKey) || !Schema::hasColumn($parent, $parentKey)) return;
        DB::statement(sprintf(
            'UPDATE `%s` child JOIN `%s` parent ON parent.`%s` = child.`%s` SET child.`restaurant_id` = parent.`restaurant_id` WHERE child.`restaurant_id` IS NULL AND parent.`restaurant_id` IS NOT NULL',
            $child, $parent, $parentKey, $childKey,
        ));
    }

    private function ensureCustomerEmailUniqueness(): void
    {
        if (!$this->ownedTable('customers') || !Schema::hasColumn('customers', 'email')) return;
        $indexes = collect(DB::select('SHOW INDEX FROM `customers`'))->groupBy(fn($row) => $row->Key_name);
        foreach ($indexes as $name => $rows) {
            $columns = $rows->sortBy('Seq_in_index')->pluck('Column_name')->all();
            if ($name !== 'PRIMARY' && (int)$rows->first()->Non_unique === 0 && $columns === ['email']) {
                DB::statement('ALTER TABLE `customers` DROP INDEX `'.str_replace('`', '``', $name).'`');
            }
        }
        if (!$this->indexExists('customers', 'customers_restaurant_email_unique')) {
            Schema::table('customers', fn(Blueprint $table) => $table->unique(['restaurant_id', 'email'], 'customers_restaurant_email_unique'));
        }
    }

    private function ensureCompositeIndexes(): void
    {
        $indexes = [
            ['locations', 'vondo_location_status_idx', ['restaurant_id', 'location_status']],
            ['categories', 'vondo_category_status_idx', ['restaurant_id', 'status']],
            ['menus', 'vondo_menu_status_idx', ['restaurant_id', 'menu_status']],
            ['orders', 'vondo_order_customer_idx', ['restaurant_id', 'customer_id', 'created_at']],
            ['reservations', 'vondo_res_customer_idx', ['restaurant_id', 'customer_id', 'created_at']],
        ];
        foreach ($indexes as [$tableName, $indexName, $columns]) {
            if (!$this->ownedTable($tableName) || $this->indexExists($tableName, $indexName)
                || collect($columns)->contains(fn($column) => !Schema::hasColumn($tableName, $column))) continue;
            Schema::table($tableName, fn(Blueprint $table) => $table->index($columns, $indexName));
        }
    }

    private function ensureTenantForeignKeys(): void
    {
        foreach ([...self::ROOT_TABLES, ...self::SECONDARY_TABLES, 'igniter_api_access_tokens'] as $tableName) {
            if (!$this->ownedTable($tableName) || $this->foreignExists($tableName, 'restaurant_id')) continue;
            $name = 'vondo_'.substr(hash('sha1', $tableName), 0, 12).'_rid_fk';
            Schema::table($tableName, fn(Blueprint $table) => $table->foreign('restaurant_id', $name)
                ->references('id')->on('restaurants')->cascadeOnDelete());
        }
    }

    private function ensureLocationSettingForeignKey(): void
    {
        if (!Schema::hasTable('restaurant_location_settings') || !Schema::hasTable('locations')
            || $this->foreignExists('restaurant_location_settings', 'location_id')) return;
        Schema::table('restaurant_location_settings', fn(Blueprint $table) => $table->foreign('location_id', 'vondo_location_setting_location_fk')
            ->references('location_id')->on('locations')->cascadeOnDelete());
    }

    private function ownedTable(string $table): bool
    {
        return Schema::hasTable($table) && Schema::hasColumn($table, 'restaurant_id');
    }

    private function indexExists(string $table, string $name): bool
    {
        return DB::table('information_schema.statistics')->where('table_schema', DB::getDatabaseName())
            ->where('table_name', $table)->where('index_name', $name)->exists();
    }

    private function foreignExists(string $table, string $column): bool
    {
        return DB::table('information_schema.key_column_usage')->where('table_schema', DB::getDatabaseName())
            ->where('table_name', $table)->where('column_name', $column)->whereNotNull('referenced_table_name')->exists();
    }

}
