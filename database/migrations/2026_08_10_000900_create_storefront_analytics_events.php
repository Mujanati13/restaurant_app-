<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('storefront_analytics_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->uuid('session_id');
            $table->string('event', 40);
            $table->string('path', 200)->nullable();
            $table->json('properties')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamp('created_at')->useCurrent();
            $table->index(['restaurant_id', 'event', 'occurred_at'], 'analytics_tenant_event_time');
            $table->index(['restaurant_id', 'session_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('storefront_analytics_events');
    }
};
