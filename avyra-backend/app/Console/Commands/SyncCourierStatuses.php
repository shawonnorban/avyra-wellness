<?php

namespace App\Console\Commands;

use App\Models\CourierConsignment;
use App\Models\Setting;
use App\Services\Courier\CourierService;
use App\Services\Courier\SteadfastClient;
use Illuminate\Console\Command;
use Throwable;

class SyncCourierStatuses extends Command
{
    protected $signature = 'courier:sync {--limit=200 : Maximum consignments to poll in one run}';

    protected $description = 'Poll Steadfast for status updates on consignments that are still in transit';

    public function handle(CourierService $courier, SteadfastClient $client): int
    {
        $config = Setting::get('courier_steadfast', []) ?: [];

        if (empty($config['auto_sync']) || ! $client->isConfigured()) {
            $this->comment('Steadfast auto-sync is off or unconfigured; nothing to do.');

            return self::SUCCESS;
        }

        $consignments = CourierConsignment::trackable()
            ->where('courier', 'steadfast')
            ->orderBy('last_synced_at')       // oldest first, nulls included
            ->limit((int) $this->option('limit'))
            ->get();

        $updated = 0;
        $failed = 0;

        foreach ($consignments as $consignment) {
            try {
                $before = $consignment->status;
                $courier->sync($consignment);

                if ($consignment->fresh()->status !== $before) {
                    $updated++;
                }
            } catch (Throwable $e) {
                // One bad consignment must not stop the batch.
                $failed++;
                $this->warn("{$consignment->invoice}: {$e->getMessage()}");
            }
        }

        $this->info("Polled {$consignments->count()} consignment(s): {$updated} updated, {$failed} failed.");

        return self::SUCCESS;
    }
}
