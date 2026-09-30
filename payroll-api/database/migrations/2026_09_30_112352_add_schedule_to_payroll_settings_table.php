<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
  public function up(): void
{
    Schema::table('payroll_settings', function (Blueprint $table) {
        $table->unsignedTinyInteger('working_days_per_month')->default(22);
        $table->unsignedTinyInteger('cutoff_day')->default(15);
    });
}

public function down(): void
{
    Schema::table('payroll_settings', function (Blueprint $table) {
        $table->dropColumn(['working_days_per_month', 'cutoff_day']);
    });
}
};
