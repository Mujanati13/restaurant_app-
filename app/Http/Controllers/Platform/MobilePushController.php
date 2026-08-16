<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Models\MobilePushSubscription;
use App\Platform\Tenancy\TenantContext;
use Igniter\User\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;

class MobilePushController extends Controller
{
    public function __construct(private readonly TenantContext $tenant) {}

    public function store(Request $request, string $audience): JsonResponse
    {
        $data = $request->validate(['token' => ['required', 'string', 'min:20', 'max:4096'], 'platform' => ['required', Rule::in(['android', 'ios', 'web'])],
            'topics' => ['nullable', 'array', 'max:20'], 'topics.*' => ['string', 'regex:/^[a-z0-9._-]{1,80}$/']]);
        $expected = $audience === 'customer' ? Customer::class : \Igniter\User\Models\User::class;
        abort_unless($request->user() instanceof $expected, 403);
        $hash = hash('sha256', $data['token']);
        $subscription = MobilePushSubscription::query()->updateOrCreate(['token_hash' => $hash], [
            'restaurant_id' => $this->tenant->id(), 'audience' => $audience, 'principal_id' => $request->user()->getKey(),
            'platform' => $data['platform'], 'token' => $data['token'], 'topics' => $data['topics'] ?? [], 'last_seen_at' => now(), 'revoked_at' => null]);
        return response()->json(['data' => ['id' => $subscription->getKey(), 'platform' => $subscription->platform, 'topics' => $subscription->topics]], 201);
    }

    public function destroy(Request $request, string $audience): JsonResponse
    {
        $data = $request->validate(['token' => ['required', 'string', 'max:4096']]);
        MobilePushSubscription::query()->where('restaurant_id', $this->tenant->id())->where('audience', $audience)
            ->where('principal_id', $request->user()->getKey())->where('token_hash', hash('sha256', $data['token']))->update(['revoked_at' => now()]);
        return response()->json([], 204);
    }
}
