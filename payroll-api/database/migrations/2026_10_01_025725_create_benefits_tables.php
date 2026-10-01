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
    Schema::create('hmo_plans', function (Blueprint $t) {
        $t->uuid('id')->primary();
        $t->string('provider');
        $t->string('name');
        $t->decimal('monthly_premium', 12, 2)->default(0);
        $t->decimal('employee_share', 5, 2)->default(0);
        $t->timestamps();
    });

    Schema::create('company_benefits', function (Blueprint $t) {
        $t->uuid('id')->primary();
        $t->string('name');
        $t->decimal('amount', 12, 2)->default(0);
        $t->string('basis')->default('monthly'); // monthly | per_day
        $t->string('payslip_field')->nullable(); // transport_allowance | rice_allowance
        $t->timestamps();
    });

    Schema::create('enrollments', function (Blueprint $t) {
        $t->uuid('id')->primary();
        $t->uuid('employee_id')->index();
        $t->string('kind'); // hmo | benefit
        $t->foreignUuid('hmo_plan_id')->nullable()->constrained()->cascadeOnDelete();
        $t->foreignUuid('company_benefit_id')->nullable()->constrained()->cascadeOnDelete();
        $t->timestamps();
    });

    Schema::create('employee_loans', function (Blueprint $t) {
        $t->uuid('id')->primary();
        $t->uuid('employee_id')->index();
        $t->string('type'); // sss_loan | hdmf_loan | cash_advance
        $t->decimal('principal', 12, 2)->default(0);
        $t->decimal('amortization', 12, 2)->default(0); // per cut-off
        $t->decimal('balance', 12, 2)->default(0);
        $t->date('start_date');
        $t->timestamps();
    });

    Schema::table('payslips', function (Blueprint $t) {
        $t->decimal('hmo', 12, 2)->default(0);
    });
}

public function down(): void
{
    Schema::table('payslips', fn (Blueprint $t) => $t->dropColumn('hmo'));
    Schema::dropIfExists('employee_loans');
    Schema::dropIfExists('enrollments');
    Schema::dropIfExists('company_benefits');
    Schema::dropIfExists('hmo_plans');
}
};
