<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_media_assets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->uuid('public_id')->unique();
            $table->string('kind', 40)->default('branding');
            $table->string('disk', 40);
            $table->string('path', 500);
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size_bytes');
            $table->enum('visibility', ['storefront', 'private'])->default('storefront');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->unique(['disk', 'path']);
            $table->index(['restaurant_id', 'kind', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_media_assets');
    }
};
