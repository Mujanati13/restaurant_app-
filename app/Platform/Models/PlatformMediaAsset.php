<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class PlatformMediaAsset extends Model
{
    protected $fillable = [
        'restaurant_id', 'public_id', 'kind', 'disk', 'path', 'mime_type',
        'size_bytes', 'visibility', 'created_by',
    ];

    protected $casts = ['size_bytes' => 'integer'];

    protected static function booted(): void
    {
        static::creating(function (PlatformMediaAsset $asset): void {
            $asset->public_id ??= (string) Str::uuid();
        });
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
