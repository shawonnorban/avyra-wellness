<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Turns `campaign_visits` from a landing-page counter into a site-wide traffic log.
 *
 * It already carried UTM parameters and a user agent, but every row had to belong
 * to a landing page, so the storefront, the shop and the standalone campaign page
 * were invisible. `path` is what makes a row stand on its own.
 *
 * Device, browser and OS are parsed once here rather than on every report. The
 * table is never pruned, so the alternative — `LIKE` over the raw user agent
 * across hundreds of thousands of rows on each dashboard load — gets slower every
 * week. Indexes are chosen for the same reason: every report filters by date and
 * groups by one of these columns.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('campaign_visits', function (Blueprint $table) {
            $table->string('path', 512)->nullable()->after('event_type');
            $table->string('referrer', 512)->nullable()->after('path');

            $table->string('utm_term')->nullable()->after('utm_campaign');
            $table->string('utm_content')->nullable()->after('utm_term');

            // Parsed from the user agent at write time; "Unknown" when unreadable.
            $table->string('device', 20)->nullable()->after('user_agent');
            $table->string('browser', 40)->nullable()->after('device');
            $table->string('os', 40)->nullable()->after('browser');

            $table->index('created_at');
            $table->index(['created_at', 'device']);
            $table->index(['created_at', 'utm_source']);
        });
    }

    public function down(): void
    {
        Schema::table('campaign_visits', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
            $table->dropIndex(['created_at', 'device']);
            $table->dropIndex(['created_at', 'utm_source']);

            $table->dropColumn([
                'path', 'referrer', 'utm_term', 'utm_content', 'device', 'browser', 'os',
            ]);
        });
    }
};
