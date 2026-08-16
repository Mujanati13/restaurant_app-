<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlatformAlert extends Model
{
    protected $fillable = ['restaurant_id', 'fingerprint', 'type', 'severity', 'status', 'message', 'context',
        'first_seen_at', 'last_seen_at', 'acknowledged_at', 'acknowledged_by', 'resolved_at'];
    protected $casts = ['context' => 'array', 'first_seen_at' => 'datetime', 'last_seen_at' => 'datetime',
        'acknowledged_at' => 'datetime', 'resolved_at' => 'datetime'];

    public function restaurant(): BelongsTo { return $this->belongsTo(Restaurant::class); }
}
