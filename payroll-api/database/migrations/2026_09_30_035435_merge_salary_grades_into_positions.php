<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up(): void
{
    Schema::table('positions', function (Blueprint $table) {
        $table->string('grade_code')->nullable();
        $table->decimal('monthly_salary', 12, 2)->nullable();
    });

    DB::statement('UPDATE positions SET grade_code = sg.code, monthly_salary = sg.monthly_salary FROM salary_grades sg WHERE positions.salary_grade_id = sg.id');

    Schema::table('positions', function (Blueprint $table) {
        $table->dropConstrainedForeignId('salary_grade_id');
        $table->unique(['name', 'department']);
    });

    Schema::dropIfExists('salary_grades');
}

public function down(): void
{
    // Not reversible: salary grade data was merged into positions.
}
};
