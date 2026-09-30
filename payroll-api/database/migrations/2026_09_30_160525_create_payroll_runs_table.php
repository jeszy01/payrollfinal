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
       Schema::create('payroll_runs', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->date('period_start');
    $table->date('period_end');
    $table->string('status')->default('draft'); // draft → pending_approval → approved → released (susunod na step)
    $table->timestamps();
    $table->unique(['period_start', 'period_end']);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_runs');
    }
};
