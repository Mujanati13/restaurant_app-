<?php

namespace App\Platform\Support;

use App\Notifications\OwnerResetPassword;
use App\Notifications\OwnerVerifyEmail;
use App\Platform\Models\PlatformRefreshToken;
use App\Platform\Models\PlatformUserToken;
use App\Platform\Models\Restaurant;
use Igniter\Api\Models\Token;
use Igniter\User\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OwnerAccountSecurity
{
    public function sendVerification(Restaurant $restaurant, User $user): void
    {
        if ($user->is_activated) {
            return;
        }
        $token = $this->issue($restaurant, $user, 'verify_email', now()->addDay());
        $user->notify(new OwnerVerifyEmail($restaurant->public_id, $restaurant->name, $token));
    }

    public function sendPasswordReset(Restaurant $restaurant, User $user): void
    {
        $token = $this->issue($restaurant, $user, 'reset_password', now()->addHour());
        $user->notify(new OwnerResetPassword($restaurant->public_id, $restaurant->name, $token));
    }

    public function verifyEmail(Restaurant $restaurant, string $plainToken): User
    {
        return DB::transaction(function () use ($restaurant, $plainToken): User {
            $record = $this->consume($restaurant, $plainToken, 'verify_email');
            $user = User::query()->findOrFail($record->user_id);
            abort_if($user->is_activated, 409, 'This email address is already verified.');
            $user->forceFill(['is_activated' => true, 'activated_at' => now(), 'activation_code' => null])->saveQuietly();
            return $user;
        });
    }

    public function resetPassword(Restaurant $restaurant, string $plainToken, string $password): User
    {
        return DB::transaction(function () use ($restaurant, $plainToken, $password): User {
            $record = $this->consume($restaurant, $plainToken, 'reset_password');
            $user = User::query()->findOrFail($record->user_id);
            $user->password = $password;
            $user->save();
            Token::query()->where('tokenable_type', $user->getMorphClass())
                ->where('tokenable_id', $user->getKey())->delete();
            PlatformRefreshToken::query()->where('tokenable_type', $user->getMorphClass())
                ->where('tokenable_id', $user->getKey())->whereNull('revoked_at')->update(['revoked_at' => now()]);
            return $user;
        });
    }

    private function issue(Restaurant $restaurant, User $user, string $purpose, \DateTimeInterface $expiresAt): string
    {
        $plainToken = Str::random(64);
        PlatformUserToken::query()->where('restaurant_id', $restaurant->getKey())
            ->where('user_id', $user->getKey())->where('purpose', $purpose)->whereNull('used_at')
            ->update(['used_at' => now()]);
        PlatformUserToken::query()->create([
            'restaurant_id' => $restaurant->getKey(), 'user_id' => $user->getKey(), 'purpose' => $purpose,
            'token_hash' => hash('sha256', $plainToken), 'expires_at' => $expiresAt,
        ]);
        return $plainToken;
    }

    private function consume(Restaurant $restaurant, string $plainToken, string $purpose): PlatformUserToken
    {
        $record = PlatformUserToken::query()->where('restaurant_id', $restaurant->getKey())
            ->where('token_hash', hash('sha256', $plainToken))->where('purpose', $purpose)
            ->whereNull('used_at')->lockForUpdate()->first();
        abort_unless($record && $record->expires_at->isFuture(), 422, 'This account link is invalid or has expired.');
        $record->update(['used_at' => now()]);
        return $record;
    }
}
