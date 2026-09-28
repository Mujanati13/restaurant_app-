<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('orders') || Schema::hasColumn('orders', 'confirmation_due_at')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table): void {
            $table->timestamp('confirmation_due_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('confirmation_expired_at')->nullable();
            $table->index(['confirmation_due_at', 'confirmed_at', 'cancelled_at']);
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('orders') || !Schema::hasColumn('orders', 'confirmation_due_at')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table): void {
            $table->dropIndex(['confirmation_due_at', 'confirmed_at', 'cancelled_at']);
            $table->dropColumn(['confirmation_due_at', 'confirmed_at', 'confirmation_expired_at']);
        });
    }
};
