<?php

namespace App\Platform\Support;

use App\Platform\Models\RestaurantMembership;
use App\Platform\Tenancy\TenantContext;
use Illuminate\Http\Request;

class RestaurantAccess
{
    public function __construct(private readonly TenantContext $tenant) {}

    public function authorize(Request $request, string $permission): RestaurantMembership
    {
        $membership = RestaurantMembership::query()->with('customRole')
            ->where('restaurant_id', $this->tenant->id())->where('user_id', $request->user()->getKey())
            ->where('status', 'active')->first();
        abort_unless($membership, 403, 'An active restaurant membership is required.');
        if ($membership->role === 'owner') return $membership;
        if (!$membership->customRole && $membership->role === 'manager') return $membership;
        abort_unless(in_array($permission, $membership->customRole?->permissions ?? [], true), 403, 'Your restaurant role does not grant this permission.');

        return $membership;
    }
}
