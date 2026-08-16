<?php

namespace Tests\Unit;

use App\Platform\Branding\BrandConfiguration;
use PHPUnit\Framework\TestCase;

class BrandConfigurationTest extends TestCase
{
    public function test_defaults_are_safe_public_configuration(): void
    {
        $configuration = BrandConfiguration::defaults('North Kitchen');
        $public = BrandConfiguration::publicPayload($configuration + ['private_key' => 'never expose']);

        $this->assertSame('North Kitchen', $public['identity']['name']);
        $this->assertArrayNotHasKey('private_key', $public);
        $this->assertSame(['identity', 'theme', 'content', 'navigation', 'sections'], array_keys($public));
    }
}
