<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_build_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('app_build_id')->constrained('app_builds')->cascadeOnDelete();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('level', 20)->default('info');
            $table->string('event', 80);
            $table->text('message');
            $table->json('context')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['restaurant_id', 'created_at']);
        });
        Schema::create('app_build_artifacts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('app_build_id')->constrained('app_builds')->cascadeOnDelete();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 30);
            $table->string('disk', 40);
            $table->string('path', 500);
            $table->unsignedBigInteger('size_bytes');
            $table->char('sha256', 64);
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
            $table->unique(['disk', 'path']);
            $table->index(['restaurant_id', 'kind', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_build_artifacts');
        Schema::dropIfExists('app_build_events');
    }
};
