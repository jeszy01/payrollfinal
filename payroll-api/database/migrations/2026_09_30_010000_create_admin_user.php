<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up(): void
    {
        $email = env('ADMIN_EMAIL', 'admin@archonnell.com');
        $password = env('ADMIN_PASSWORD');

        if (! $password || DB::table('users')->where('email', $email)->exists()) {
            return;
        }

        DB::table('users')->insert([
            'name' => 'Admin',
            'email' => $email,
            'password' => Hash::make($password),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('users')->where('email', env('ADMIN_EMAIL', 'admin@archonnell.com'))->delete();
    }
};
