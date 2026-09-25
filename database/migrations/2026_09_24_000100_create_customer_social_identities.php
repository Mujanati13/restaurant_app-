<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_social_identities', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            // TastyIgniter customer tables use customer_id rather than Laravel's id.
            $table->unsignedBigInteger('customer_id')->index();
            $table->string('provider', 24);
            $table->string('provider_subject', 255);
            $table->string('email', 191);
            $table->timestamps();

            $table->unique(['restaurant_id', 'provider', 'provider_subject'], 'customer_social_provider_subject_unique');
            $table->index(['restaurant_id', 'customer_id'], 'customer_social_customer_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_social_identities');
    }
};
