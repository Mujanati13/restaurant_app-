<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class SupportImpersonation extends Model
{
    protected $fillable = ['public_id', 'platform_admin_id', 'restaurant_id', 'restaurant_membership_id', 'token_hash',
        'reason', 'started_ip', 'expires_at', 'exchanged_at', 'ended_at'];
    protected $casts = ['expires_at' => 'datetime', 'exchanged_at' => 'datetime', 'ended_at' => 'datetime'];

    protected static function booted(): void
    {
        static::creating(fn(self $session) => $session->public_id ??= (string) Str::uuid());
    }

    public function restaurant(): BelongsTo { return $this->belongsTo(Restaurant::class); }
    public function membership(): BelongsTo { return $this->belongsTo(RestaurantMembership::class, 'restaurant_membership_id'); }
    public function administrator(): BelongsTo { return $this->belongsTo(PlatformAdmin::class, 'platform_admin_id'); }
}
