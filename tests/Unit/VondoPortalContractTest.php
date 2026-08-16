<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class VondoPortalContractTest extends TestCase
{
    public function test_owner_workspace_exposes_operational_navigation(): void
    {
        $script = file_get_contents(__DIR__.'/../../public/vondo-admin/app.js');

        foreach (['Dashboard', 'Orders', 'Reservations', 'Menu availability', 'Customers', 'Locations', 'Team', 'Brand & storefront', 'Subscription', 'App builds'] as $label) {
            $this->assertStringContainsString($label, $script);
        }
        $this->assertStringContainsString('/api/v1/owner/orders', $script);
        $this->assertStringContainsString('/api/v1/owner/team', $script);
        $this->assertStringContainsString('/api/v1/owner/menus', $script);
    }

    public function test_super_admin_workspace_uses_dedicated_scoped_session(): void
    {
        $script = file_get_contents(__DIR__.'/../../public/vondo-admin/app.js');
        $routes = file_get_contents(__DIR__.'/../../routes/api.php');

        $this->assertStringContainsString('/api/v1/platform/token', $script);
        $this->assertStringContainsString("'platform.admin'", $routes);
        $this->assertStringContainsString("Route::post('restaurants'", $routes);
        $this->assertStringContainsString("Route::get('audit-logs'", $routes);
        $this->assertStringContainsString("Route::get('subscription-plans'", $routes);
    }
}
