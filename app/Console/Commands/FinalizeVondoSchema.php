<?php

namespace App\Console\Commands;

use App\Platform\Models\Restaurant;
use App\Platform\Tenancy\TenantSchemaManager;
use Illuminate\Console\Command;

class FinalizeVondoSchema extends Command
{
    protected $signature = 'vondo:finalize-schema {--restaurant= : Existing restaurant slug used for legacy backfill}';
    protected $description = 'Finalize tenant columns, backfills, indexes, and constraints after TastyIgniter package migrations';

    public function handle(TenantSchemaManager $schema): int
    {
        $schema->ensureOwnershipColumns();
        $slug = (string) ($this->option('restaurant') ?: config('vondo.default_restaurant_slug'));
        $restaurant = Restaurant::query()->where('slug', $slug)->first();
        if (!$restaurant) {
            $this->warn('Ownership columns are ready, but no restaurant exists yet. Run vondo:bootstrap-tenant first.');
            return self::FAILURE;
        }
        $report = $schema->finalize($restaurant->getKey());
        $this->info('Tenant schema finalized with zero unresolved ownership rows across '.count($report).' tables.');

        return self::SUCCESS;
    }
}
