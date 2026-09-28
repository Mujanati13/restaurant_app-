<?php

namespace App\Platform\Security;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

/** Verifies Firebase Authentication ID tokens issued after Google sign-in. */
class FirebaseIdTokenVerifier
{
    private const string PUBLIC_KEYS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

    /** @return array<string, mixed> */
    public function verifyGoogleSignIn(string $idToken): array
    {
        $projectId = trim((string) config('services.firebase.project_id'));
        if ($projectId === '') {
            abort(503, 'Firebase Authentication has not been configured.');
        }

        try {
            $certificates = Cache::remember('firebase-auth-public-keys', now()->addHours(6), fn () => Http::acceptJson()
                ->timeout(5)
                ->get(self::PUBLIC_KEYS_URL)
                ->throw()
                ->json());
            $keys = collect($certificates)
                ->filter(fn ($certificate, $keyId) => is_string($keyId) && $keyId !== '' && is_string($certificate) && $certificate !== '')
                ->mapWithKeys(fn (string $certificate, string $keyId) => [$keyId => new Key($certificate, 'RS256')])
                ->all();
            if ($keys === []) {
                throw new RuntimeException('Firebase did not return signing keys.');
            }

            $claims = json_decode(
                json_encode(JWT::decode($idToken, $keys), JSON_THROW_ON_ERROR),
                true,
                512,
                JSON_THROW_ON_ERROR,
            );
            if (! is_array($claims)) {
                throw new RuntimeException('Firebase returned malformed token claims.');
            }
        } catch (Throwable) {
            throw ValidationException::withMessages(['id_token' => ['The Firebase identity token is invalid or expired.']]);
        }

        $firebase = $claims['firebase'] ?? null;
        $authTime = $claims['auth_time'] ?? null;
        if (($claims['aud'] ?? null) !== $projectId
            || ($claims['iss'] ?? null) !== "https://securetoken.google.com/{$projectId}"
            || ! is_string($claims['sub'] ?? null) || trim($claims['sub']) === ''
            || ! is_string($claims['email'] ?? null) || ! filter_var($claims['email'], FILTER_VALIDATE_EMAIL)
            || ($claims['email_verified'] ?? false) !== true
            || ! is_array($firebase) || ($firebase['sign_in_provider'] ?? null) !== 'google.com'
            || ! is_numeric($authTime) || (int) $authTime > now()->timestamp) {
            throw ValidationException::withMessages(['id_token' => ['The Firebase identity token is not valid for this application.']]);
        }

        return $claims;
    }
}
