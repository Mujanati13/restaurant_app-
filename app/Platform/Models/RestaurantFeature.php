<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantFeature extends Model
{
    protected $fillable = ['restaurant_id', 'feature', 'enabled', 'limits'];
    protected $casts = ['enabled' => 'boolean', 'limits' => 'array'];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
