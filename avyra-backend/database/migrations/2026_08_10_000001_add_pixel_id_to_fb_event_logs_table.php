<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Records which pixel a failed call was bound for.
 *
 * With more than one destination the retry has to know where to replay: the
 * stored payload says what happened, never who it was for, and an access token
 * only works against its own pixel. Nullable because rows written while there
 * was a single destination have no answer — `fb:retry-events` treats those as
 * belonging to the first configured pixel, which is what they were.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fb_event_logs', function (Blueprint $table) {
            $table->string('pixel_id', 32)->nullable()->after('event_name');
        });
    }

    public function down(): void
    {
        Schema::table('fb_event_logs', function (Blueprint $table) {
            $table->dropColumn('pixel_id');
        });
    }
};
