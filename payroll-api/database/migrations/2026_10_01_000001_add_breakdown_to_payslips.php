<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            if (! Schema::hasColumn('payslips', 'employee_no')) {
                $table->string('employee_no')->nullable();
            }
            foreach ([
                'sl_cash_conversion', 'philhealth', 'cash_advance', 'sss_loan',
                'hdmf_loan', 'transport_allowance', 'rice_allowance',
            ] as $col) {
                if (! Schema::hasColumn('payslips', $col)) {
                    $table->decimal($col, 12, 2)->default(0);
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            foreach ([
                'employee_no', 'sl_cash_conversion', 'philhealth', 'cash_advance',
                'sss_loan', 'hdmf_loan', 'transport_allowance', 'rice_allowance',
            ] as $col) {
                if (Schema::hasColumn('payslips', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
