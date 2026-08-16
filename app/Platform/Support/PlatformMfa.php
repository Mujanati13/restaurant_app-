<?php

namespace App\Platform\Support;

use App\Platform\Models\PlatformMfaCredential;
use App\Platform\Models\PlatformAdmin;
use Illuminate\Support\Str;

class PlatformMfa
{
    private const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    public function begin(PlatformAdmin $user): array
    {
        $secret = $this->base32Encode(random_bytes(20));
        $recoveryCodes = collect(range(1, 8))->map(fn() => Str::lower(Str::random(5).'-'.Str::random(5)))->all();
        $credential = PlatformMfaCredential::query()->updateOrCreate(['user_id' => $user->getKey()], [
            'secret' => $secret,
            'recovery_code_hashes' => array_map(fn(string $code) => hash('sha256', $code), $recoveryCodes),
            'last_counter' => null,
            'confirmed_at' => null,
        ]);
        $issuer = rawurlencode((string) config('app.name', 'Vondo'));
        $label = rawurlencode('Vondo:'.$user->email);

        return [
            'credential' => $credential,
            'secret' => $secret,
            'recovery_codes' => $recoveryCodes,
            'otpauth_url' => "otpauth://totp/{$label}?secret={$secret}&issuer={$issuer}&algorithm=SHA1&digits=6&period=30",
        ];
    }

    public function verify(PlatformMfaCredential $credential, string $code, bool $consume = true): bool
    {
        $normalized = preg_replace('/\s+/', '', $code);
        if (preg_match('/^\d{6}$/', $normalized)) {
            $current = intdiv(now()->timestamp, 30);
            foreach (range(-1, 1) as $window) {
                $counter = $current + $window;
                if (($credential->last_counter ?? -1) >= $counter) continue;
                if (hash_equals($this->codeAt($credential->secret, $counter * 30), $normalized)) {
                    if ($consume) $credential->update(['last_counter' => $counter]);
                    return true;
                }
            }
            return false;
        }

        $hash = hash('sha256', Str::lower($normalized));
        $codes = $credential->recovery_code_hashes ?? [];
        $index = array_search($hash, $codes, true);
        if ($index === false) return false;
        if ($consume) {
            unset($codes[$index]);
            $credential->update(['recovery_code_hashes' => array_values($codes)]);
        }
        return true;
    }

    public function codeAt(string $secret, int $timestamp): string
    {
        $counter = intdiv($timestamp, 30);
        $binaryCounter = pack('N2', intdiv($counter, 4294967296), $counter % 4294967296);
        $hash = hash_hmac('sha1', $binaryCounter, $this->base32Decode($secret), true);
        $offset = ord($hash[19]) & 0x0f;
        $value = unpack('N', substr($hash, $offset, 4))[1] & 0x7fffffff;
        return str_pad((string) ($value % 1000000), 6, '0', STR_PAD_LEFT);
    }

    private function base32Encode(string $value): string
    {
        $bits = '';
        foreach (str_split($value) as $byte) $bits .= str_pad(decbin(ord($byte)), 8, '0', STR_PAD_LEFT);
        $result = '';
        foreach (str_split($bits, 5) as $chunk) {
            $result .= self::ALPHABET[bindec(str_pad($chunk, 5, '0'))];
        }
        return $result;
    }

    private function base32Decode(string $value): string
    {
        $bits = '';
        foreach (str_split(strtoupper($value)) as $character) {
            $position = strpos(self::ALPHABET, $character);
            if ($position === false) continue;
            $bits .= str_pad(decbin($position), 5, '0', STR_PAD_LEFT);
        }
        $result = '';
        foreach (str_split($bits, 8) as $chunk) {
            if (strlen($chunk) === 8) $result .= chr(bindec($chunk));
        }
        return $result;
    }
}
