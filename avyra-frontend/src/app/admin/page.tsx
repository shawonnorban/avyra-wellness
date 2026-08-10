"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  PackageX,
  RotateCcw,
  Sparkles,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import { Badge, Card, Spinner, statusTone } from "@/components/ui/misc";
import { formatDate, formatTaka, formatTime } from "@/lib/format";
import { useDashboard, useRecentOrders, useRevenueChart, useSiteVisits } from "@/lib/admin";

type Tone = "primary" | "info" | "success" | "warning" | "danger" | "neutral";

type Tile = {
  label: string;
  value: number;
  icon: typeof Clock;
  tone: Tone;
  href: string;
};

/**
 * Per-tone classes written out in full rather than composed from a template.
 * Tailwind scans source text for complete class names, so `bg-${tone}/10` would
 * compile to nothing and every tile would come out colourless.
 */
const TONES: Record<Tone, { chip: string; value: string; glow: string; edge: string }> = {
  primary: {
    chip: "bg-primary/12 text-primary",
    value: "text-foreground",
    glow: "from-primary/[0.09]",
    edge: "bg-primary group-hover:border-primary/40",
  },
  info: {
    chip: "bg-info/12 text-info",
    value: "text-foreground",
    glow: "from-info/[0.09]",
    edge: "bg-info group-hover:border-info/40",
  },
  success: {
    chip: "bg-success/12 text-success",
    value: "text-foreground",
    glow: "from-success/[0.09]",
    edge: "bg-success group-hover:border-success/40",
  },
  warning: {
    chip: "bg-warning/15 text-warning",
    value: "text-foreground",
    glow: "from-warning/[0.10]",
    edge: "bg-warning group-hover:border-warning/40",
  },
  danger: {
    chip: "bg-destructive/12 text-destructive",
    value: "text-foreground",
    glow: "from-destructive/[0.09]",
    edge: "bg-destructive group-hover:border-destructive/40",
  },
  neutral: {
    chip: "bg-muted text-muted-foreground",
    value: "text-foreground",
    glow: "from-muted-foreground/[0.07]",
    edge: "bg-muted-foreground/40 group-hover:border-border",
  },
};

function StatTile({ label, value, icon: Icon, tone, href }: Tile) {
  const styles = TONES[tone];

  return (
    <Link href={href} className="group block">
      <Card className="relative overflow-hidden p-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:erp-shadow-md">
        {/* Colour rule down the leading edge — the tile's identity at a glance,
            and it survives the card being read in greyscale as a thickness. */}
        <span className={twMerge("absolute inset-y-0 left-0 w-1", styles.edge)} aria-hidden />

        <span
          className={twMerge(
            "pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100",
            styles.glow,
          )}
          aria-hidden
        />

        <div className="relative flex items-start justify-between gap-3 py-5 pl-6 pr-5">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {label}
            </p>
            <p
              className={twMerge(
                "mt-2.5 text-[2rem] font-semibold leading-none tabular-nums tracking-tight",
                styles.value,
              )}
            >
              {value.toLocaleString("en-IN")}
            </p>
          </div>

          <span
            className={twMerge(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105",
              styles.chip,
            )}
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden />
          </span>
        </div>
      </Card>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useDashboard();
  const { data: chart } = useRevenueChart();
  const { data: recent } = useRecentOrders();
  const { data: traffic } = useSiteVisits();

  if (isLoading || !stats) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="text-primary" />
      </div>
    );
  }

  // Tone carries the same meaning here as it does on an order's badge, so a
  // glance down the row reads as "green is settled, amber is waiting, red needs
  // a decision" without anyone having to read the labels.
  const tiles: Tile[] = [
    { label: "Today's orders", value: stats.orders.today, icon: Sparkles, tone: "primary", href: "/admin/orders" },
    { label: "Pending", value: stats.orders.pending, icon: Clock, tone: "warning", href: "/admin/orders?status=pending" },
    { label: "Confirmed", value: stats.orders.confirmed, icon: Truck, tone: "info", href: "/admin/orders?status=confirm" },
    { label: "Delivered", value: stats.orders.delivered, icon: CheckCircle2, tone: "success", href: "/admin/orders?status=delivered" },
    { label: "Fake", value: stats.orders.fake, icon: RotateCcw, tone: "danger", href: "/admin/orders?status=fake" },
    { label: "Cancelled", value: stats.orders.cancelled, icon: AlertTriangle, tone: "danger", href: "/admin/orders?status=cancel" },
    { label: "Customers", value: stats.customers, icon: Users, tone: "neutral", href: "/admin/customers" },
    {
      label: "Website visits",
      value: traffic?.summary.total ?? 0,
      icon: Eye,
      tone: "neutral",
      href: "/admin/analytics",
    },
  ];

  const maxRevenue = Math.max(1, ...(chart ?? []).map((d) => d.revenue));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatTaka(stats.revenue.today)} today · {formatTaka(stats.revenue.this_month)} this month
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <StatTile key={tile.label} {...tile} />
        ))}
      </div>
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Order</th>
                <th className="pb-2 pr-4 font-medium">Customer</th>
                <th className="pb-2 pr-4 font-medium">Date</th>
                <th className="pb-2 pr-4 font-medium">Source</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(recent ?? []).map((order) => (
                <tr key={order.id}>
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/admin/orders?search=${order.order_number}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 text-foreground">
                    {order.customer_name}
                    <span className="block text-xs text-muted-foreground">{order.phone}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground">
                    {formatDate(order.order_date)}
                    {/* The clock time comes from `created_at`; `order_date` is a
                        date column and renders every row at midnight. */}
                    <span className="block text-xs">{formatTime(order.created_at)}</span>
                  </td>
                  <td className="py-2.5 pr-4">
                    {/* Where the order came from: Website, Landing Page, or POS
                        for one a staff member took over the phone. */}
                    <Badge tone={order.order_source === "POS" ? "neutral" : "info"}>
                      {order.order_source ?? "Unknown"}
                    </Badge>
                  </td>
                  <td className="py-2.5 pr-4">
                    <Badge tone={statusTone(order.status)}>{order.status}</Badge>
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-foreground">
                    {formatTaka(order.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(recent ?? []).length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No orders yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
