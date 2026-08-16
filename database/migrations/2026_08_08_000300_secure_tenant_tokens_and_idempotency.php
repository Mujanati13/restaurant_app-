<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('igniter_api_access_tokens') && !Schema::hasColumn('igniter_api_access_tokens', 'restaurant_id')) {
            Schema::table('igniter_api_access_tokens', function (Blueprint $table): void {
                $table->unsignedBigInteger('restaurant_id')->nullable()->after('tokenable_id')->index();
            });
        }

        Schema::create('platform_idempotency_keys', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('operation', 80);
            $table->string('idempotency_key', 128);
            $table->char('request_hash', 64);
            $table->unsignedSmallInteger('response_status');
            $table->json('response_body');
            $table->timestamp('expires_at')->index();
            $table->timestamps();
            $table->unique(['restaurant_id', 'operation', 'idempotency_key'], 'platform_idempotency_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_idempotency_keys');
        if (Schema::hasTable('igniter_api_access_tokens') && Schema::hasColumn('igniter_api_access_tokens', 'restaurant_id')) {
            Schema::table('igniter_api_access_tokens', fn(Blueprint $table) => $table->dropColumn('restaurant_id'));
        }
    }
};
