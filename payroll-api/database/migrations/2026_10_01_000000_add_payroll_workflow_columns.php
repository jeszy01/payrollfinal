<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('admin')->after('email'); // admin | hr
        });

        Schema::table('payroll_runs', function (Blueprint $table) {
            $table->foreignId('generated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('released_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('released_at')->nullable();
        });

        Schema::table('payslips', function (Blueprint $table) {
            $table->string('employee_no')->nullable()->after('employee_id');
            foreach (['philhealth', 'hdmf', 'sss_loan', 'hdmf_loan', 'cash_advance',
                      'sl_conversion', 'transportation_allowance', 'rice_allowance'] as $col) {
                $table->decimal($col, 12, 2)->default(0);
            }
        });
    }

    public function down(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            $table->dropColumn(['employee_no', 'philhealth', 'hdmf', 'sss_loan', 'hdmf_loan',
                'cash_advance', 'sl_conversion', 'transportation_allowance', 'rice_allowance']);
        });

        Schema::table('payroll_runs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('generated_by');
            $table->dropConstrainedForeignId('approved_by');
            $table->dropConstrainedForeignId('released_by');
            $table->dropColumn(['approved_at', 'released_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
