<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up(): void
    {
        $email = getenv('ADMIN_EMAIL') ?: ($_ENV['ADMIN_EMAIL'] ?? null) ?: ($_SERVER['ADMIN_EMAIL'] ?? null);
        $password = getenv('ADMIN_PASSWORD') ?: ($_ENV['ADMIN_PASSWORD'] ?? null) ?: ($_SERVER['ADMIN_PASSWORD'] ?? null);

        if (! $email || ! $password) {
            throw new RuntimeException('ADMIN_EMAIL or ADMIN_PASSWORD is not set.');
        }

        $exists = DB::table('users')->where('email', $email)->exists();

        if ($exists) {
            DB::table('users')->where('email', $email)->update([
                'password' => Hash::make($password),
                'updated_at' => now(),
            ]);
        } else {
            DB::table('users')->insert([
                'name' => 'Admin',
                'email' => $email,
                'password' => Hash::make($password),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void {}
};
