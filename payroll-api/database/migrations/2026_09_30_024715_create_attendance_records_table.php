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
    Schema::create('attendance_records', function (Blueprint $table) {
        $table->uuid('id')->primary();
        $table->foreignUuid('employee_id')->nullable()->constrained('employees')->nullOnDelete();
        $table->string('employee_name');
        $table->date('date');
        $table->decimal('daily_rate', 10, 2)->nullable();
        $table->json('rules')->nullable();
        $table->string('time_in')->nullable();
        $table->string('time_out')->nullable();
        $table->boolean('absent')->default(false);
        $table->boolean('archived')->default(false);
        $table->timestamps();

        $table->unique(['employee_id', 'date']);
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};
