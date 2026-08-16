<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Models\PlatformAdmin;
use App\Platform\Models\PlatformAuditLog;
use App\Platform\Models\Restaurant;
use App\Platform\Models\RestaurantMembership;
use App\Platform\Models\SupportImpersonation;
use App\Platform\Support\SessionTokenService;
use App\Platform\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SupportImpersonationController extends Controller
{
    public function create(Request $request, string $publicId): JsonResponse
    {
        $admin = $request->user();
        abort_unless($admin instanceof PlatformAdmin && $admin->active, 403);
        $data = $request->validate(['reason' => ['required', 'string', 'min:10', 'max:500'], 'duration_minutes' => ['required', 'integer', 'between:5,60']]);
        $restaurant = Restaurant::query()->where('public_id', $publicId)->firstOrFail();
        abort_if(in_array($restaurant->status, ['archived'], true), 409, 'Archived restaurants cannot be impersonated.');
        $membership = $restaurant->memberships()->where('status', 'active')->orderByRaw("FIELD(role, 'owner', 'manager', 'staff')")->firstOrFail();
        $plain = Str::random(80);
        $session = SupportImpersonation::query()->create(['platform_admin_id' => $admin->getKey(), 'restaurant_id' => $restaurant->getKey(),
            'restaurant_membership_id' => $membership->getKey(), 'token_hash' => hash('sha256', $plain), 'reason' => $data['reason'],
            'started_ip' => $request->ip(), 'expires_at' => now()->addMinutes($data['duration_minutes'])]);
        $this->audit($request, $admin, $restaurant, 'support_impersonation.created', ['support_session' => $session->public_id, 'reason' => $session->reason, 'expires_at' => $session->expires_at->toIso8601String()]);
        return response()->json(['data' => ['id' => $session->public_id, 'exchange_token' => $plain, 'restaurant_id' => $restaurant->public_id,
            'expires_at' => $session->expires_at->toIso8601String()]], 201);
    }

    public function exchange(Request $request, TenantContext $tenant, SessionTokenService $tokens): JsonResponse
    {
        $data = $request->validate(['exchange_token' => ['required', 'string', 'size:80']]);
        return DB::transaction(function () use ($request, $data, $tenant, $tokens): JsonResponse {
            $session = SupportImpersonation::query()->with(['membership.user', 'administrator'])->where('token_hash', hash('sha256', $data['exchange_token']))->lockForUpdate()->first();
            if (!$session || $session->exchanged_at || $session->ended_at || $session->expires_at->isPast() || $session->restaurant_id !== $tenant->id()) {
                throw ValidationException::withMessages(['exchange_token' => ['This support session is invalid or expired.']]);
            }
            abort_unless($session->administrator?->active && $session->membership?->status === 'active', 403, 'This support session is no longer authorized.');
            $session->forceFill(['exchanged_at' => now()])->save();
            $result = $tokens->issue($session->membership->user, $session->restaurant_id, 'owner', 'Audited support session',
                ['orders:*', 'reservations:*', 'menus:*'], $session->expires_at, false, ['support_impersonation_id' => $session->getKey()]);
            return response()->json([...$result, 'impersonation' => ['id' => $session->public_id, 'reason' => $session->reason,
                'administrator' => $session->administrator->name, 'expires_at' => $session->expires_at->toIso8601String()]], 201);
        });
    }

    public function end(Request $request, string $publicId): JsonResponse
    {
        $admin = $request->user(); abort_unless($admin instanceof PlatformAdmin && $admin->active, 403);
        $data = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $session = SupportImpersonation::query()->with('restaurant')->where('public_id', $publicId)->firstOrFail();
        $session->update(['ended_at' => now()]);
        DB::table('igniter_api_access_tokens')->where('support_impersonation_id', $session->getKey())->delete();
        $this->audit($request, $admin, $session->restaurant, 'support_impersonation.ended', ['support_session' => $session->public_id, 'reason' => $data['reason']]);
        return response()->json([], 204);
    }

    private function audit(Request $request, PlatformAdmin $admin, Restaurant $restaurant, string $action, array $metadata): void
    {
        PlatformAuditLog::query()->create(['restaurant_id' => $restaurant->getKey(), 'actor_type' => 'super_admin', 'actor_id' => $admin->getKey(),
            'action' => $action, 'subject_type' => SupportImpersonation::class, 'subject_id' => $metadata['support_session'], 'metadata' => $metadata, 'ip_address' => $request->ip()]);
    }
}
