"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  PackageX,
  RotateCcw,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { Badge, Card, Spinner, statusTone } from "@/components/ui/misc";
import { formatDate, formatTaka } from "@/lib/format";
import { useDashboard, useRecentOrders, useRevenueChart, useSiteVisits } from "@/lib/admin";

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

  const tiles = [
    { label: "Today's orders", value: stats.orders.today, icon: Clock, href: "/admin/orders" },
    { label: "Pending", value: stats.orders.pending, icon: Clock, href: "/admin/orders?status=pending" },
    { label: "Confirmed", value: stats.orders.confirmed, icon: CheckCircle2, href: "/admin/orders?status=Confirmed" },
    { label: "Confirmed", value: stats.orders.confirmed, icon: Truck, href: "/admin/orders?status=confirm" },
    { label: "Delivered", value: stats.orders.delivered, icon: CheckCircle2, href: "/admin/orders?status=delivered" },
    { label: "Fake", value: stats.orders.fake, icon: RotateCcw, href: "/admin/orders?status=fake" },
    { label: "Cancelled", value: stats.orders.cancelled, icon: AlertTriangle, href: "/admin/orders?status=cancel" },
    { label: "Customers", value: stats.customers, icon: Users, href: "/admin/customers" },
    {
      label: "Website visits",
      value: traffic?.summary.total ?? 0,
      icon: Eye,
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
          <Link key={tile.label} href={tile.href}>
            <Card className="transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {tile.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
                    {tile.value}
                  </p>
                </div>
                <tile.icon className="h-5 w-5 text-primary" aria-hidden />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue chart — a plain CSS bar chart, no charting dependency needed. */}
        <Card className="lg:col-span-2">
          <h2 className="text-base font-semibold text-foreground">Revenue, last 30 days</h2>

          {!chart || chart.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">No settled orders yet.</p>
          ) : (
            <div className="mt-6 flex h-48 items-end gap-1">
              {chart.map((day) => (
                <div
                  key={day.date}
                  className="group relative flex-1 rounded-t bg-primary/30 transition-colors hover:bg-primary/60"
                  style={{ height: `${Math.max(4, (day.revenue / maxRevenue) * 100)}%` }}
                >
                  <span className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-[11px] text-white group-hover:block">
                    {formatDate(day.date)} · {formatTaka(day.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Stock value
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {formatTaka(stats.inventory.stock_value)}
                </p>
              </div>
              <Wallet className="h-5 w-5 text-primary" aria-hidden />
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Needs restocking
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {stats.inventory.low_stock + stats.inventory.out_of_stock}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats.inventory.out_of_stock} out of stock, {stats.inventory.low_stock} low
                </p>
              </div>
              <PackageX className="h-5 w-5 text-warning" aria-hidden />
            </div>
          </Card>
        </div>
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
                  <td className="py-2.5 pr-4 text-muted-foreground">{formatDate(order.order_date)}</td>
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
