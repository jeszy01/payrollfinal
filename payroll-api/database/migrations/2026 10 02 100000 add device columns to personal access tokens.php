<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $t) {
            $t->string('device_name')->nullable();
            $t->string('ip_address', 45)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $t) {
            $t->dropColumn(['device_name', 'ip_address']);
        });
    }
};
