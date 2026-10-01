<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            $table->string('employee_no')->nullable();
            $table->decimal('sl_cash_conversion', 12, 2)->default(0);
            $table->decimal('philhealth', 12, 2)->default(0);
            $table->decimal('cash_advance', 12, 2)->default(0);
            $table->decimal('sss_loan', 12, 2)->default(0);
            $table->decimal('hdmf_loan', 12, 2)->default(0);
            $table->decimal('transport_allowance', 12, 2)->default(0);
            $table->decimal('rice_allowance', 12, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            $table->dropColumn([
                'employee_no', 'sl_cash_conversion', 'philhealth', 'cash_advance',
                'sss_loan', 'hdmf_loan', 'transport_allowance', 'rice_allowance',
            ]);
        });
    }
};
