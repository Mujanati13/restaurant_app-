<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantBrandRevision extends Model
{
    protected $fillable = ['restaurant_id', 'version', 'configuration', 'created_by', 'published_at'];

    protected $casts = ['configuration' => 'array', 'published_at' => 'datetime'];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
