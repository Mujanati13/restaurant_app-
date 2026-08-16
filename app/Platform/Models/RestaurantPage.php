<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RestaurantPage extends Model
{
    protected $fillable = ['restaurant_id', 'slug', 'title', 'is_home'];

    protected $casts = ['is_home' => 'boolean'];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(RestaurantPageSection::class)->orderBy('position')->orderBy('id');
    }
}
