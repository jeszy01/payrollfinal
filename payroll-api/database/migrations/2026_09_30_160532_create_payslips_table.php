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
      Schema::create('payslips', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('payroll_run_id')->constrained()->cascadeOnDelete();
    $table->uuid('employee_id');
    $table->string('employee_name');
    $table->unsignedInteger('days_worked')->default(0);
    $table->unsignedInteger('late_minutes')->default(0);
    $table->unsignedInteger('undertime_minutes')->default(0);
    $table->unsignedInteger('overtime_minutes')->default(0);
    $table->unsignedInteger('absences')->default(0);
    $table->decimal('gross', 12, 2)->default(0);
    $table->decimal('deduction', 12, 2)->default(0);   // late + undertime
    $table->decimal('overtime_pay', 12, 2)->default(0);
    $table->decimal('sss', 12, 2)->default(0);
    $table->decimal('pag_ibig', 12, 2)->default(0);
    $table->decimal('claims', 12, 2)->default(0);
    $table->decimal('net_pay', 12, 2)->default(0);
    $table->timestamp('sent_at')->nullable();
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payslips');
    }
};
