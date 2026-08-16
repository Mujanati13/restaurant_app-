<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = ['locations', 'categories', 'menus', 'customers', 'orders', 'reservations'];

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

        if (Schema::hasTable('customers')) {
            Schema::table('customers', function (Blueprint $table): void {
                $table->dropUnique(['email']);
                $table->unique(['restaurant_id', 'email'], 'customers_restaurant_email_unique');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('customers')) {
            Schema::table('customers', function (Blueprint $table): void {
                $table->dropUnique('customers_restaurant_email_unique');
                $table->unique('email');
            });
        }
        foreach (array_reverse($this->tables) as $tableName) {
            if (!Schema::hasTable($tableName) || !Schema::hasColumn($tableName, 'restaurant_id')) {
                continue;
            }
            Schema::table($tableName, fn(Blueprint $table) => $table->dropColumn('restaurant_id'));
        }
    }
};
