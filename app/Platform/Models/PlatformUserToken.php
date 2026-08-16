<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformUserToken extends Model
{
    protected $fillable = ['restaurant_id', 'user_id', 'purpose', 'token_hash', 'expires_at', 'used_at'];

    protected $casts = ['expires_at' => 'datetime', 'used_at' => 'datetime'];
}
