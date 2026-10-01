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
       Schema::table('users', function (Blueprint $table) {
    if (! Schema::hasColumn('users', 'otp_code')) $table->string('otp_code')->nullable();
    if (! Schema::hasColumn('users', 'otp_expires_at')) $table->timestamp('otp_expires_at')->nullable();
    if (! Schema::hasColumn('users', 'otp_sent_at')) $table->timestamp('otp_sent_at')->nullable();
    if (! Schema::hasColumn('users', 'otp_attempts')) $table->unsignedTinyInteger('otp_attempts')->default(0);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            //
        });
    }
};
