<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurant_location_settings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            // The package-owned locations table is installed after Laravel app
            // migrations on a clean system. The FK is added by
            // `vondo:finalize-schema` after `igniter:up` completes.
            $table->unsignedBigInteger('location_id');
            $table->string('key', 120);
            $table->json('value')->nullable();
            $table->timestamps();
            $table->unique(['restaurant_id', 'location_id', 'key'], 'restaurant_location_key_unique');
            $table->index(['location_id', 'key'], 'location_setting_key_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_location_settings');
    }
};
