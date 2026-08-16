<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantPageSection extends Model
{
    protected $fillable = ['restaurant_page_id', 'stable_id', 'type', 'position', 'visible', 'content'];

    protected $casts = ['visible' => 'boolean', 'content' => 'array', 'position' => 'integer'];

    public function page(): BelongsTo
    {
        return $this->belongsTo(RestaurantPage::class, 'restaurant_page_id');
    }
}
