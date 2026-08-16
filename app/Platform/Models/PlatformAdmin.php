<?php

namespace App\Platform\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class PlatformAdmin extends Authenticatable
{
    use HasApiTokens;
    use Notifiable;

    protected $fillable = ['public_id', 'name', 'email', 'password', 'active', 'last_login_at'];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = ['active' => 'boolean', 'last_login_at' => 'datetime'];

    protected static function booted(): void
    {
        static::creating(function (PlatformAdmin $admin): void {
            $admin->public_id ??= (string) Str::uuid();
        });
    }
}
