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
    Schema::create('payroll_settings', function (Blueprint $table) {
        $table->id();
        $table->string('shift_start')->default('08:00');
        $table->string('shift_end')->default('17:00');
        $table->decimal('paid_hours_per_day', 4, 2)->default(8);
        $table->decimal('overtime_multiplier', 4, 2)->default(1.25);
        $table->unsignedSmallInteger('rounding_minutes')->default(60);
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_settings');
    }
};
