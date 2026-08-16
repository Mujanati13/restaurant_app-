<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;

class MobilePushSubscription extends Model
{
    protected $fillable = ['restaurant_id', 'audience', 'principal_id', 'platform', 'token_hash', 'token', 'topics', 'last_seen_at', 'revoked_at'];
    protected $casts = ['token' => 'encrypted', 'topics' => 'array', 'last_seen_at' => 'datetime', 'revoked_at' => 'datetime'];
}
