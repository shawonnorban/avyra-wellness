<?php

namespace App\Console\Commands;

use App\Models\FbEventLog;
use App\Services\Facebook\FacebookEventDeduper;
use App\Services\Facebook\FacebookCapiService;
use App\Services\Facebook\FacebookEventMap;
use Illuminate\Console\Command;

/**
 * Replays Conversions API calls that failed, so a network blip or an expired
 * token does not lose a conversion for good.
 *
 * The stored payload is replayed verbatim rather than rebuilt: it carries the
 * original `event_id`, so a call that in fact reached Facebook before the
 * connection dropped is deduplicated on their side instead of counted twice.
 */
class RetryFacebookEvents extends Command
{
    protected $signature = 'fb:retry-events {--limit=100 : Most logs to replay in one run}';

    protected $description = 'Retry failed Facebook Conversions API events';

    public function handle(FacebookCapiService $facebook, FacebookEventDeduper $deduper): int
    {
        if (! $facebook->isConfigured()) {
            $this->warn('Facebook credentials are not configured; nothing to do.');

            return self::SUCCESS;
        }

        $logs = FbEventLog::query()
            ->where('status', FbEventLog::STATUS_FAILED)
            ->where('attempt_count', '<', FbEventLog::MAX_ATTEMPTS)
            ->orderBy('created_at')
            ->limit((int) $this->option('limit'))
            ->get();

        if ($logs->isEmpty()) {
            $this->info('No failed events to retry.');

            return self::SUCCESS;
        }

        $recovered = 0;

        foreach ($logs as $log) {
            // Rows written before there was more than one destination carry no
            // pixel; resend() sends those to the first, which is where they came
            // from. The flag below has to agree, or the retry succeeds and the
            // order still reads as owing the event.
            $pixelId = $log->pixel_id ?? $facebook->primaryPixelId();

            $result = $facebook->resend($log->payload ?? [], $log->pixel_id);

            $log->update([
                'status' => $result['ok'] ? FbEventLog::STATUS_SUCCESS : FbEventLog::STATUS_FAILED,
                'attempt_count' => $log->attempt_count + 1,
                'last_attempt_at' => now(),
                'error_message' => $result['ok'] ? null : $result['error'],
            ]);

            if (! $result['ok']) {
                continue;
            }

            $recovered++;

            // Only now is the conversion really recorded, so this is where the
            // dedup flag belongs — the first attempt deliberately did not set it.
            if (($order = $log->order) && $pixelId !== null) {
                $key = array_search($log->event_name, FacebookEventMap::EVENT_NAMES, true);

                if ($key !== false) {
                    $deduper->markSent($order, $key, $pixelId);
                }
            }
        }

        $this->info("Retried {$logs->count()} event(s); {$recovered} succeeded.");

        return self::SUCCESS;
    }
}
