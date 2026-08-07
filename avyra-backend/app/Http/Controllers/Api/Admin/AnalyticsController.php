<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CampaignVisit;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Site traffic reports.
 *
 * Everything is aggregated in SQL and only the aggregate crosses the wire. The
 * visits table is never pruned, so the obvious alternative — fetch the rows and
 * count them in JavaScript — would work for a month and then quietly stop, first
 * by being slow and then by running the browser out of memory.
 *
 * Days and hours are bucketed in the shop's timezone, not UTC, or "today" reads
 * six hours late in Dhaka.
 */
class AnalyticsController extends Controller
{
    /** Reports are capped so a mistyped range cannot scan the whole table. */
    private const MAX_DAYS = 730;

    private const TIMEZONE = 'Asia/Dhaka';

    public function index(Request $request): JsonResponse
    {
        [$from, $to] = $this->range($request);

        $scoped = fn (): Builder => CampaignVisit::query()->whereBetween('created_at', [$from, $to]);

        $today = Carbon::now(self::TIMEZONE)->startOfDay()->utc();

        return response()->json([
            'range' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'days' => $from->diffInDays($to) + 1,
            ],
            'summary' => [
                'visits' => $scoped()->count(),
                'today' => CampaignVisit::where('created_at', '>=', $today)->count(),
                // All time, ignoring the filter: the dashboard tile shows this.
                'total' => CampaignVisit::count(),
                'unique_paths' => $scoped()->distinct('path')->count('path'),
            ],
            'daily' => $this->daily($from, $to),
            'hourly' => $this->hourly($from, $to),
            'breakdowns' => [
                'source' => $this->breakdown($scoped(), 'utm_source', 'Direct'),
                'medium' => $this->breakdown($scoped(), 'utm_medium', 'None'),
                'campaign' => $this->breakdown($scoped(), 'utm_campaign', 'None'),
                'path' => $this->breakdown($scoped(), 'path', 'Unknown'),
                'device' => $this->breakdown($scoped(), 'device', 'Unknown'),
                'browser' => $this->breakdown($scoped(), 'browser', 'Unknown'),
                'os' => $this->breakdown($scoped(), 'os', 'Unknown'),
            ],
        ]);
    }

    /**
     * Resolves the requested window, defaulting to the last 30 days.
     *
     * @return array{0: Carbon, 1: Carbon}
     */
    private function range(Request $request): array
    {
        $days = (int) $request->integer('days', 30);
        $days = max(1, min($days, self::MAX_DAYS));

        $to = Carbon::now(self::TIMEZONE)->endOfDay()->utc();
        $from = Carbon::now(self::TIMEZONE)->subDays($days - 1)->startOfDay()->utc();

        return [$from, $to];
    }

    /**
     * One row per day, zero-filled — a gap in the data should read as a flat line
     * rather than the chart joining across the missing days.
     */
    private function daily(Carbon $from, Carbon $to): array
    {
        $rows = CampaignVisit::query()
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw($this->localDate() . ' as day, COUNT(*) as visits')
            ->groupBy('day')
            ->pluck('visits', 'day');

        $days = [];
        $cursor = $from->copy()->timezone(self::TIMEZONE)->startOfDay();
        $last = $to->copy()->timezone(self::TIMEZONE)->startOfDay();

        while ($cursor->lte($last)) {
            $key = $cursor->toDateString();
            $days[] = ['day' => $key, 'visits' => (int) ($rows[$key] ?? 0)];
            $cursor->addDay();
        }

        return $days;
    }

    /** All 24 hours, so the chart has a fixed shape whatever the data. */
    private function hourly(Carbon $from, Carbon $to): array
    {
        $rows = CampaignVisit::query()
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw($this->localHour() . ' as hour, COUNT(*) as visits')
            ->groupBy('hour')
            ->pluck('visits', 'hour');

        return collect(range(0, 23))
            ->map(fn ($hour) => [
                'hour' => $hour,
                'visits' => (int) ($rows[$hour] ?? $rows[(string) $hour] ?? 0),
            ])
            ->all();
    }

    /** Top values for one column, with the long tail collapsed into "Other". */
    private function breakdown(Builder $query, string $column, string $emptyLabel, int $limit = 8): array
    {
        $rows = $query
            ->selectRaw("COALESCE(NULLIF(`{$column}`, ''), ?) as label, COUNT(*) as visits", [$emptyLabel])
            ->groupBy('label')
            ->orderByDesc('visits')
            ->get();

        $top = $rows->take($limit)
            ->map(fn ($row) => ['label' => (string) $row->label, 'visits' => (int) $row->visits])
            ->values()
            ->all();

        $rest = (int) $rows->slice($limit)->sum('visits');

        if ($rest > 0) {
            $top[] = ['label' => 'Other', 'visits' => $rest];
        }

        return $top;
    }

    /**
     * Timestamps are stored in UTC; these shift them into the shop's timezone
     * before bucketing, so a sale at 1am Dhaka lands on the right day.
     */
    private function localDate(): string
    {
        return $this->isSqlite()
            ? "date(created_at, '+6 hours')"
            : "DATE(CONVERT_TZ(created_at, '+00:00', '+06:00'))";
    }

    private function localHour(): string
    {
        return $this->isSqlite()
            ? "CAST(strftime('%H', created_at, '+6 hours') AS INTEGER)"
            : "HOUR(CONVERT_TZ(created_at, '+00:00', '+06:00'))";
    }

    /** The test suite runs on in-memory SQLite, which has no CONVERT_TZ. */
    private function isSqlite(): bool
    {
        return DB::connection()->getDriverName() === 'sqlite';
    }
}
