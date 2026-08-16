<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_templates', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->string('code', 80)->unique();
            $table->string('name', 120);
            $table->text('description')->nullable();
            $table->json('configuration');
            $table->boolean('active')->default(true)->index();
            $table->boolean('is_default')->default(false)->index();
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
        });

        Schema::create('support_impersonations', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->foreignId('platform_admin_id')->constrained('platform_admins')->cascadeOnDelete();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('restaurant_membership_id')->constrained('restaurant_memberships')->cascadeOnDelete();
            $table->string('token_hash', 64)->unique();
            $table->string('reason', 500);
            $table->string('started_ip', 45)->nullable();
            $table->timestamp('expires_at')->index();
            $table->timestamp('exchanged_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
            $table->index(['restaurant_id', 'ended_at']);
        });

        Schema::create('platform_alerts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('fingerprint', 64)->unique();
            $table->string('type', 60)->index();
            $table->enum('severity', ['info', 'warning', 'critical'])->index();
            $table->enum('status', ['open', 'acknowledged', 'resolved'])->default('open')->index();
            $table->string('message', 500);
            $table->json('context')->nullable();
            $table->timestamp('first_seen_at');
            $table->timestamp('last_seen_at');
            $table->timestamp('acknowledged_at')->nullable();
            $table->foreignId('acknowledged_by')->nullable()->constrained('platform_admins')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->index(['restaurant_id', 'status', 'severity']);
        });

        Schema::create('mobile_push_subscriptions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->enum('audience', ['customer', 'vendor']);
            $table->unsignedBigInteger('principal_id');
            $table->enum('platform', ['android', 'ios', 'web']);
            $table->string('token_hash', 64)->unique();
            $table->text('token');
            $table->json('topics')->nullable();
            $table->timestamp('last_seen_at');
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
            $table->index(['restaurant_id', 'audience', 'principal_id', 'revoked_at'], 'mobile_push_principal_idx');
        });

        Schema::table('restaurant_domains', function (Blueprint $table): void {
            $table->timestamp('verification_checked_at')->nullable()->after('verified_at');
            $table->string('verification_error', 500)->nullable()->after('verification_checked_at');
            $table->string('tls_status', 30)->default('pending')->after('verification_error')->index();
            $table->string('tls_provider', 40)->nullable()->after('tls_status');
            $table->timestamp('tls_provisioned_at')->nullable()->after('tls_provider');
            $table->timestamp('certificate_expires_at')->nullable()->after('tls_provisioned_at');
            $table->string('tls_error', 500)->nullable()->after('certificate_expires_at');
        });

        Schema::table('igniter_api_access_tokens', function (Blueprint $table): void {
            $table->foreignId('support_impersonation_id')->nullable()->after('restaurant_id')
                ->constrained('support_impersonations')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('igniter_api_access_tokens', fn(Blueprint $table) => $table->dropConstrainedForeignId('support_impersonation_id'));
        Schema::table('restaurant_domains', function (Blueprint $table): void {
            $table->dropColumn(['verification_checked_at', 'verification_error', 'tls_status', 'tls_provider',
                'tls_provisioned_at', 'certificate_expires_at', 'tls_error']);
        });
        Schema::dropIfExists('mobile_push_subscriptions');
        Schema::dropIfExists('platform_alerts');
        Schema::dropIfExists('support_impersonations');
        Schema::dropIfExists('platform_templates');
    }
};
