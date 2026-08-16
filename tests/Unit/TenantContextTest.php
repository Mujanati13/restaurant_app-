<?php

namespace Tests\Unit;

use App\Platform\Models\Restaurant;
use App\Platform\Tenancy\TenantContext;
use LogicException;
use PHPUnit\Framework\TestCase;

class TenantContextTest extends TestCase
{
    public function test_it_requires_an_explicit_restaurant(): void
    {
        $this->expectException(LogicException::class);
        (new TenantContext)->get();
    }

    public function test_it_sets_and_clears_the_current_restaurant(): void
    {
        $restaurant = new Restaurant(['name' => 'North Kitchen']);
        $restaurant->setAttribute('id', 42);
        $context = new TenantContext;
        $context->set($restaurant);

        $this->assertTrue($context->has());
        $this->assertSame(42, $context->id());
        $context->clear();
        $this->assertFalse($context->has());
    }
}
