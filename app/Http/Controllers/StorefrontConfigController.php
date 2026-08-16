<?php

namespace App\Http\Controllers;

use App\Platform\Support\TenantSettings;
use App\Platform\Tenancy\TenantContext;
use Igniter\Flame\Currency\Facades\Currency;
use Igniter\System\Models\Country;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class StorefrontConfigController extends Controller
{
    public function __construct(private readonly TenantContext $tenant, private readonly TenantSettings $settings) {}

    /**
     * Return only the public runtime settings the storefront needs to create
     * valid customer orders and reservations.
     */
    public function __invoke(): JsonResponse
    {
        $currency = Currency::getDefault();

        return response()->json([
            'currency' => [
                'code' => $this->tenant->get()->currency_code ?: $currency->currency_code,
                'symbol' => $currency->currency_symbol,
                'symbol_position' => (bool)$currency->symbol_position,
                'decimal_position' => (int)$currency->decimal_position,
            ],
            'default_country_id' => $this->settings->integer('default_country_id', (int) Country::getDefaultKey()),
            'default_order_status_id' => $this->settings->integer('default_order_status_id'),
            'default_reservation_status_id' => $this->settings->integer('default_reservation_status_id'),
        ]);
    }
}
