<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformOnboardingRequest extends Model
{
    protected $guarded = [];

    protected $casts = [
        'response_body' => 'array',
        'expires_at' => 'datetime',
    ];
}
