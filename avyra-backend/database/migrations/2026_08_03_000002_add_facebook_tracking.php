<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Facebook Conversions API support.
 *
 * `orders` already carries fbclid/fbc/fbp and ip_address, so only the user
 * agent and the per-order sent-event ledger are new. Both are captured at
 * checkout and reused for the later Lead and Purchase events, which is what
 * keeps Match Quality up for events sent hours after the visit.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('user_agent', 512)->nullable()->after('ip_address');

            // Which Facebook events have already gone out for this order, so a
            // repeated status change cannot double-count a conversion.
            $table->json('fb_events_sent')->nullable()->after('fbp');
        });

        Schema::create('fb_event_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_id')->constrained()->cascadeOnDelete();
            $table->string('event_name', 40);
            $table->string('status', 20)->default('failed');
            $table->json('payload')->nullable();
            $table->text('error_message')->nullable();
            $table->unsignedTinyInteger('attempt_count')->default(0);
            $table->timestamp('last_attempt_at')->nullable();
            $table->timestamps();

            // The retry command's only query: unresolved logs under the cap.
            $table->index(['status', 'attempt_count']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fb_event_logs');

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['user_agent', 'fb_events_sent']);
        });
    }
};
