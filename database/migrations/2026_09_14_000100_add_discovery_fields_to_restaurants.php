<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('restaurants')) {
            Schema::table('restaurants', function (Blueprint $table): void {
                if (!Schema::hasColumn('restaurants', 'discovery_enabled')) {
                    $table->boolean('discovery_enabled')->default(false)->index();
                }
                if (!Schema::hasColumn('restaurants', 'cuisine_tags')) {
                    $table->json('cuisine_tags')->nullable();
                }
                if (!Schema::hasColumn('restaurants', 'listing_description')) {
                    $table->text('listing_description')->nullable();
                }
                if (!Schema::hasColumn('restaurants', 'cover_photo_url')) {
                    $table->string('cover_photo_url', 500)->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('restaurants')) {
            Schema::table('restaurants', function (Blueprint $table): void {
                $columns = [];
                foreach (['discovery_enabled', 'cuisine_tags', 'listing_description', 'cover_photo_url'] as $column) {
                    if (Schema::hasColumn('restaurants', $column)) {
                        $columns[] = $column;
                    }
                }
                if (!empty($columns)) {
                    $table->dropColumn($columns);
                }
            });
        }
    }
};
