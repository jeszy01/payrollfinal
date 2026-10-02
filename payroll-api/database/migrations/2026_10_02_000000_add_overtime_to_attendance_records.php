<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'attendance';

    public function up(): void
    {
        Schema::connection('attendance')->table('attendance_records', function (Blueprint $t) {
            $t->unsignedInteger('ot_minutes')->default(0);
            $t->text('ot_reason')->nullable();
            $t->string('ot_status', 10)->nullable()->index(); // pending | approved | rejected
            $t->text('ot_remarks')->nullable();               // required on reject
            $t->string('ot_reviewed_by')->nullable();
            $t->timestamp('ot_reviewed_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::connection('attendance')->table('attendance_records', function (Blueprint $t) {
            $t->dropColumn(['ot_minutes', 'ot_reason', 'ot_status', 'ot_remarks', 'ot_reviewed_by', 'ot_reviewed_at']);
        });
    }
};
