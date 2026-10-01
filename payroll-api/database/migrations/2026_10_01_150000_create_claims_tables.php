<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('claim_types', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->string('name');
            $t->decimal('max_amount', 12, 2)->nullable();
            $t->unsignedInteger('deadline_days')->nullable();
            $t->unsignedTinyInteger('receipt_required')->default(1);
            $t->timestamps();
        });

        Schema::create('claims', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->uuid('employee_id')->index();
            $t->foreignUuid('claim_type_id')->nullable()->constrained('claim_types')->nullOnDelete();
            $t->date('expense_date');
            $t->decimal('amount', 12, 2);
            $t->text('description')->nullable();
            $t->string('status')->default('pending'); // pending | approved | rejected | paid
            $t->string('reject_reason')->nullable();
            $t->foreignId('encoded_by')->nullable()->constrained('users')->nullOnDelete();
            $t->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('decided_at')->nullable();
            $t->uuid('payroll_run_id')->nullable()->index();
            $t->string('paid_method')->nullable(); // payroll | manual
            $t->date('paid_at')->nullable();
            $t->string('payment_ref')->nullable();
            $t->string('attachment_name')->nullable();
            $t->string('attachment_mime')->nullable();
            $t->longText('attachment_data')->nullable();
            $t->timestamps();
        });

        foreach (['Transportation', 'Meals', 'Medical', 'Travel', 'Office Supplies', 'Other'] as $name) {
            DB::table('claim_types')->insert([
                'id' => (string) Str::uuid(),
                'name' => $name,
                'deadline_days' => 30,
                'receipt_required' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('claims');
        Schema::dropIfExists('claim_types');
    }
};
