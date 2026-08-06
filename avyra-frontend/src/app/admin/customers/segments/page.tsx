"use client";

import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, Spinner } from "@/components/ui/misc";
import { formatTaka } from "@/lib/format";

type SegmentSummary = { key: string; label: string };
type SegmentRow = {
  phone: string;
  name: string;
  orders: number;
  value: number;
  last_order: string | null;
};

/**
 * Customer lists for Meta Lookalike Audiences.
 *
 * Derived from orders on every request rather than stored: a saved list goes
 * stale the moment a status changes or a parcel comes back.
 *
 * The export is a plain CSV of phone numbers — Ads Manager hashes them on
 * upload, so hashing here would simply stop them matching.
 */
export default function AdminCustomerSegmentsPage() {
  const [active, setActive] = useState<string | null>(null);

  const { data: summary, isLoading } = useQuery({
    queryKey: ["admin", "customer-segments"],
    queryFn: async () => {
      const { data } = await api.get<{ data: SegmentSummary[]; counts: Record<string, number> }>(
        "/admin/customers/segments",
      );
      return data;
    },
  });

  const { data: rows, isFetching } = useQuery({
    queryKey: ["admin", "customer-segments", active],
    queryFn: async () => {
      const { data } = await api.get<{ data: SegmentRow[]; label: string }>(
        `/admin/customers/segments/${active}`,
      );
      return data;
    },
    enabled: Boolean(active),
  });

  if (isLoading || !summary) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="text-primary" />
      </div>
    );
  }

  const counts = summary.counts ?? {};

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Customer segments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lists for Meta Lookalike Audiences. Delivered and Repeat carry the strongest signal.
          </p>
        </div>

        <Link href="/admin/customers" className="text-sm text-primary hover:underline">
          ← All customers
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {summary.data.map((segment) => {
          const count = counts[segment.key] ?? 0;
          const selected = active === segment.key;

          return (
            <Card
              key={segment.key}
              className={twMerge(
                "cursor-pointer transition-colors",
                selected ? "border-primary" : "hover:bg-secondary/40",
              )}
            >
              <button
                type="button"
                onClick={() => setActive(selected ? null : segment.key)}
                aria-pressed={selected}
                className="w-full text-left"
              >
                <p className="text-sm text-muted-foreground">{segment.label}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{count}</p>
              </button>

              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/admin/customers/segments/${segment.key}/export`}
                download
                className="mt-3 inline-block"
              >
                <Button variant="outline" className="gap-2 text-xs">
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
              </a>
            </Card>
          );
        })}
      </div>

      {active && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-card-foreground">{rows?.label}</h2>
            {isFetching && <Spinner className="h-4 w-4 text-primary" />}
          </div>

          {!rows?.data.length ? (
            <EmptyState title="No customers in this segment yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Phone</th>
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Orders</th>
                    <th className="pb-2 pr-4 font-medium">Value</th>
                    <th className="pb-2 font-medium">Last order</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.data.map((row) => (
                    <tr key={row.phone} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4 font-medium text-card-foreground">{row.phone}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{row.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{row.orders}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{formatTaka(row.value)}</td>
                      <td className="py-2 text-muted-foreground">{row.last_order ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
