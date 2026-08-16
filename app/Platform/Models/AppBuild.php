<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class AppBuild extends Model
{
    protected $fillable = ['restaurant_id', 'public_id', 'platform', 'status', 'configuration', 'requested_by', 'attempts', 'artifact_path', 'external_job_id', 'failure_message', 'started_at', 'submitted_at', 'finished_at', 'cancelled_at'];
    protected $casts = ['configuration' => 'array', 'started_at' => 'datetime', 'submitted_at' => 'datetime', 'finished_at' => 'datetime', 'cancelled_at' => 'datetime'];

    protected static function booted(): void
    {
        static::creating(fn(AppBuild $build) => $build->public_id ??= (string)Str::uuid());
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(AppBuildEvent::class)->latest('id');
    }

    public function artifacts(): HasMany
    {
        return $this->hasMany(AppBuildArtifact::class)->latest('id');
    }

    public function recordEvent(string $event, string $message, string $level = 'info', array $context = []): AppBuildEvent
    {
        return $this->events()->create([
            'restaurant_id' => $this->restaurant_id, 'level' => $level, 'event' => $event,
            'message' => $message, 'context' => $context, 'created_at' => now(),
        ]);
    }
}
