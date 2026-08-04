<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_risk_scores', function (Blueprint $table) {
            $table->uuid('id')->primary();
            // Nullable because a *blocked* attempt never becomes an order, yet still
            // needs a row so it shows up under Fraud → Blocked Orders.
            $table->foreignUuid('order_id')->nullable()->constrained('orders')->cascadeOnDelete();
            $table->string('phone')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('device_fingerprint')->nullable();

            $table->unsignedInteger('risk_score')->default(0);
            $table->string('risk_level', 20)->default('Low'); // Low, Medium, High, Critical
            $table->json('signals')->nullable();              // [{ code, label, score }]
            $table->string('action_taken', 20)->default('allowed'); // allowed, blocked, flagged

            $table->foreignUuid('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['risk_level', 'created_at']);
            $table->index(['action_taken', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_risk_scores');
    }
};
