<?php

namespace Database\Seeders;

use App\Platform\Branding\BrandConfiguration;
use App\Platform\Models\PlatformTemplate;
use Illuminate\Database\Seeder;

class PlatformTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $configuration = BrandConfiguration::defaults('Your Restaurant');
        $configuration['identity']['tagline'] = 'Fresh food, made for your table';
        PlatformTemplate::query()->updateOrCreate(['code' => 'modern-restaurant'], [
            'name' => 'Modern Restaurant',
            'description' => 'Warm, accessible defaults for ordering, reservations, and restaurant storytelling.',
            'configuration' => $configuration,
            'active' => true,
            'is_default' => true,
            'version' => 1,
        ]);
    }
}
