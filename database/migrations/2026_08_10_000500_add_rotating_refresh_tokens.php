<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('igniter_api_access_tokens') && !Schema::hasColumn('igniter_api_access_tokens', 'expires_at')) {
            Schema::table('igniter_api_access_tokens', function (Blueprint $table): void {
                $table->timestamp('expires_at')->nullable()->after('last_used_at')->index();
            });
        }

        if (!Schema::hasTable('platform_refresh_tokens')) {
            Schema::create('platform_refresh_tokens', function (Blueprint $table): void {
                $table->id();
                $table->string('tokenable_type', 64);
                $table->unsignedBigInteger('tokenable_id');
                $table->foreignId('restaurant_id')->nullable()->constrained()->cascadeOnDelete();
                $table->string('audience', 24);
                $table->string('name', 255);
                $table->char('token_hash', 64)->unique();
                $table->json('abilities');
                $table->timestamp('expires_at')->index();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('revoked_at')->nullable()->index();
                $table->timestamps();
                $table->index(['tokenable_type', 'tokenable_id']);
                $table->index(['restaurant_id', 'audience']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_refresh_tokens');
        if (Schema::hasTable('igniter_api_access_tokens') && Schema::hasColumn('igniter_api_access_tokens', 'expires_at')) {
            Schema::table('igniter_api_access_tokens', fn(Blueprint $table) => $table->dropColumn('expires_at'));
        }
    }
};
