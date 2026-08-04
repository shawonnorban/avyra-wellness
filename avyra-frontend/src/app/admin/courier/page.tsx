"use client";

import { Loader2, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Badge, Card, EmptyState, Spinner, statusTone } from "@/components/ui/misc";
import { toApiError } from "@/lib/api";
import { useConsignments, useCourierStats, useMe, useSyncConsignment } from "@/lib/admin";
import { formatDateTime, formatTaka } from "@/lib/format";

export default function AdminCourierPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: me } = useMe();
  const { data, isLoading } = useConsignments({ search: search || undefined, page });
  const { data: stats } = useCourierStats();
  const sync = useSyncConsignment();

  const consignments = data?.data ?? [];
  const canSync = me?.permissions.courier?.edit ?? false;

  const runSync = async (id: string, invoice: string | null) => {
    try {
      const result = await sync.mutateAsync(id);
      toast.success(`${invoice ?? "Consignment"} — ${result.status}`);
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Courier</h1>
        <p className="mt-1 text-sm text-muted-foreground">Steadfast consignments</p>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <StatTile label="Total" value={String(stats.total)} />
          <StatTile label="In transit" value={`${stats.in_transit_pct}%`} />
          <StatTile label="Delivered" value={`${stats.delivered_pct}%`} />
          <StatTile label="Returned" value={`${stats.returned_pct}%`} />
        </div>
      )}

      <Card className="p-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Invoice, tracking code, consignment ID or phone"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
            aria-label="Search consignments"
          />
        </div>
      </Card>

      <Card className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="text-primary" />
          </div>
        ) : consignments.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No consignments"
              description="Dispatch a confirmed order from the Orders page to create one."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-3 pl-4 pr-4 font-medium">Invoice</th>
                  <th className="py-3 pr-4 font-medium">Tracking</th>
                  <th className="py-3 pr-4 font-medium">Recipient</th>
                  <th className="py-3 pr-4 text-right font-medium">COD</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Last synced</th>
                  {canSync && <th className="py-3 pr-4" />}
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {consignments.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/50">
                    <td className="py-3 pl-4 pr-4 font-medium text-foreground">{c.invoice ?? "—"}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {c.tracking_code ?? "—"}
                      {c.consignment_id && (
                        <span className="block text-xs text-muted-foreground">#{c.consignment_id}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-foreground">{c.recipient.name ?? "—"}</span>
                      <span className="block text-xs text-muted-foreground">{c.recipient.phone}</span>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                      {formatTaka(c.cod_amount)}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">
                      {formatDateTime(c.last_synced_at)}
                    </td>
                    {canSync && (
                      <td className="py-3 pr-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runSync(c.id, c.invoice)}
                          disabled={sync.isPending}
                          aria-label={`Sync ${c.invoice ?? "consignment"}`}
                        >
                          {sync.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Page {data.current_page} of {data.last_page}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.current_page >= data.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </Card>
  );
}
