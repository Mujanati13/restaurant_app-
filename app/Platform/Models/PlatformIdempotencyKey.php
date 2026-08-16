<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformIdempotencyKey extends Model
{
    protected $fillable = ['restaurant_id', 'operation', 'idempotency_key', 'request_hash', 'response_status', 'response_body', 'expires_at'];

    protected $casts = ['response_body' => 'array', 'expires_at' => 'datetime'];
}
