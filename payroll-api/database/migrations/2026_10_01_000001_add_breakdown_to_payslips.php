<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
                Schema::table('payslips', function (Blueprint $table) {
            $table->dropColumn(['employee_no', 'philhealth', 'hdmf', 'sss_loan', 'hdmf_loan',
                'cash_advance', 'sl_conversion', 'transportation_allowance', 'rice_allowance']);
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
