<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payroll_runs', function (Blueprint $t) {
            $t->dropUnique(['period_start', 'period_end']);
        });

        Schema::table('attendance_records', function (Blueprint $t) {
            $t->uuid('payroll_run_id')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $t) {
            $t->dropColumn('payroll_run_id');
        });

        Schema::table('payroll_runs', function (Blueprint $t) {
            $t->unique(['period_start', 'period_end']);
        });
    }
};
