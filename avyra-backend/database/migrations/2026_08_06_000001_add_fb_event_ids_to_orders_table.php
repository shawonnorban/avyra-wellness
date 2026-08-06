<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Persists the Meta `event_id` per conversion instead of deriving it.
 *
 * The browser and the server have to send byte-identical ids for Meta to collapse
 * the pair into one conversion. Deriving it from the order number worked while
 * both sides ran the same formula, but the browser half now goes through GTM,
 * where a media buyer wires the tag up by hand — so the id is generated once,
 * stored, and handed to the client rather than recomputed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // { "lead": "...", "purchase": "...", "deliveredPurchase": "..." }
            $table->json('fb_event_ids')->nullable()->after('fb_events_sent');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('fb_event_ids');
        });
    }
};
