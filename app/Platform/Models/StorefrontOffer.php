<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;

class StorefrontOffer extends Model
{
    protected $fillable = ['restaurant_id', 'code', 'type', 'amount', 'minimum_order', 'starts_at', 'ends_at', 'active'];
    protected $casts = ['amount' => 'decimal:2', 'minimum_order' => 'decimal:2', 'starts_at' => 'datetime', 'ends_at' => 'datetime', 'active' => 'boolean'];
}
