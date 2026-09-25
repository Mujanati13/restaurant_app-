<?php

namespace App\Platform\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerSocialIdentity extends Model
{
    protected $fillable = ['restaurant_id', 'customer_id', 'provider', 'provider_subject', 'email'];
}
