<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Manual blocklists maintained from Fraud Detection → Blocked Items. These are
     * separate from the automatic repeat-detection windows, which read fraud_attempt_log.
     */
    public function up(): void
    {
        Schema::create('blocked_phones', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('phone')->unique();
            $table->string('reason')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignUuid('blocked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('blocked_ips', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('ip_address', 45)->unique();
            $table->string('reason')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignUuid('blocked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('blocked_devices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('device_fingerprint')->unique();
            $table->string('device_info')->nullable(); // browser/OS summary for the admin list
            $table->string('reason')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignUuid('blocked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blocked_devices');
        Schema::dropIfExists('blocked_ips');
        Schema::dropIfExists('blocked_phones');
    }
};
