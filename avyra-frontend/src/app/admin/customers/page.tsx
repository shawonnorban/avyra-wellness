"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import api, { toApiError } from "@/lib/api";
import { useMe } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Badge, Card, EmptyState, Spinner } from "@/components/ui/misc";
import { formatDate, formatTaka } from "@/lib/format";
import type { Paginated } from "@/lib/types";

type CustomerRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  phone: string | null;
  email: string | null;
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
};

type CustomerStats = {
  total: number;
  new_this_month: number;
  registered: number;
  guest: number;
  total_revenue: number;
  average_order_value: number;
};

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "customers", search, page],
    queryFn: async () => {
      const { data } = await api.get<Paginated<CustomerRow>>("/admin/customers", {
        params: { search: search || undefined, page },
      });
      return data;
    },
    placeholderData: (previous) => previous,
  });

  const { data: stats } = useQuery({
    queryKey: ["admin", "customers", "stats"],
    queryFn: async () => {
      const { data } = await api.get<{ data: CustomerStats }>("/admin/customers/stats");
      return data.data;
    },
  });

  const { data: me } = useMe();
  const canDelete = me?.permissions.customers?.delete ?? false;

  const queryClient = useQueryClient();

  const removeCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ message: string }>(`/admin/customers/${id}`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "customers"] }),
  });

  /**
   * The API refuses a customer who has orders, so the common case is a 422 with
   * a readable reason rather than a deletion — surfacing it is the whole job here.
   */
  const confirmDelete = async (customer: CustomerRow) => {
    if (!window.confirm(`Delete “${customer.name}”? A customer with orders cannot be deleted.`)) {
      return;
    }

    try {
      const result = await removeCustomer.mutateAsync(customer.id);
      toast.success(result.message);
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  const customers = data?.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">{data?.total ?? 0} total</p>
        </div>

        <Link href="/admin/customers/segments" className="text-sm text-primary hover:underline">
          Segments for Lookalike Audiences →
        </Link>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="New this month" value={String(stats.new_this_month)} />
          <Tile label="Registered" value={String(stats.registered)} />
          <Tile label="Guest" value={String(stats.guest)} />
          <Tile label="Average order" value={formatTaka(stats.average_order_value)} />
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
            placeholder="Name, phone, email or code"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
            aria-label="Search customers"
          />
        </div>
      </Card>

      <Card className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="text-primary" />
          </div>
        ) : customers.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No customers found" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-3 pl-4 pr-4 font-medium">Customer</th>
                  <th className="py-3 pr-4 font-medium">Contact</th>
                  <th className="py-3 pr-4 font-medium">Type</th>
                  <th className="py-3 pr-4 text-right font-medium">Orders</th>
                  <th className="py-3 pr-4 text-right font-medium">Spent</th>
                  <th className="py-3 pr-4 font-medium">Last order</th>
                  {canDelete && <th className="py-3 pr-4 font-medium sr-only">Actions</th>}
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-muted/50">
                    <td className="py-3 pl-4 pr-4">
                      <span className="font-medium text-foreground">{customer.name}</span>
                      <span className="block text-xs text-muted-foreground">{customer.code}</span>
                    </td>
                    <td className="py-3 pr-4 text-foreground">
                      {customer.phone ?? "—"}
                      {customer.email && (
                        <span className="block text-xs text-muted-foreground">{customer.email}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={customer.type === "Registered" ? "info" : "neutral"}>
                        {customer.type}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                      {customer.total_orders}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                      {formatTaka(customer.total_spent)}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{formatDate(customer.last_order_date)}</td>

                    {canDelete && (
                      <td className="py-3 pr-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => confirmDelete(customer)}
                          disabled={removeCustomer.isPending}
                          aria-label={`Delete ${customer.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
            <span>
              Page {data.current_page} of {data.last_page}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-full border border-input px-3 py-1 disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="rounded-full border border-input px-3 py-1 disabled:opacity-40"
                disabled={data.current_page >= data.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </Card>
  );
}
