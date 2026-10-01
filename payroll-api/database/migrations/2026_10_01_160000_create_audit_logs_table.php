<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('user_name')->nullable();
            $t->string('role')->nullable();
            $t->string('action')->index();
            $t->string('module')->index();
            $t->string('description');
            $t->json('details')->nullable();
            $t->string('method', 10);
            $t->string('path');
            $t->string('ip')->nullable();
            $t->timestamp('created_at')->useCurrent()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
