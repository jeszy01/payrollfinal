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
       Schema::create('contribution_rates', function (Blueprint $t) {
    $t->id();
    $t->string('type')->unique(); // sss, philhealth, pagibig
    $t->decimal('employee_rate', 6, 3)->default(0);
    $t->decimal('employer_rate', 6, 3)->default(0);
    $t->decimal('min_base', 12, 2)->default(0);
    $t->decimal('max_base', 12, 2)->nullable();
    $t->decimal('step', 10, 2)->nullable();
    $t->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contribution_rates');
    }
};
