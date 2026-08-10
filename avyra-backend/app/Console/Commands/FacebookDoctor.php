<?php

namespace App\Console\Commands;

use App\Models\FbEventLog;
use App\Models\Order;
use App\Services\Facebook\FacebookCapiService;
use App\Services\Facebook\FacebookEventMap;
use App\Support\Clock;
use Illuminate\Console\Command;

/**
 * Explains, on a live server, why Facebook is or is not receiving conversions.
 *
 * The failure that prompted this is silent by design: `sendForOrder()` returns
 * early when the credentials are blank, so nothing is sent *and* nothing is
 * logged — indistinguishable from "no orders yet" unless you go looking. This
 * separates the three states that look identical from Events Manager: not
 * configured, configured but rejected, and sent successfully.
 *
 * Read-only.
 */
class FacebookDoctor extends Command
{
    protected $signature = 'fb:doctor {--orders=10 : How many recent orders to inspect}';

    protected $description = 'Report why Facebook conversions are or are not being sent';

    public function handle(FacebookCapiService $facebook): int
    {
        $credentials = $facebook->describeCredentials();

        $this->newLine();
        $this->line('<options=bold>Credentials</>');
        $this->line('  read from      : ' . $credentials['source']);

        if ($credentials['pixels'] === []) {
            $this->line('  pixel id       : <fg=red>— not set —</>');
            $this->line('  access token   : <fg=red>— not set —</>');
        } else {
            foreach ($credentials['pixels'] as $i => $pixel) {
                $label = count($credentials['pixels']) > 1 ? ' #' . ($i + 1) : '   ';
                $this->line("  pixel{$label}      : " . $pixel['pixel_id']);
                $this->line("  token{$label}      : " . $pixel['token']);
            }
        }

        $this->line('  test event code: ' . ($credentials['test_event_code'] ?: '(none — live reporting)'));

        if (! $credentials['configured']) {
            $this->newLine();
            $this->error('  Not configured, so NOTHING is being sent to Meta.');
            $this->line('  Set FB_PIXEL_ID and FB_ACCESS_TOKEN in .env, then `php artisan config:cache`,');
            $this->line('  or fill in Settings > Meta CAPI and switch it on.');
            $this->newLine();

            return self::FAILURE;
        }

        $this->info('  Configured — events will be attempted.');

        if (filled($credentials['test_event_code'])) {
            $this->newLine();
            $this->error('  A TEST EVENT CODE IS SET — this is not live tracking.');
            $this->line('  Every conversion lands in Events Manager > Test Events and counts for');
            $this->line('  nothing: no reporting, no attribution, no ad optimisation. Fine while');
            $this->line('  you verify the setup; clear it before running real campaigns.');
        }

        $this->newLine();
        $this->line('<options=bold>Recent orders</>');
        $this->line('  "sent" lists the events Meta has accepted for that order.');
        $this->newLine();

        $orders = Order::query()
            ->latest('created_at')
            ->limit((int) $this->option('orders'))
            ->get(['id', 'order_number', 'status', 'created_at', 'fb_events_sent', 'fb_event_ids']);

        if ($orders->isEmpty()) {
            $this->warn('  No orders yet — place one to test.');

            return self::SUCCESS;
        }

        $pixels = array_column($credentials['pixels'], 'pixel_id');
        $total = count($pixels);

        /** How many of the configured pixels have accepted this event. */
        $accepted = function (Order $order, string $key) use ($pixels): int {
            $flag = $order->fb_events_sent[$key] ?? null;

            // A legacy bare `true` predates per-pixel flags and counts as complete.
            if ($flag === true) {
                return count($pixels);
            }

            return count(array_filter($pixels, fn (string $pixel) => ! empty($flag[$pixel])));
        };

        $this->table(
            ['Order', 'Status', 'Placed', 'Owed', 'Sent', 'Event id issued'],
            $orders->map(function (Order $order) use ($accepted, $total) {
                $owedKey = FacebookEventMap::keyFor($order->status);

                $owed = $owedKey ? FacebookEventMap::EVENT_NAMES[$owedKey] : '—';
                $missing = $owedKey && $accepted($order, $owedKey) < $total;

                // Counted per pixel, so "1/2" reads as the half-delivered
                // conversion it is rather than as a completed one.
                $sent = collect((array) ($order->fb_events_sent ?? []))
                    ->keys()
                    ->map(fn (string $key) => sprintf(
                        '%s %d/%d',
                        FacebookEventMap::EVENT_NAMES[$key] ?? $key,
                        $accepted($order, $key),
                        $total,
                    ))
                    ->implode(', ');

                return [
                    $order->order_number,
                    $order->status->value,
                    // Local time, or an operator comparing this against "the order
                    // I just placed" is six hours out and concludes it is missing.
                    $order->created_at?->setTimezone(Clock::timezone())->format('d M h:i a'),
                    $missing ? "<fg=red>{$owed}</>" : $owed,
                    $sent ?: '<fg=red>none</>',
                    implode(', ', array_keys((array) ($order->fb_event_ids ?? []))) ?: '—',
                ];
            })->all(),
        );

        $this->line('  A red "Owed" is an event this order should have sent and has not.');

        if ($total > 1) {
            $this->line("  \"Lead 1/{$total}\" means one pixel accepted it and the other did not —");
            $this->line('  look under Rejected calls for which, and why.');
        }

        $failures = FbEventLog::query()
            ->where('status', FbEventLog::STATUS_FAILED)
            ->latest('last_attempt_at')
            ->limit(5)
            ->get(['event_name', 'pixel_id', 'attempt_count', 'last_attempt_at', 'error_message']);

        $this->newLine();
        $this->line('<options=bold>Rejected calls</>');

        // "No failures" and "it is working" are not the same claim, and reading
        // the first as the second sends an operator off to debug GTM when in
        // fact the server has never once called Meta. Orders placed while the
        // credentials were blank returned early without sending or logging, and
        // nothing replays them: only a *new* status change tries again.
        $everSent = $orders->contains(
            fn (Order $order) => array_filter((array) ($order->fb_events_sent ?? [])) !== [],
        );

        if ($failures->isEmpty() && ! $everSent) {
            $this->warn('  Nothing was rejected — because nothing has been attempted yet.');
            $this->newLine();
            $this->line('  Every order above predates the credentials, and none of them will be');
            $this->line('  retried: an event is only sent when an order is created or its status');
            $this->line('  changes. Do NOT try to force them — Meta drops events over seven days');
            $this->line('  old, so replaying them would stamp old sales with today\'s date.');
            $this->newLine();
            $this->line('  <options=bold>Place one fresh order, then run this again.</> That row should read');
            $this->line('  Sent: Lead. Until it does, the server half is unproven.');
        } elseif ($failures->isEmpty()) {
            $this->info('  None. Every attempt Meta received, it accepted.');
            $this->newLine();
            $this->line('  If Events Manager still shows only PageView, the missing half is the');
            $this->line('  browser one — the GTM tags. Server events are arriving.');
        } else {
            foreach ($failures as $failure) {
                $this->newLine();
                $this->line(sprintf(
                    '  %s to pixel %s — attempt %d, %s',
                    $failure->event_name,
                    $failure->pixel_id ?? '(the only one configured at the time)',
                    $failure->attempt_count,
                    $failure->last_attempt_at?->diffForHumans() ?? 'never',
                ));
                $this->line('  <fg=red>' . mb_strimwidth((string) $failure->error_message, 0, 300, '…') . '</>');
            }

            $this->newLine();
            $this->line('  Replay them with `php artisan fb:retry-events`.');
        }

        $this->reportRetryBacklog();

        $this->newLine();

        return self::SUCCESS;
    }

    /**
     * Whether the hourly retry is actually running.
     *
     * `fb:retry-events` is scheduled, so it only ever runs if a cron is calling
     * `schedule:run` — and if that was never set up, a failed event is owed
     * forever while everything else looks healthy. Laravel keeps no record of
     * the last scheduled run, so this infers it: a replayable failure that has
     * sat untouched for more than two hours means an hourly job did not touch it.
     *
     * Silent when there is nothing to retry, since that proves nothing either way.
     */
    private function reportRetryBacklog(): void
    {
        $stale = FbEventLog::query()
            ->where('status', FbEventLog::STATUS_FAILED)
            ->where('attempt_count', '<', FbEventLog::MAX_ATTEMPTS)
            ->where('last_attempt_at', '<', now()->subHours(2))
            ->count();

        if ($stale === 0) {
            return;
        }

        $this->newLine();
        $this->line('<options=bold>Scheduler</>');
        $this->error("  {$stale} failed event(s) still under the retry limit have not been");
        $this->line('  retried in over two hours. `fb:retry-events` is scheduled hourly, so');
        $this->line('  the cron calling `schedule:run` is probably not set up.');
        $this->newLine();
        $this->line('  Check with `php artisan schedule:list`, then add a cron job running');
        $this->line('  `php artisan schedule:run` every minute. Without it `courier:sync`');
        $this->line('  is not running either, and courier statuses rely on it as a backstop.');
    }
}
