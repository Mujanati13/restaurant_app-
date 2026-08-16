<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;

class StorefrontAnalyticsEvent extends Model
{
    public $timestamps = false;

    protected $fillable = ['restaurant_id', 'session_id', 'event', 'path', 'properties', 'occurred_at', 'created_at'];

    protected $casts = ['properties' => 'array', 'occurred_at' => 'datetime', 'created_at' => 'datetime'];
}
