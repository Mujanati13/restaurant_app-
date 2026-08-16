<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_user_tokens', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('user_id');
            $table->enum('purpose', ['verify_email', 'reset_password', 'staff_invitation']);
            $table->char('token_hash', 64)->unique();
            $table->timestamp('expires_at')->index();
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
            $table->index(['restaurant_id', 'user_id', 'purpose']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_user_tokens');
    }
};
