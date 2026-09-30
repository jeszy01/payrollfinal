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
    Schema::dropIfExists('employees');

    Schema::create('salary_grades', function (Blueprint $table) {
        $table->uuid('id')->primary();
        $table->string('code')->unique();
        $table->string('name');
        $table->decimal('monthly_salary', 12, 2);
        $table->timestamps();
    });

    Schema::create('positions', function (Blueprint $table) {
        $table->uuid('id')->primary();
        $table->string('name');
        $table->string('department');
        $table->foreignUuid('salary_grade_id')->constrained('salary_grades')->restrictOnDelete();
        $table->timestamps();
    });

    Schema::create('employees', function (Blueprint $table) {
        $table->uuid('id')->primary();
        $table->string('employee_no')->unique();
        $table->string('name');
        $table->string('email')->nullable()->unique();
        $table->string('phone')->nullable();
        $table->foreignUuid('position_id')->constrained('positions')->restrictOnDelete();
        $table->string('status')->default('Active');
        $table->string('employment_type')->default('Regular');
        $table->string('civil_status')->nullable();
        $table->date('date_hired');
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('employees');
    Schema::dropIfExists('positions');
    Schema::dropIfExists('salary_grades');
}
};
