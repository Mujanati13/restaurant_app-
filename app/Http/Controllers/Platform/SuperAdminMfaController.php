<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Models\PlatformAuditLog;
use App\Platform\Models\PlatformMfaCredential;
use App\Platform\Models\PlatformAdmin;
use App\Platform\Support\PlatformMfa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;

class SuperAdminMfaController extends Controller
{
    public function __construct(private readonly PlatformMfa $mfa) {}

    public function show(Request $request): JsonResponse
    {
        $credential = PlatformMfaCredential::query()->where('user_id', $request->user()->getKey())->first();
        return response()->json(['data' => [
            'enabled' => (bool) $credential?->confirmed_at,
            'confirmed_at' => $credential?->confirmed_at?->toIso8601String(),
            'recovery_codes_remaining' => count($credential?->recovery_code_hashes ?? []),
        ]]);
    }

    public function begin(Request $request): JsonResponse
    {
        $result = $this->mfa->begin($request->user());
        $this->audit($request, 'platform.mfa_setup_started');
        unset($result['credential']);
        return response()->json(['data' => $result], 201);
    }

    public function confirm(Request $request): JsonResponse
    {
        $data = $request->validate(['code' => ['required', 'string', 'max:32']]);
        $credential = PlatformMfaCredential::query()->where('user_id', $request->user()->getKey())->firstOrFail();
        abort_unless($this->mfa->verify($credential, $data['code'], false), 422, 'The authentication code is invalid.');
        $credential->update(['confirmed_at' => now(), 'last_counter' => null]);
        $this->audit($request, 'platform.mfa_enabled');
        return $this->show($request);
    }

    public function destroy(Request $request): JsonResponse
    {
        $data = $request->validate(['password' => ['required', 'string'], 'code' => ['required', 'string', 'max:32']]);
        /** @var PlatformAdmin $user */
        $user = $request->user();
        abort_unless(Hash::check($data['password'], $user->password), 422, 'The password is incorrect.');
        $credential = PlatformMfaCredential::query()->where('user_id', $user->getKey())->whereNotNull('confirmed_at')->firstOrFail();
        abort_unless($this->mfa->verify($credential, $data['code']), 422, 'The authentication code is invalid.');
        $credential->delete();
        $this->audit($request, 'platform.mfa_disabled');
        return response()->json([], 204);
    }

    private function audit(Request $request, string $action): void
    {
        PlatformAuditLog::query()->create([
            'restaurant_id' => null, 'actor_type' => 'super_admin', 'actor_id' => $request->user()->getKey(),
            'action' => $action, 'subject_type' => PlatformAdmin::class, 'subject_id' => (string) $request->user()->getKey(),
            'metadata' => [], 'ip_address' => $request->ip(),
        ]);
    }
}
