<?php

namespace App\Console\Commands;

use App\Models\FbEventLog;
use App\Models\Order;
use App\Services\Facebook\FacebookCapiService;
use App\Services\Facebook\FacebookEventMap;
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
        $this->line('  pixel id       : ' . ($credentials['pixel_id'] ?: '<fg=red>— not set —</>'));
        $this->line('  access token   : ' . ($credentials['token'] ?: '<fg=red>— not set —</>'));
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
            $this->warn('  A test event code is set: conversions land in Test Events, NOT in reporting.');
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

        $this->table(
            ['Order', 'Status', 'Placed', 'Owed', 'Sent', 'Event id issued'],
            $orders->map(function (Order $order) {
                $owedKey = FacebookEventMap::keyFor($order->status);
                $sent = array_keys(array_filter((array) ($order->fb_events_sent ?? [])));

                $owed = $owedKey ? FacebookEventMap::EVENT_NAMES[$owedKey] : '—';
                $missing = $owedKey && ! in_array($owedKey, $sent, true);

                return [
                    $order->order_number,
                    $order->status->value,
                    $order->created_at?->format('d M H:i'),
                    $missing ? "<fg=red>{$owed}</>" : $owed,
                    implode(', ', array_map(
                        fn (string $key) => FacebookEventMap::EVENT_NAMES[$key] ?? $key,
                        $sent,
                    )) ?: '<fg=red>none</>',
                    implode(', ', array_keys((array) ($order->fb_event_ids ?? []))) ?: '—',
                ];
            })->all(),
        );

        $this->line('  A red "Owed" is an event this order should have sent and has not.');

        $failures = FbEventLog::query()
            ->where('status', FbEventLog::STATUS_FAILED)
            ->latest('last_attempt_at')
            ->limit(5)
            ->get(['event_name', 'attempt_count', 'last_attempt_at', 'error_message']);

        $this->newLine();
        $this->line('<options=bold>Rejected calls</>');

        if ($failures->isEmpty()) {
            $this->info('  None. Every attempt Meta received, it accepted.');
            $this->newLine();
            $this->line('  If Events Manager still shows only PageView, the missing half is the');
            $this->line('  browser one — the GTM tags. Server events are arriving.');
        } else {
            foreach ($failures as $failure) {
                $this->newLine();
                $this->line(sprintf(
                    '  %s — attempt %d, %s',
                    $failure->event_name,
                    $failure->attempt_count,
                    $failure->last_attempt_at?->diffForHumans() ?? 'never',
                ));
                $this->line('  <fg=red>' . mb_strimwidth((string) $failure->error_message, 0, 300, '…') . '</>');
            }

            $this->newLine();
            $this->line('  Replay them with `php artisan fb:retry-events`.');
        }

        $this->newLine();

        return self::SUCCESS;
    }
}
