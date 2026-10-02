<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('attendance_records')->where('ot_status', 'pending')->update(['ot_status' => 'approved']);
    }

    public function down(): void {}
};
