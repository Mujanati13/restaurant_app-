<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;

class StorefrontReview extends Model
{
    protected $fillable = ['restaurant_id', 'customer_id', 'order_id', 'rating', 'comment'];
}
