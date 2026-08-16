<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class PlatformTemplate extends Model
{
    protected $fillable = ['public_id', 'code', 'name', 'description', 'configuration', 'active', 'is_default', 'version'];
    protected $casts = ['configuration' => 'array', 'active' => 'boolean', 'is_default' => 'boolean'];

    protected static function booted(): void
    {
        static::creating(fn(self $template) => $template->public_id ??= (string) Str::uuid());
    }
}
