<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Support\SessionTokenService;
use App\Platform\Support\PlatformMfa;
use App\Platform\Models\PlatformMfaCredential;
use App\Platform\Models\PlatformAdmin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminSessionController extends Controller
{
    public function __construct(private readonly SessionTokenService $tokens, private readonly PlatformMfa $mfa) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email:filter'],
            'password' => ['required', 'string'],
            'device_name' => ['required', 'string', 'max:255'],
            'mfa_code' => ['nullable', 'string', 'max:32'],
        ]);
        $credentials = ['email' => strtolower($data['email']), 'password' => $data['password']];
        $provider = auth('platform')->getProvider();
        /** @var PlatformAdmin|null $user */
        $user = $provider->retrieveByCredentials($credentials);
        if (!$user || !$provider->validateCredentials($user, $credentials)) {
            throw ValidationException::withMessages(['email' => ['The provided credentials are incorrect.']]);
        }
        abort_unless($user->active, 403, 'Super Admin access is disabled.');
        $credential = PlatformMfaCredential::query()->where('user_id', $user->getKey())->whereNotNull('confirmed_at')->first();
        if ($credential) {
            if (blank($data['mfa_code'] ?? null)) {
                throw ValidationException::withMessages(['mfa_code' => ['An authenticator or recovery code is required.']]);
            }
            if (!$this->mfa->verify($credential, $data['mfa_code'])) {
                throw ValidationException::withMessages(['mfa_code' => ['The authentication code is invalid.']]);
            }
        }
        $user->forceFill(['last_login_at' => now()])->save();

        return response()->json($this->tokens->issue(
            $user,
            null,
            'platform',
            $data['device_name'],
            ['platform:*'],
        ), 201);
    }

    public function destroy(Request $request): Response
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->noContent();
    }
}
