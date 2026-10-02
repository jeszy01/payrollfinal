<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('payroll_settings', function (Blueprint $t) {
            $t->unsignedSmallInteger('ot_threshold_minutes')->default(5);
        });
    }

    public function down(): void
    {
        Schema::table('payroll_settings', function (Blueprint $t) {
            $t->dropColumn('ot_threshold_minutes');
        });
    }
};
