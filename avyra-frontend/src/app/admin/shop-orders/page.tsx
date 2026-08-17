"use client";

import Link from "next/link";
import { Plus, Search, Store } from "lucide-react";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Badge, Card, EmptyState, Spinner, statusTone } from "@/components/ui/misc";
import { useAdminOrders, useMe } from "@/lib/admin";
import { formatDate, formatTaka, formatTime } from "@/lib/format";

/**
 * Sales rung up over the counter.
 *
 * Its own screen rather than a filter on Sales & Orders, because almost nothing
 * that list is built around applies here: a counter sale has no delivery zone,
 * no courier consignment, no fraud score and no advertising behind it. It is
 * paid and handed over in one moment, so the only figures worth showing are how
 * many and how much.
 *
 * It reads the same endpoint with `?source=Shop` — the API hides these rows from
 * every other view, so no second endpoint was needed.
 */
export default function AdminShopOrdersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminOrders({ source: "Shop", search: search || undefined, page });

  const { data: me } = useMe();
  const canCreate = me?.permissions.sales?.create ?? false;

  const orders = data?.data ?? [];
  const total = data?.total ?? 0;
  const takings = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Shop Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sold over the counter. Kept out of Sales &amp; Orders, and never reported to Facebook.
          </p>
        </div>

        {canCreate && (
          <ButtonLink href="/admin/orders/new?source=Shop">
            <Plus className="h-4 w-4" />
            New shop sale
          </ButtonLink>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Shop sales
            </p>
            <Store className="h-4 w-4 text-muted-foreground" aria-hidden />
          </div>
          <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">
            {total.toLocaleString("en-IN")}
          </p>
        </Card>

        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Takings, this page
          </p>
          <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">
            {formatTaka(takings)}
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Order number, name or phone"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
            aria-label="Search shop orders"
          />
        </div>
      </Card>

      <Card className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No shop sales yet" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-3 pl-4 pr-4 font-medium">Order</th>
                  <th className="py-3 pr-4 font-medium">Customer</th>
                  <th className="py-3 pr-4 font-medium">Payment</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 text-right font-medium">Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50">
                    <td className="py-3 pl-4 pr-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {order.order_number}
                      </Link>
                      <span className="block text-xs text-muted-foreground">
                        {formatDate(order.order_date)}
                      </span>
                      {/* From created_at: order_date is a date column and would
                          render every row at midnight. */}
                      <span className="block text-xs text-muted-foreground">
                        {formatTime(order.created_at)}
                      </span>
                    </td>

                    <td className="py-3 pr-4 text-foreground">
                      {order.customer.name}
                      <span className="block text-xs text-muted-foreground">
                        {order.customer.phone}
                      </span>
                    </td>

                    <td className="py-3 pr-4 text-muted-foreground">
                      {order.payment.method ?? "—"}
                    </td>

                    <td className="py-3 pr-4">
                      <Badge tone={statusTone(order.status)}>{order.status}</Badge>
                    </td>

                    <td className="py-3 pr-4 text-right tabular-nums font-medium text-foreground">
                      {formatTaka(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {data.current_page} of {data.last_page}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={data.current_page <= 1}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={data.current_page >= data.last_page}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
