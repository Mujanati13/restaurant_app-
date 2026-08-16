<?php

use App\Platform\Tenancy\TenantSchemaManager;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        app(TenantSchemaManager::class)->enforceNonNullOwnership();
    }

    public function down(): void
    {
        app(TenantSchemaManager::class)->allowNullableOwnership();
    }
};
