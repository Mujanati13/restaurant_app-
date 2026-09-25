<?php

namespace App\Platform\Security;

use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Throwable;

/** Verifies Google-issued OpenID Connect ID tokens for customer sign-in. */
class GoogleIdTokenVerifier
{
    private const string JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

    /** @return array<string, mixed> */
    public function verify(string $idToken): array
    {
        $audiences = collect(config('services.google.client_ids', []))
            ->filter(fn($value) => is_string($value) && $value !== '')
            ->values()
            ->all();

        if ($audiences === []) {
            abort(503, 'Google sign-in has not been configured.');
        }

        try {
            $keySet = Cache::remember('google-openid-jwks', now()->addHours(6), fn() => Http::acceptJson()
                ->timeout(5)
                ->get(self::JWKS_URL)
                ->throw()
                ->json());
            $claims = (array) JWT::decode($idToken, JWK::parseKeySet($keySet));
        } catch (Throwable) {
            throw ValidationException::withMessages(['id_token' => ['The Google identity token is invalid or expired.']]);
        }

        $audience = $claims['aud'] ?? null;
        $tokenAudiences = is_array($audience) ? $audience : [$audience];
        if (!array_intersect($audiences, array_filter($tokenAudiences, 'is_string'))
            || !in_array($claims['iss'] ?? null, ['accounts.google.com', 'https://accounts.google.com'], true)
            || empty($claims['sub']) || empty($claims['email']) || !filter_var($claims['email'], FILTER_VALIDATE_EMAIL)
            || ($claims['email_verified'] ?? false) !== true) {
            throw ValidationException::withMessages(['id_token' => ['The Google identity token is not valid for this application.']]);
        }

        return $claims;
    }
}
