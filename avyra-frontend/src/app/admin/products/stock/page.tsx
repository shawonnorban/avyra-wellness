"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Layers, PackageX, Search, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import api from "@/lib/api";
import { Input } from "@/components/ui/field";
import { Badge, Card, EmptyState, Spinner } from "@/components/ui/misc";
import { formatTaka } from "@/lib/format";

type StockRow = {
  id: string;
  product_id: string;
  product_name: string | null;
  label: string;
  sku: string;
  quantity: number;
  cost_price: number;
  sell_price: number;
  cost_value: number;
  retail_value: number;
  sold_count: number;
  is_active: boolean;
  is_low: boolean;
  is_out: boolean;
};

type StockSummary = {
  variants: number;
  units: number;
  cost_value: number;
  retail_value: number;
  potential_profit: number;
  sold_units: number;
  low: number;
  out: number;
};

/**
 * Stock held per variant.
 *
 * Deliberately its own screen rather than more columns on the Variants editor:
 * that one is for changing a variant, this one answers "what am I holding across
 * the whole catalogue, and what is it worth" — a question no per-product page
 * can answer.
 */
export default function AdminStockPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stock", search],
    queryFn: async () => {
      const { data } = await api.get<{ data: StockRow[]; summary: StockSummary }>(
        "/admin/products/stock",
        { params: { search: search || undefined } },
      );
      return data;
    },
    placeholderData: (previous) => previous,
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="text-primary" />
      </div>
    );
  }

  const { summary } = data;
  const rows = data.data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Stock by variant</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {summary.variants} variants · {summary.units.toLocaleString("en-IN")} pieces on hand
          </p>
        </div>

        <Link href="/admin/products" className="text-sm text-primary hover:underline">
          ← All products
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Pieces in stock" value={summary.units.toLocaleString("en-IN")} icon={Layers} />
        <Tile label="Stock value (cost)" value={formatTaka(summary.cost_value)} icon={Wallet} accent />
        <Tile label="If sold at retail" value={formatTaka(summary.retail_value)} icon={TrendingUp} />
        <Tile
          label="Margin on the shelf"
          value={formatTaka(summary.potential_profit)}
          icon={TrendingUp}
        />
      </div>

      {(summary.low > 0 || summary.out > 0) && (
        <Card className="flex flex-wrap items-center gap-x-6 gap-y-2 border-warning/40 bg-warning/[0.06]">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />
            Needs attention
          </span>
          {summary.out > 0 && (
            <span className="text-sm text-muted-foreground">
              <strong className="text-destructive">{summary.out}</strong> out of stock
            </span>
          )}
          {summary.low > 0 && (
            <span className="text-sm text-muted-foreground">
              <strong className="text-warning">{summary.low}</strong> running low
            </span>
          )}
        </Card>
      )}

      <Card className="p-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Product, variant or SKU"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Search stock"
          />
        </div>
      </Card>

      <Card className="p-0">
        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No variants found" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-3 pl-4 pr-4 font-medium">Product / variant</th>
                  <th className="py-3 pr-4 font-medium">SKU</th>
                  <th className="py-3 pr-4 text-right font-medium">In stock</th>
                  <th className="py-3 pr-4 text-right font-medium">Cost value</th>
                  <th className="py-3 pr-4 text-right font-medium">Retail value</th>
                  <th className="py-3 pr-4 text-right font-medium">Sold</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/50">
                    <td className="py-3 pl-4 pr-4">
                      <Link
                        href={`/admin/products/${row.product_id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {row.product_name ?? "—"}
                      </Link>
                      <span className="block text-xs text-muted-foreground">{row.label}</span>
                    </td>

                    <td className="py-3 pr-4 text-xs text-muted-foreground">{row.sku}</td>

                    <td
                      className={twMerge(
                        "py-3 pr-4 text-right font-medium tabular-nums",
                        row.is_out ? "text-destructive" : row.is_low ? "text-warning" : "text-foreground",
                      )}
                    >
                      {row.quantity.toLocaleString("en-IN")}
                    </td>

                    <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                      {formatTaka(row.cost_value)}
                      <span className="block text-[11px] text-muted-foreground">
                        @ {formatTaka(row.cost_price)}
                      </span>
                    </td>

                    <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                      {formatTaka(row.retail_value)}
                      <span className="block text-[11px] text-muted-foreground">
                        @ {formatTaka(row.sell_price)}
                      </span>
                    </td>

                    <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground">
                      {row.sold_count.toLocaleString("en-IN")}
                    </td>

                    <td className="py-3 pr-4">
                      {row.is_out ? (
                        <Badge tone="danger">
                          <PackageX className="mr-1 inline h-3 w-3" aria-hidden />
                          Out of stock
                        </Badge>
                      ) : row.is_low ? (
                        <Badge tone="warning">Low</Badge>
                      ) : !row.is_active ? (
                        <Badge tone="neutral">Inactive</Badge>
                      ) : (
                        <Badge tone="success">In stock</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-xs text-muted-foreground">
        Sold counts confirmed and delivered orders only — a pending order is a request, not a sale.
        Orders placed before variants existed carry no variant, so they count against the product but
        not against a row here. Low-stock uses the parent product&apos;s threshold, since variants
        have none of their own.
      </p>
    </div>
  );
}

function Tile({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon: typeof Layers;
  accent?: boolean;
}) {
  return (
    <Card className={twMerge(accent && "border-primary/25 bg-gradient-to-br from-primary/[0.07] to-transparent")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className={twMerge("h-4 w-4", accent ? "text-primary" : "text-muted-foreground")} aria-hidden />
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
    </Card>
  );
}
