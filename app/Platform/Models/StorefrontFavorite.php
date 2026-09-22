<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;

class StorefrontFavorite extends Model
{
    protected $fillable = ['restaurant_id', 'customer_id', 'menu_id'];
}
