<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;

class AppBuildEvent extends Model
{
    public $timestamps = false;
    protected $fillable = ['app_build_id', 'restaurant_id', 'level', 'event', 'message', 'context', 'created_at'];
    protected $casts = ['context' => 'array', 'created_at' => 'datetime'];
}
