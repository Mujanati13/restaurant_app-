<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;

class AppBuildArtifact extends Model
{
    protected $fillable = ['app_build_id', 'restaurant_id', 'kind', 'disk', 'path', 'size_bytes', 'sha256', 'expires_at'];
    protected $casts = ['size_bytes' => 'integer', 'expires_at' => 'datetime'];
}
