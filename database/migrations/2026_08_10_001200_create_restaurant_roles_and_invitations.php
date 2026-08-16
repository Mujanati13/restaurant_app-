<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurant_roles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('name', 80);
            $table->string('slug', 80);
            $table->enum('base_role', ['manager', 'staff'])->default('staff');
            $table->json('permissions');
            $table->timestamps();
            $table->unique(['restaurant_id', 'slug']);
        });

        Schema::table('restaurant_memberships', function (Blueprint $table): void {
            $table->foreignId('restaurant_role_id')->nullable()->after('role')
                ->constrained('restaurant_roles')->nullOnDelete();
            $table->index(['restaurant_id', 'restaurant_role_id']);
        });

        Schema::create('restaurant_invitations', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('restaurant_role_id')->nullable()->constrained('restaurant_roles')->nullOnDelete();
            $table->unsignedBigInteger('invited_by');
            $table->string('name', 80);
            $table->string('email', 96);
            $table->enum('base_role', ['manager', 'staff'])->default('staff');
            $table->json('location_ids');
            $table->char('token_hash', 64)->unique();
            $table->enum('status', ['pending', 'accepted', 'cancelled', 'expired'])->default('pending');
            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
            $table->index(['restaurant_id', 'status', 'email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_invitations');
        Schema::table('restaurant_memberships', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('restaurant_role_id');
        });
        Schema::dropIfExists('restaurant_roles');
    }
};
