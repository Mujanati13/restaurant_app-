<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('storefront_favorites', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('menu_id');
            $table->timestamps();
            $table->unique(['restaurant_id', 'customer_id', 'menu_id']);
            $table->index(['restaurant_id', 'customer_id']);
        });
        Schema::create('storefront_reviews', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('order_id');
            $table->unsignedTinyInteger('rating');
            $table->string('comment', 500)->nullable();
            $table->timestamps();
            $table->unique(['restaurant_id', 'customer_id', 'order_id']);
            $table->index(['restaurant_id', 'rating']);
        });
        if (Schema::hasTable('orders') && !Schema::hasColumn('orders', 'cancelled_at')) {
            Schema::table('orders', function (Blueprint $table): void {
                $table->timestamp('cancelled_at')->nullable()->index();
                $table->string('cancel_reason', 300)->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'cancelled_at')) {
            Schema::table('orders', function (Blueprint $table): void { $table->dropColumn(['cancelled_at', 'cancel_reason']); });
        }
        Schema::dropIfExists('storefront_reviews');
        Schema::dropIfExists('storefront_favorites');
    }
};
