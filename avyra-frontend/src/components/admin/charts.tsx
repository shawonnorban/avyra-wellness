"use client";

import { useId, useState } from "react";
import { twMerge } from "tailwind-merge";

/**
 * Hand-rolled SVG charts.
 *
 * A charting library would be ~50 kB of JavaScript for three shapes, and the
 * admin bundle is already the heaviest thing staff load on a phone. These take
 * the same design tokens as the rest of the panel, so they stay in step with the
 * theme for free.
 *
 * Everything scales through `viewBox` rather than measuring the container, which
 * keeps them resolution-independent without a resize observer.
 */

export type Point = { label: string; value: number; caption?: string };

const AREA_W = 720;
const AREA_H = 220;
const PAD = { top: 16, right: 8, bottom: 24, left: 40 };

/** Rounds up to something a human would pick for the top gridline. */
function niceMax(value: number): number {
  if (value <= 5) return 5;

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => value <= s * magnitude) ?? 10;

  return step * magnitude;
}

export function AreaChart({ points, className }: { points: Point[]; className?: string }) {
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);

  if (points.length === 0) return null;

  const max = niceMax(Math.max(...points.map((p) => p.value)));
  const innerW = AREA_W - PAD.left - PAD.right;
  const innerH = AREA_H - PAD.top - PAD.bottom;

  // A single point would divide by zero; pin it to the middle instead.
  const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;
  const x = (i: number) => PAD.left + (points.length > 1 ? i * stepX : innerW / 2);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.value)}`).join(" ");
  const area = `${line} L ${x(points.length - 1)} ${PAD.top + innerH} L ${x(0)} ${PAD.top + innerH} Z`;

  const active = hover !== null ? points[hover] : null;

  return (
    <div className={twMerge("relative", className)}>
      <svg viewBox={`0 0 ${AREA_W} ${AREA_H}`} className="w-full" role="img" aria-label="Daily visits">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Gridlines with their values, so the shape can actually be read. */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={AREA_W - PAD.right}
              y1={PAD.top + innerH * t}
              y2={PAD.top + innerH * t}
              stroke="var(--border)"
              strokeDasharray={t === 1 ? undefined : "3 4"}
            />
            <text
              x={PAD.left - 8}
              y={PAD.top + innerH * t + 4}
              textAnchor="end"
              className="fill-muted-foreground"
              style={{ fontSize: 10 }}
            >
              {Math.round(max * (1 - t))}
            </text>
          </g>
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" />

        {hover !== null && (
          <>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke="var(--primary)"
              strokeOpacity="0.35"
            />
            <circle cx={x(hover)} cy={y(points[hover].value)} r="4" fill="var(--primary)" />
          </>
        )}

        {/* Invisible hit areas: far more reliable than tracking pointer maths. */}
        {points.map((point, i) => (
          <rect
            key={point.label}
            x={x(i) - stepX / 2}
            y={PAD.top}
            width={Math.max(stepX, 6)}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-sm bg-foreground px-2 py-1 text-[11px] text-white shadow-lg"
          style={{ left: `${(x(hover!) / AREA_W) * 100}%` }}
        >
          {active.caption ?? active.label} · {active.value}
        </div>
      )}
    </div>
  );
}

/** Compact column chart, used for the hour-of-day distribution. */
export function Columns({ points }: { points: Point[] }) {
  const max = Math.max(1, ...points.map((p) => p.value));

  return (
    <div className="mt-5 flex h-32 items-end gap-[3px]">
      {points.map((point) => (
        <div key={point.label} className="group relative flex-1">
          <div
            className="rounded-t bg-primary/25 transition-colors group-hover:bg-primary"
            style={{ height: `${Math.max(2, (point.value / max) * 128)}px` }}
          />
          <span className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-sm bg-foreground px-2 py-1 text-[11px] text-white group-hover:block">
            {point.caption ?? point.label} · {point.value}
          </span>
        </div>
      ))}
    </div>
  );
}

const DONUT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--warning)",
  "var(--info)",
  "var(--destructive)",
  "var(--muted-foreground)",
];

/** Device mix. Stroke-dasharray on a circle beats hand-written arc paths. */
export function Donut({ points }: { points: Point[] }) {
  const total = points.reduce((sum, p) => sum + p.value, 0);

  if (total === 0) return null;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  // Each arc starts where the previous ones ended. Derived per item rather than
  // accumulated in a closure, so nothing is mutated while rendering.
  const arcs = points.map((point, i) => ({
    ...point,
    dash: (point.value / total) * circumference,
    offset: points.slice(0, i).reduce((sum, p) => sum + (p.value / total) * circumference, 0),
  }));

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 160 160" className="h-36 w-36 shrink-0 -rotate-90" role="img" aria-label="Device mix">
        {arcs.map((arc, i) => (
          <circle
            key={arc.label}
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
            strokeWidth="20"
            strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
            strokeDashoffset={-arc.offset}
          />
        ))}
      </svg>

      <ul className="min-w-0 flex-1 space-y-2">
        {points.map((point, i) => (
          <li key={point.label} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
            />
            <span className="truncate text-foreground">{point.label}</span>
            <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">
              {Math.round((point.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
