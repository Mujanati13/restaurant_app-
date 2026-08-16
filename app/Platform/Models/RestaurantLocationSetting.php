<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;

class RestaurantLocationSetting extends Model
{
    protected $fillable = ['restaurant_id', 'location_id', 'key', 'value'];

    protected $casts = ['value' => 'json'];
}
