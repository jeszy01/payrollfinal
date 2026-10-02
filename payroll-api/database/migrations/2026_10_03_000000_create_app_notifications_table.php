<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('app_notifications', function (Blueprint $t) {
            $t->id();
            $t->string('type');
            $t->string('title');
            $t->string('message')->nullable();
            $t->string('audience')->default('all'); // admin | hr | all
            $t->string('link')->nullable();
            $t->json('read_by')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_notifications');
    }
};
