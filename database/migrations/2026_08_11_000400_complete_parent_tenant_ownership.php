<?php

use App\Platform\Models\Restaurant;
use App\Platform\Tenancy\TenantSchemaManager;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $restaurant = Restaurant::query()->where('slug', 'default')->first()
            ?? Restaurant::query()->orderBy('id')->first();
        if (!$restaurant) {
            throw new \RuntimeException('A restaurant must be provisioned before parent tenant ownership can be enforced.');
        }

        $manager = app(TenantSchemaManager::class);
        $manager->finalize($restaurant->getKey());
        $manager->enforceNonNullOwnership();
    }

    public function down(): void
    {
        // Ownership is deliberately retained on rollback to avoid destroying
        // tenant attribution or reopening cross-tenant pivot writes.
    }
};
