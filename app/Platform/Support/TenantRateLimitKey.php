<?php

namespace App\Platform\Support;

use App\Platform\Tenancy\TenantContext;
use Illuminate\Http\Request;

class TenantRateLimitKey
{
    public function __construct(private readonly TenantContext $tenant) {}

    public function for(Request $request): string
    {
        $restaurantId = $this->tenant->has()
            ? $this->tenant->id()
            : ($request->user()?->restaurant_id ?? 'global');
        $actor = $request->user();
        $identity = $actor
            ? $actor::class.':'.$actor->getAuthIdentifier()
            : 'ip:'.$request->ip();

        return 'restaurant:'.$restaurantId.'|'.$identity;
    }
}
