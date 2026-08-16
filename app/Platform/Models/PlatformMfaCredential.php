<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformMfaCredential extends Model
{
    protected $fillable = ['user_id', 'secret', 'recovery_code_hashes', 'last_counter', 'confirmed_at'];

    protected $casts = [
        'secret' => 'encrypted',
        'recovery_code_hashes' => 'encrypted:array',
        'last_counter' => 'integer',
        'confirmed_at' => 'datetime',
    ];
}
