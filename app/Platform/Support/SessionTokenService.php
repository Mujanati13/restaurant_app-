<?php

namespace App\Platform\Support;

use App\Platform\Models\PlatformRefreshToken;
use Igniter\Api\Models\Token;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use DateTimeInterface;

class SessionTokenService
{
    public function issue(Model $principal, ?int $restaurantId, string $audience, string $name, array $abilities,
        ?DateTimeInterface $expiresAt = null, bool $withRefresh = true, array $accessAttributes = []): array
    {
        $accessMinutes = $audience === 'platform'
            ? (int)config('vondo.platform_access_token_minutes', 15)
            : (int)config('vondo.access_token_minutes', 60);
        $refreshDays = $audience === 'platform'
            ? (int)config('vondo.platform_refresh_token_days', 1)
            : (int)config('vondo.refresh_token_days', 30);

        $access = Token::createToken($principal, $name, $abilities);
        $access->accessToken->forceFill([
            'restaurant_id' => $restaurantId,
            'expires_at' => $expiresAt ?: now()->addMinutes($accessMinutes),
            ...$accessAttributes,
        ])->save();

        $plainRefreshToken = null;
        if ($withRefresh) {
            $plainRefreshToken = Str::random(80);
            PlatformRefreshToken::query()->create([
                'tokenable_type' => $principal->getMorphClass(),
                'tokenable_id' => $principal->getKey(),
                'restaurant_id' => $restaurantId,
                'audience' => $audience,
                'name' => $name,
                'token_hash' => hash('sha256', $plainRefreshToken),
                'abilities' => $abilities,
                'expires_at' => now()->addDays($refreshDays),
            ]);
        }

        return [
            'token' => $access->plainTextToken,
            'refresh_token' => $plainRefreshToken,
            'token_type' => 'Bearer',
            'expires_at' => $access->accessToken->expires_at->toIso8601String(),
        ];
    }

    public function rotate(string $plainToken, string $audience, ?int $restaurantId, callable $authorize): array
    {
        return DB::transaction(function () use ($plainToken, $audience, $restaurantId, $authorize): array {
            $refresh = PlatformRefreshToken::query()
                ->where('token_hash', hash('sha256', $plainToken))
                ->lockForUpdate()
                ->first();

            if (!$refresh || $refresh->audience !== $audience || $refresh->revoked_at
                || $refresh->expires_at->isPast() || (int)($refresh->restaurant_id ?? 0) !== (int)($restaurantId ?? 0)) {
                throw ValidationException::withMessages(['refresh_token' => ['The refresh session is invalid or expired.']]);
            }

            $principal = $refresh->tokenable;
            if (!$principal || !$authorize($principal)) {
                $refresh->forceFill(['revoked_at' => now()])->save();
                throw ValidationException::withMessages(['refresh_token' => ['The refresh session is no longer authorized.']]);
            }

            $refresh->forceFill(['last_used_at' => now(), 'revoked_at' => now()])->save();

            return $this->issue($principal, $restaurantId, $audience, $refresh->name, $refresh->abilities ?? []);
        });
    }
}
