"use client";

import { Activity, CalendarDays, Eye, TrendingUp } from "lucide-react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { AreaChart, Columns, Donut } from "@/components/admin/charts";
import { Card, EmptyState, Spinner } from "@/components/ui/misc";
import { useSiteVisits } from "@/lib/admin";
import { formatDate } from "@/lib/format";

type Slice = { label: string; visits: number };

const RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "All time", days: 730 },
];

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading, isFetching } = useSiteVisits(days);

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="text-primary" />
      </div>
    );
  }

  // Days with at least one visit: a quiet weekend should not drag the average
  // down and make the site look deader than it is.
  const activeDays = data.daily.filter((d) => d.visits > 0).length;
  const average = activeDays ? Math.round(data.summary.visits / activeDays) : 0;

  // Second half against first, as a plain direction-of-travel signal.
  const half = Math.floor(data.daily.length / 2);
  const older = data.daily.slice(0, half).reduce((sum, d) => sum + d.visits, 0);
  const newer = data.daily.slice(half).reduce((sum, d) => sum + d.visits, 0);
  const trend = older > 0 ? Math.round(((newer - older) / older) * 100) : null;

  const busiest = [...data.hourly].sort((a, b) => b.visits - a.visits)[0];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Website traffic</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            {formatDate(data.range.from)} – {formatDate(data.range.to)}
            <span className="text-border">·</span>
            Asia/Dhaka
          </p>
        </div>

        <div className="flex rounded-lg border border-input bg-card p-1">
          {RANGES.map((range) => (
            <button
              key={range.days}
              type="button"
              onClick={() => setDays(range.days)}
              aria-pressed={days === range.days}
              className={twMerge(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                days === range.days
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Headline numbers ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Visits in range"
          value={data.summary.visits}
          icon={Eye}
          accent
          trend={trend}
        />
        <Stat label="Today" value={data.summary.today} icon={Activity} />
        <Stat label="Avg / active day" value={average} icon={TrendingUp} />
        <Stat label="All time" value={data.summary.total} icon={CalendarDays} />
      </div>

      {/* ── Trend ── */}
      <Card className="relative overflow-hidden">
        {isFetching && (
          <span className="absolute right-5 top-5">
            <Spinner className="h-4 w-4 text-primary" />
          </span>
        )}

        <h2 className="text-base font-semibold text-foreground">Daily visits</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {data.summary.visits.toLocaleString("en-IN")} across {data.range.days} days
        </p>

        {data.summary.visits === 0 ? (
          <div className="py-12">
            <EmptyState title="No visits recorded in this range yet." />
          </div>
        ) : (
          <AreaChart
            className="mt-4"
            points={data.daily.map((d) => ({
              label: d.day,
              value: d.visits,
              caption: formatDate(d.day),
            }))}
          />
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* ── Hour of day ── */}
        <Card className="lg:col-span-3">
          <h2 className="text-base font-semibold text-foreground">Hour of day</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {busiest && busiest.visits > 0
              ? `Busiest around ${String(busiest.hour).padStart(2, "0")}:00`
              : "No traffic yet"}
          </p>

          <Columns
            points={data.hourly.map((h) => ({
              label: String(h.hour),
              value: h.visits,
              caption: `${String(h.hour).padStart(2, "0")}:00`,
            }))}
          />
        </Card>

        {/* ── Device mix ── */}
        <Card className="lg:col-span-2">
          <h2 className="text-base font-semibold text-foreground">Devices</h2>
          <p className="mt-0.5 mb-5 text-sm text-muted-foreground">How visitors arrive</p>

          {data.breakdowns.device.length === 0 ? (
            <EmptyState title="Nothing yet" />
          ) : (
            <Donut
              points={data.breakdowns.device.map((d) => ({ label: d.label, value: d.visits }))}
            />
          )}
        </Card>
      </div>

      {/* ── Where the traffic comes from ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Breakdown title="Source" subtitle="utm_source" rows={data.breakdowns.source} />
        <Breakdown title="Medium" subtitle="utm_medium" rows={data.breakdowns.medium} />
        <Breakdown title="Campaign" subtitle="utm_campaign" rows={data.breakdowns.campaign} />
        <Breakdown title="Pages" subtitle="Most visited" rows={data.breakdowns.path} />
        <Breakdown title="Browser" subtitle="Parsed from the user agent" rows={data.breakdowns.browser} />
        <Breakdown title="Operating system" subtitle="Parsed from the user agent" rows={data.breakdowns.os} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  accent = false,
  trend = null,
}: {
  label: string;
  value: number;
  icon: typeof Eye;
  accent?: boolean;
  trend?: number | null;
}) {
  return (
    <Card
      className={twMerge(
        "relative overflow-hidden",
        accent && "border-primary/25 bg-gradient-to-br from-primary/[0.07] to-transparent",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className={twMerge("h-4 w-4", accent ? "text-primary" : "text-muted-foreground")} aria-hidden />
      </div>

      <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
        {value.toLocaleString("en-IN")}
      </p>

      {trend !== null && (
        <p
          className={twMerge(
            "mt-1 text-xs font-medium",
            trend >= 0 ? "text-success" : "text-destructive",
          )}
        >
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% vs the previous half
        </p>
      )}
    </Card>
  );
}

function Breakdown({ title, subtitle, rows }: { title: string; subtitle: string; rows: Slice[] }) {
  // Share of the shown rows, so the bars fill the card rather than all sitting
  // at a few percent when one page dominates.
  const top = Math.max(1, ...rows.map((r) => r.visits));
  const total = rows.reduce((sum, r) => sum + r.visits, 0);

  return (
    <Card>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-card-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>

      {rows.length === 0 ? (
        <div className="py-6">
          <EmptyState title="Nothing yet" />
        </div>
      ) : (
        <ul className="mt-4 space-y-3.5">
          {rows.map((row, i) => (
            <li key={row.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="w-4 shrink-0 text-xs tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="truncate text-foreground">{row.label}</span>
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {row.visits.toLocaleString("en-IN")}
                  <span className="ml-2 text-xs">
                    {total ? Math.round((row.visits / total) * 100) : 0}%
                  </span>
                </span>
              </div>

              <div className="ml-6 mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary/70 transition-all"
                  style={{ width: `${(row.visits / top) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
