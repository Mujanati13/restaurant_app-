<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class RestaurantSetting extends Model
{
    /**
     * Values in these settings must never be returned as part of a restaurant
     * settings payload. The model encrypts them before they reach the database
     * while keeping the rest of the flexible settings table JSON-compatible.
     */
    private const SENSITIVE_KEYS = [
        'payments_stripe_secret_key',
        'payments_stripe_webhook_secret',
        'payments_paypal_secret',
    ];

    protected $fillable = ['restaurant_id', 'key', 'value'];

    public static function isSensitiveKey(string $key): bool
    {
        return in_array($key, self::SENSITIVE_KEYS, true);
    }

    public function getValueAttribute(?string $value): mixed
    {
        $decoded = json_decode($value ?? 'null', true);
        if (!self::isSensitiveKey((string)($this->attributes['key'] ?? '')) || !is_string($decoded) || $decoded === '') {
            return $decoded;
        }

        // Existing installations may have a legacy plaintext value. It remains
        // readable until the additive migration rewrites it encrypted.
        try {
            return Crypt::decryptString($decoded);
        } catch (\Throwable) {
            return $decoded;
        }
    }

    public function setValueAttribute(mixed $value): void
    {
        if (self::isSensitiveKey((string)($this->attributes['key'] ?? '')) && is_string($value) && $value !== '') {
            try {
                Crypt::decryptString($value);
            } catch (\Throwable) {
                $value = Crypt::encryptString($value);
            }
        }

        $this->attributes['value'] = json_encode($value, JSON_THROW_ON_ERROR);
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
