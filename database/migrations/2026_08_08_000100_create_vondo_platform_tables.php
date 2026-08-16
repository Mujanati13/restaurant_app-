<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurants', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->string('name', 80);
            $table->string('slug', 80)->unique();
            $table->enum('status', ['draft', 'trial', 'active', 'suspended', 'archived'])->default('trial')->index();
            $table->string('timezone', 64)->default('UTC');
            $table->char('currency_code', 3)->default('USD');
            $table->timestamp('onboarding_completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('restaurant_domains', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('host', 253)->unique();
            $table->boolean('is_primary')->default(false);
            $table->string('verification_token', 64)->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            $table->index(['restaurant_id', 'is_primary']);
        });

        Schema::create('restaurant_memberships', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('user_id');
            $table->enum('role', ['owner', 'manager', 'staff'])->default('staff');
            $table->enum('status', ['invited', 'active', 'disabled'])->default('active');
            $table->json('location_ids')->nullable();
            $table->timestamps();
            $table->unique(['restaurant_id', 'user_id']);
            $table->index(['user_id', 'status']);
        });

        Schema::create('restaurant_settings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('key', 120);
            $table->json('value')->nullable();
            $table->timestamps();
            $table->unique(['restaurant_id', 'key']);
        });

        Schema::create('restaurant_features', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('feature', 80);
            $table->boolean('enabled')->default(true);
            $table->json('limits')->nullable();
            $table->timestamps();
            $table->unique(['restaurant_id', 'feature']);
        });

        Schema::create('restaurant_brand_revisions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version');
            $table->json('configuration');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamps();
            $table->unique(['restaurant_id', 'version']);
        });

        Schema::create('restaurant_pages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('slug', 100);
            $table->string('title', 160);
            $table->boolean('is_home')->default(false);
            $table->timestamps();
            $table->unique(['restaurant_id', 'slug']);
        });

        Schema::create('restaurant_page_sections', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_page_id')->constrained()->cascadeOnDelete();
            $table->string('stable_id', 80);
            $table->string('type', 60);
            $table->unsignedSmallInteger('position')->default(0);
            $table->boolean('visible')->default(true);
            $table->json('content')->nullable();
            $table->timestamps();
            $table->unique(['restaurant_page_id', 'stable_id']);
        });

        Schema::create('subscription_plans', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 60)->unique();
            $table->string('name', 100);
            $table->unsignedInteger('price_minor')->default(0);
            $table->char('currency_code', 3)->default('USD');
            $table->json('features')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('restaurant_subscriptions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_plan_id')->constrained()->restrictOnDelete();
            $table->string('status', 30)->default('trial');
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('current_period_ends_at')->nullable();
            $table->timestamps();
            $table->index(['restaurant_id', 'status']);
        });

        Schema::create('app_builds', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->uuid('public_id')->unique();
            $table->enum('platform', ['android', 'ios']);
            $table->string('status', 30)->default('queued')->index();
            $table->json('configuration');
            $table->unsignedBigInteger('requested_by')->nullable();
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->string('artifact_path')->nullable();
            $table->text('failure_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });

        Schema::create('platform_audit_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('actor_type', 30);
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->string('action', 120);
            $table->string('subject_type', 100)->nullable();
            $table->string('subject_id', 80)->nullable();
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['restaurant_id', 'created_at']);
            $table->index(['actor_type', 'actor_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_audit_logs');
        Schema::dropIfExists('app_builds');
        Schema::dropIfExists('restaurant_subscriptions');
        Schema::dropIfExists('subscription_plans');
        Schema::dropIfExists('restaurant_page_sections');
        Schema::dropIfExists('restaurant_pages');
        Schema::dropIfExists('restaurant_brand_revisions');
        Schema::dropIfExists('restaurant_features');
        Schema::dropIfExists('restaurant_settings');
        Schema::dropIfExists('restaurant_memberships');
        Schema::dropIfExists('restaurant_domains');
        Schema::dropIfExists('restaurants');
    }
};
