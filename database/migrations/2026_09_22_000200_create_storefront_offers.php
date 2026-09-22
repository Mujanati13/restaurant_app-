<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('storefront_offers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('code', 40);
            $table->enum('type', ['percent', 'fixed']);
            $table->decimal('amount', 10, 2);
            $table->decimal('minimum_order', 10, 2)->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->unique(['restaurant_id', 'code']);
            $table->index(['restaurant_id', 'active', 'starts_at', 'ends_at']);
        });
    }
    public function down(): void { Schema::dropIfExists('storefront_offers'); }
};
