"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, PackageCheck, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import api, { toApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Badge, Card, EmptyState, Spinner } from "@/components/ui/misc";
import { useAdminProducts, useMe } from "@/lib/admin";
import { formatDate, formatTaka } from "@/lib/format";
import type { Paginated } from "@/lib/types";

type PurchaseItem = {
  id: string;
  product_name: string;
  variant_label: string | null;
  quantity: number;
  received_qty: number;
  rejected_qty: number;
  unit: string;
  unit_price: number;
  total_cost: number;
};

type PurchaseRow = {
  id: string;
  purchase_number: string;
  supplier_name: string;
  status: string;
  order_date: string;
  received_date: string | null;
  items_count: number;
  total: number;
  paid_amount: number;
  items?: PurchaseItem[];
};

type Supplier = { id: string; name: string; code: string };

type PurchaseLine = {
  product_id: string;
  /** Blank when the product has no variants, or none has been picked yet. */
  variant_id: string;
  quantity: string;
  unit_price: string;
};

const BLANK_LINE: PurchaseLine = { product_id: "", variant_id: "", quantity: "1", unit_price: "" };

/**
 * Variant picker for one purchase line.
 *
 * Stock lives on the variant, so a purchase that does not name one refills the
 * product and leaves every variant untouched — the numbers then never reconcile
 * against orders, which are always variant-level.
 *
 * Products with no variants get a disabled placeholder rather than an empty
 * dropdown, so it is clear there is nothing to choose rather than something
 * missing.
 */
function VariantSelect({
  products,
  line,
  onChange,
}: {
  products: { id: string; name: string; variants?: { id: string; size: string | null; color: string | null; sku_suffix: string }[] }[];
  line: PurchaseLine;
  onChange: (variantId: string) => void;
}) {
  const variants = products.find((p) => p.id === line.product_id)?.variants ?? [];

  if (line.product_id && variants.length === 0) {
    return (
      <Select value="" disabled aria-label="Variant">
        <option value="">No variants</option>
      </Select>
    );
  }

  return (
    <Select
      value={line.variant_id}
      onChange={(e) => onChange(e.target.value)}
      required={variants.length > 0}
      disabled={!line.product_id}
      aria-label="Variant"
    >
      <option value="">{line.product_id ? "Choose a variant" : "Variant"}</option>
      {variants.map((variant) => (
        <option key={variant.id} value={variant.id}>
          {[variant.size, variant.color].filter(Boolean).join(" / ") || variant.sku_suffix}
        </option>
      ))}
    </Select>
  );
}

const TABS = ["Purchases", "Suppliers"] as const;

export default function AdminPurchasePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Purchases");

  const { data: stats } = useQuery({
    queryKey: ["admin", "purchase", "stats"],
    queryFn: async () => {
      const { data } = await api.get<{
        data: { pending_purchases: number; received_today: number; payable: number; mtd_spend: number };
      }>("/admin/purchases/stats");
      return data.data;
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Purchase</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Order stock from suppliers, then receive it into inventory.
        </p>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="Pending" value={String(stats.pending_purchases)} />
          <Tile label="Received today" value={String(stats.received_today)} />
          <Tile label="Payable" value={formatTaka(stats.payable)} />
          <Tile label="Spend this month" value={formatTaka(stats.mtd_spend)} />
        </div>
      )}

      <div className="flex gap-2">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            aria-pressed={tab === item}
            className={twMerge(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              tab === item
                ? "border-primary bg-primary text-white"
                : "border-input bg-white text-foreground hover:border-input",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Purchases" ? <PurchasesTab /> : <SuppliersTab />}
    </div>
  );
}

function PurchasesTab() {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const [creating, setCreating] = useState(false);
  const [receiving, setReceiving] = useState<PurchaseRow | null>(null);

  const canCreate = me?.permissions.purchase?.create ?? false;
  const canReceive = me?.permissions.purchase?.approve ?? false;

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "purchases"],
    queryFn: async () => {
      const { data } = await api.get<Paginated<PurchaseRow>>("/admin/purchases");
      return data;
    },
  });

  const purchases = data?.data ?? [];

  const openReceive = async (purchase: PurchaseRow) => {
    const { data } = await api.get<{ data: PurchaseRow }>(`/admin/purchases/${purchase.id}`);
    setReceiving(data.data);
  };

  return (
    <>
      {canCreate && (
        <div className="flex justify-end">
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New purchase
          </Button>
        </div>
      )}

      <Card className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="text-primary" />
          </div>
        ) : purchases.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No purchases yet"
              description="Create one to record incoming stock from a supplier."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-3 pl-4 pr-4 font-medium">Number</th>
                  <th className="py-3 pr-4 font-medium">Supplier</th>
                  <th className="py-3 pr-4 font-medium">Ordered</th>
                  <th className="py-3 pr-4 text-right font-medium">Items</th>
                  <th className="py-3 pr-4 text-right font-medium">Total</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  {canReceive && <th className="py-3 pr-4" />}
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-muted/50">
                    <td className="py-3 pl-4 pr-4 font-medium text-foreground">
                      {purchase.purchase_number}
                    </td>
                    <td className="py-3 pr-4 text-foreground">{purchase.supplier_name}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{formatDate(purchase.order_date)}</td>
                    <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground">
                      {purchase.items_count}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                      {formatTaka(purchase.total)}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        tone={
                          purchase.status === "Received"
                            ? "success"
                            : purchase.status === "Partial"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {purchase.status}
                      </Badge>
                    </td>
                    {canReceive && (
                      <td className="py-3 pr-4 text-right">
                        {purchase.status !== "Received" && purchase.status !== "Cancelled" && (
                          <Button size="sm" variant="outline" onClick={() => openReceive(purchase)}>
                            <PackageCheck className="h-3.5 w-3.5" /> Receive
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {creating && (
        <CreatePurchaseDialog
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            queryClient.invalidateQueries({ queryKey: ["admin", "purchases"] });
          }}
        />
      )}

      {receiving && (
        <ReceiveDialog
          purchase={receiving}
          onClose={() => setReceiving(null)}
          onSaved={() => {
            setReceiving(null);
            queryClient.invalidateQueries({ queryKey: ["admin", "purchases"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
          }}
        />
      )}
    </>
  );
}

function CreatePurchaseDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { data: suppliers } = useQuery({
    queryKey: ["admin", "suppliers"],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Supplier>>("/admin/suppliers");
      return data.data;
    },
  });
  const { data: products } = useAdminProducts();

  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState<PurchaseLine[]>([BLANK_LINE]);

  const create = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/admin/purchases", {
        supplier_id: supplierId,
        items: lines.map((line) => ({
          product_id: line.product_id,
          // Stock is held per variant, so a purchase has to say which one it
          // refills. Products without variants send null and stock lands on the
          // product itself.
          variant_id: line.variant_id || null,
          quantity: Number(line.quantity),
          unit_price: Number(line.unit_price),
        })),
      });
      return data;
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await create.mutateAsync();
      toast.success("Purchase created");
      onSaved();
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  return (
    <Dialog title="New purchase" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Supplier" required>
          <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
            <option value="">Choose a supplier</option>
            {(suppliers ?? []).map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="space-y-3">
          {lines.map((line, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_5rem_7rem_auto]">
              <Select
                value={line.product_id}
                onChange={(e) =>
                  // Clearing the variant matters: a variant from the previous
                  // product would fail validation and, worse, could refill the
                  // wrong shelf.
                  setLines(lines.map((l, idx) =>
                    idx === i ? { ...l, product_id: e.target.value, variant_id: "" } : l,
                  ))
                }
                required
                aria-label="Product"
              >
                <option value="">Product</option>
                {(products?.data ?? []).map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>

              <VariantSelect
                products={products?.data ?? []}
                line={line}
                onChange={(variantId) =>
                  setLines(lines.map((l, idx) => (idx === i ? { ...l, variant_id: variantId } : l)))
                }
              />

              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={line.quantity}
                onChange={(e) =>
                  setLines(lines.map((l, idx) => (idx === i ? { ...l, quantity: e.target.value } : l)))
                }
                required
                aria-label="Quantity"
              />

              <Input
                type="number"
                min="0"
                step="0.01"
                value={line.unit_price}
                onChange={(e) =>
                  setLines(lines.map((l, idx) => (idx === i ? { ...l, unit_price: e.target.value } : l)))
                }
                required
                placeholder="Unit cost"
                aria-label="Unit cost"
              />

              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setLines(lines.filter((_, idx) => idx !== i))}
                disabled={lines.length === 1}
                aria-label="Remove line"
              >
                ×
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setLines([...lines, BLANK_LINE])}
        >
          Add line
        </Button>

        <div className="flex gap-2 pt-2">
          <Button type="submit" block disabled={create.isPending}>
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
          </Button>
          <Button type="button" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function ReceiveDialog({
  purchase,
  onClose,
  onSaved,
}: {
  purchase: PurchaseRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  // Default each line to the full outstanding quantity — the common case.
  const [lines, setLines] = useState(
    (purchase.items ?? []).map((item) => ({
      item_id: item.id,
      // The variant is the whole point of the line — receiving 20 pieces means
      // nothing until you know which shelf they go on.
      name: [item.product_name, item.variant_label].filter(Boolean).join(" · "),
      pending: item.quantity - item.received_qty - item.rejected_qty,
      received_qty: String(item.quantity - item.received_qty - item.rejected_qty),
      rejected_qty: "0",
    })),
  );

  const receive = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/admin/purchases/${purchase.id}/receive`, {
        lines: lines.map((line) => ({
          item_id: line.item_id,
          received_qty: Number(line.received_qty),
          rejected_qty: Number(line.rejected_qty),
        })),
      });
      return data;
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await receive.mutateAsync();
      toast.success("Stock received");
      onSaved();
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  return (
    <Dialog title={`Receive ${purchase.purchase_number}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Received quantities are added to inventory and written to the stock ledger.
        </p>

        <div className="space-y-3">
          {lines.map((line, i) => (
            <div key={line.item_id} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-foreground">{line.name}</p>
              <p className="text-xs text-muted-foreground">Outstanding: {line.pending}</p>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <Field label="Received">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.received_qty}
                    onChange={(e) =>
                      setLines(lines.map((l, idx) => (idx === i ? { ...l, received_qty: e.target.value } : l)))
                    }
                  />
                </Field>
                <Field label="Rejected">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.rejected_qty}
                    onChange={(e) =>
                      setLines(lines.map((l, idx) => (idx === i ? { ...l, rejected_qty: e.target.value } : l)))
                    }
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button type="submit" block disabled={receive.isPending}>
            {receive.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Receive stock"}
          </Button>
          <Button type="button" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function SuppliersTab() {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const canCreate = me?.permissions.purchase?.create ?? false;

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "suppliers"],
    queryFn: async () => {
      const { data } = await api.get<
        Paginated<Supplier & { contact_phone: string | null; outstanding: number; total_pos: number }>
      >("/admin/suppliers");
      return data;
    },
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/admin/suppliers", { name, contact_phone: phone || undefined });
      return data;
    },
    onSuccess: () => {
      setName("");
      setPhone("");
      queryClient.invalidateQueries({ queryKey: ["admin", "suppliers"] });
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await create.mutateAsync();
      toast.success("Supplier added");
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  const suppliers = data?.data ?? [];

  return (
    <div className="space-y-5">
      {canCreate && (
        <Card>
          <h2 className="text-sm font-semibold text-foreground">Add a supplier</h2>
          <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Supplier name"
              aria-label="Supplier name"
            />
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone (optional)"
              aria-label="Phone"
            />
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </form>
        </Card>
      )}

      <Card className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="text-primary" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No suppliers yet" />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {suppliers.map((supplier) => (
              <li key={supplier.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div>
                  <p className="font-medium text-foreground">{supplier.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {supplier.code}
                    {supplier.contact_phone && ` · ${supplier.contact_phone}`}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-foreground">{formatTaka(supplier.outstanding)} outstanding</p>
                  <p className="text-xs text-muted-foreground">{supplier.total_pos} purchase(s)</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4" role="dialog" aria-modal="true">
      <button type="button" className="fixed inset-0 bg-black/50" onClick={onClose} aria-label="Close" />
      <Card className="relative my-8 w-full max-w-lg">
        <h2 className="mb-4 text-base font-semibold text-foreground">{title}</h2>
        {children}
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
