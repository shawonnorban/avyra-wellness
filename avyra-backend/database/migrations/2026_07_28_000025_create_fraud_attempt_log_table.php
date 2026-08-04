<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Every *allowed* checkout attempt is recorded here. The repeat-phone,
        // repeat-IP and repeat-device checks all query this table over a
        // configurable time window, so it needs an index per signal.
        Schema::create('fraud_attempt_log', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('phone')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('device_fingerprint')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['phone', 'created_at']);
            $table->index(['ip_address', 'created_at']);
            $table->index(['device_fingerprint', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fraud_attempt_log');
    }
};
