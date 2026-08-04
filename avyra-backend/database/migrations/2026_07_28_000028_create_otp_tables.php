<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('otp_verifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('phone');
            // Hashed, not plaintext: a leaked table dump must not let anyone
            // complete someone else's verification.
            $table->string('code_hash');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->boolean('verified')->default(false);
            $table->timestamp('expires_at');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['phone', 'expires_at']);
        });

        // Delivery receipts from the SMS gateway, for debugging failed sends.
        Schema::create('otp_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('phone');
            $table->string('provider')->nullable();
            $table->boolean('success')->default(false);
            $table->string('response_code')->nullable();
            $table->string('error_reason')->nullable();
            $table->text('detail')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['phone', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otp_logs');
        Schema::dropIfExists('otp_verifications');
    }
};
