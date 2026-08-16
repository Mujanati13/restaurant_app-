<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_admins', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->string('name', 80);
            $table->string('email', 96)->unique();
            $table->string('password');
            $table->boolean('active')->default(true)->index();
            $table->timestamp('last_login_at')->nullable();
            $table->timestamps();
        });

        if (!Schema::hasTable('admin_users')) return;
        foreach (DB::table('admin_users')->where('super_user', true)->get(['user_id', 'name', 'email', 'password']) as $legacy) {
            $id = DB::table('platform_admins')->insertGetId([
                'public_id' => (string) Str::uuid(), 'name' => $legacy->name, 'email' => strtolower($legacy->email),
                'password' => $legacy->password, 'active' => true, 'created_at' => now(), 'updated_at' => now(),
            ]);
            if (Schema::hasTable('platform_mfa_credentials')) {
                DB::table('platform_mfa_credentials')->where('user_id', $legacy->user_id)->update(['user_id' => $id]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_admins');
    }
};
