"use client";

import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { useSiteVisits } from "@/lib/admin";
import { Card, EmptyState, Spinner } from "@/components/ui/misc";
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

  const { data, isLoading } = useSiteVisits(days);

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="text-primary" />
      </div>
    );
  }

  // Days with at least one visit, so a quiet weekend does not drag the average
  // down and make the site look deader than it is.
  const activeDays = data.daily.filter((d) => d.visits > 0).length;
  const average = activeDays ? Math.round(data.summary.visits / activeDays) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Website traffic</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(data.range.from)} – {formatDate(data.range.to)} · times in Asia/Dhaka
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {RANGES.map((range) => (
            <button
              key={range.days}
              type="button"
              onClick={() => setDays(range.days)}
              aria-pressed={days === range.days}
              className={twMerge(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                days === range.days
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-card text-foreground hover:bg-secondary",
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Visits in range" value={data.summary.visits} />
        <Tile label="Today" value={data.summary.today} />
        <Tile label="Avg / active day" value={average} />
        <Tile label="All time" value={data.summary.total} />
      </div>

      <Card>
        <h2 className="text-base font-semibold text-foreground">Daily visits</h2>

        {data.summary.visits === 0 ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            No visits recorded in this range yet.
          </p>
        ) : (
          <Bars
            items={data.daily.map((d) => ({ key: d.day, value: d.visits, tip: `${formatDate(d.day)} · ${d.visits}` }))}
          />
        )}
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-foreground">Hour of day</h2>
        <Bars
          items={data.hourly.map((h) => ({
            key: String(h.hour),
            value: h.visits,
            tip: `${String(h.hour).padStart(2, "0")}:00 · ${h.visits}`,
          }))}
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Breakdown title="Source" rows={data.breakdowns.source} total={data.summary.visits} />
        <Breakdown title="Medium" rows={data.breakdowns.medium} total={data.summary.visits} />
        <Breakdown title="Campaign" rows={data.breakdowns.campaign} total={data.summary.visits} />
        <Breakdown title="Page" rows={data.breakdowns.path} total={data.summary.visits} />
        <Breakdown title="Device" rows={data.breakdowns.device} total={data.summary.visits} />
        <Breakdown title="Browser" rows={data.breakdowns.browser} total={data.summary.visits} />
        <Breakdown title="Operating system" rows={data.breakdowns.os} total={data.summary.visits} />
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
        {value.toLocaleString("en-IN")}
      </p>
    </Card>
  );
}

/** CSS bars rather than a charting library — the dashboard already does this. */
function Bars({ items }: { items: { key: string; value: number; tip: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="mt-6 flex h-48 items-end gap-1">
      {items.map((item) => (
        <div
          key={item.key}
          className="group relative flex-1 rounded-t bg-primary/30 transition-colors hover:bg-primary/60"
          style={{ height: `${Math.max(2, (item.value / max) * 100)}%` }}
        >
          <span className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-[11px] text-white group-hover:block">
            {item.tip}
          </span>
        </div>
      ))}
    </div>
  );
}

function Breakdown({ title, rows, total }: { title: string; rows: Slice[]; total: number }) {
  return (
    <Card>
      <h2 className="text-sm font-medium text-card-foreground">{title}</h2>

      {rows.length === 0 ? (
        <div className="py-6">
          <EmptyState title="Nothing yet" />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => {
            const share = total ? Math.round((row.visits / total) * 100) : 0;

            return (
              <li key={row.label}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate text-foreground">{row.label}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {row.visits.toLocaleString("en-IN")}
                    <span className="ml-2 text-xs">{share}%</span>
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary/60" style={{ width: `${share}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
