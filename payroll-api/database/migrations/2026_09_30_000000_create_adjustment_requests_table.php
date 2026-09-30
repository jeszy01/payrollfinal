<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('adjustment_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type'); // promotion | market
            $table->foreignUuid('employee_id')->nullable()->constrained('employees')->cascadeOnDelete();
            $table->foreignUuid('position_id')->nullable()->constrained('positions')->cascadeOnDelete();
            $table->foreignUuid('new_position_id')->nullable()->constrained('positions')->cascadeOnDelete();
            $table->decimal('old_salary', 12, 2);
            $table->decimal('new_salary', 12, 2);
            $table->text('reason')->nullable();
            $table->string('status')->default('pending'); // pending | approved | rejected
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('adjustment_requests');
    }
};
