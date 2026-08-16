<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformAuditLog extends Model
{
    protected $table = 'platform_audit_logs';

    protected $fillable = ['restaurant_id', 'actor_type', 'actor_id', 'action', 'subject_type', 'subject_id', 'metadata', 'ip_address'];

    protected $casts = ['metadata' => 'array', 'created_at' => 'datetime'];

    public $timestamps = false;

    protected static function booted(): void
    {
        static::creating(fn(PlatformAuditLog $log) => $log->created_at = now());
    }
}
