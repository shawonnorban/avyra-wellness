"use client";

import Link from "next/link";
import { Loader2, Pencil, Plus, Search, Trash2, Warehouse as WarehouseIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Badge, Card, EmptyState, Spinner } from "@/components/ui/misc";
import { toApiError } from "@/lib/api";
import {
  useAdjustStock,
  useAdminProducts,
  useDeleteProduct,
  useDeleteWarehouse,
  useMe,
  useSaveWarehouse,
  useWarehouses,
  type Warehouse,
} from "@/lib/admin";
import { formatTaka, productImageUrl } from "@/lib/format";

const TABS = ["Products", "Warehouses"] as const;

export default function AdminInventoryPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Products");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Finished goods, stock levels and storage locations.
          </p>
        </div>

        <Link href="/admin/products/stock" className="text-sm text-primary hover:underline">
          Stock by variant →
        </Link>
      </div>

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
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-card text-foreground hover:bg-secondary",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Products" ? <ProductsTab /> : <WarehousesTab />}
    </div>
  );
}

function ProductsTab() {
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [adjusting, setAdjusting] = useState<{ id: string; name: string } | null>(null);

  const { data: me } = useMe();
  const { data, isLoading } = useAdminProducts({
    search: search || undefined,
    low_stock: lowStockOnly || undefined,
  });
  const removeProduct = useDeleteProduct();

  const products = data?.data ?? [];
  const canEdit = me?.permissions.inventory?.edit ?? false;
  const canCreate = me?.permissions.inventory?.create ?? false;
  const canDelete = me?.permissions.inventory?.delete ?? false;

  const confirmDelete = async (product: { id: string; name: string }) => {
    if (!window.confirm(`Delete “${product.name}”? Products already on an order are deactivated instead.`)) {
      return;
    }

    try {
      const result = await removeProduct.mutateAsync(product.id);
      toast.success(result.message);
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{data?.total ?? 0} products</p>

        {canCreate && (
          <ButtonLink href="/admin/products/new">
            <Plus className="h-4 w-4" /> New product
          </ButtonLink>
        )}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-64 flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Search by name or SKU"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              aria-label="Search products"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            Low stock only
          </label>
        </div>
      </Card>

      <Card className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No products"
              description="Add a product to get started."
              action={canCreate ? <ButtonLink href="/admin/products/new">New product</ButtonLink> : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="w-14 py-3 pl-4 pr-2 font-medium">Image</th>
                  <th className="py-3 pr-4 font-medium">Product</th>
                  <th className="py-3 pr-4 font-medium">SKU</th>
                  <th className="py-3 pr-4 text-right font-medium">Cost</th>
                  <th className="py-3 pr-4 text-right font-medium">Price</th>
                  <th className="py-3 pr-4 text-right font-medium">Sold</th>
                  <th className="py-3 pr-4 text-right font-medium">Stock</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4" />
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {products.map((product) => {
                  const status =
                    product.quantity === 0
                      ? { label: "Out of stock", tone: "danger" as const }
                      : product.quantity <= product.min_stock
                        ? { label: "Low stock", tone: "warning" as const }
                        : { label: "In stock", tone: "success" as const };

                  return (
                    <tr key={product.id} className="hover:bg-muted/50">
                      <td className="py-3 pl-4 pr-2">
                        {product.images?.[0] ? (
                          /* Admin-entered URLs are resolved by the API, so a plain img is right. */
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={productImageUrl(product.images[0])}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <span className="block h-10 w-10 rounded bg-secondary" aria-hidden />
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {product.name}
                        </Link>
                        {!product.is_active && <Badge tone="neutral" className="ml-2">Inactive</Badge>}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{product.sku}</td>
                      <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground">
                        {formatTaka(product.cost_price)}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                        {product.compare_at_price != null && product.compare_at_price > product.sell_price && (
                          <s className="mr-1.5 text-xs text-muted-foreground">
                            {formatTaka(product.compare_at_price)}
                          </s>
                        )}
                        {formatTaka(product.sell_price)}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground">
                        {product.sold_count ?? 0}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-foreground">{product.quantity}</td>
                      <td className="py-3 pr-4">
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/products/${product.id}`}>
                            <Button size="sm" variant="outline" aria-label={`Edit ${product.name}`}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAdjusting({ id: product.id, name: product.name })}
                            >
                              Adjust
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => confirmDelete(product)}
                              disabled={removeProduct.isPending}
                              aria-label={`Delete ${product.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {adjusting && (
        <AdjustStockDialog
          productId={adjusting.id}
          productName={adjusting.name}
          onClose={() => setAdjusting(null)}
        />
      )}
    </div>
  );
}

function AdjustStockDialog({
  productId,
  productName,
  onClose,
}: {
  productId: string;
  productName: string;
  onClose: () => void;
}) {
  const [changeQty, setChangeQty] = useState("");
  const [notes, setNotes] = useState("");
  const adjust = useAdjustStock();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const qty = Number(changeQty);
    if (!Number.isFinite(qty) || qty === 0) {
      toast.error("Enter a non-zero quantity. Use a negative number to reduce stock.");
      return;
    }

    try {
      await adjust.mutateAsync({ productId, change_qty: qty, notes: notes || undefined });
      toast.success("Stock adjusted");
      onClose();
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  return (
    <Dialog title="Adjust stock" subtitle={productName} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field
          label="Quantity change"
          required
          hint="Positive to add, negative to remove. This writes a movement to the ledger."
        >
          <Input
            type="number"
            value={changeQty}
            onChange={(e) => setChangeQty(e.target.value)}
            required
            placeholder="-5"
            autoFocus
          />
        </Field>

        <Field label="Reason">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Damaged in storage" />
        </Field>

        <div className="flex gap-2">
          <Button type="submit" block disabled={adjust.isPending}>
            {adjust.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
          <Button type="button" variant="subtle" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Dialog>
  );
}

/* ---------- Warehouses ---------- */

function WarehousesTab() {
  const { data: me } = useMe();
  const { data: warehouses, isLoading } = useWarehouses();
  const save = useSaveWarehouse();
  const remove = useDeleteWarehouse();

  const [editing, setEditing] = useState<Warehouse | "new" | null>(null);

  const canCreate = me?.permissions.inventory?.create ?? false;
  const canDelete = me?.permissions.inventory?.delete ?? false;

  const confirmDelete = async (warehouse: Warehouse) => {
    if (!window.confirm(`Remove “${warehouse.name}”?`)) return;

    try {
      await remove.mutateAsync(warehouse.id);
      toast.success("Warehouse removed");
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {canCreate && (
        <div className="flex justify-end">
          <Button onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" /> New warehouse
          </Button>
        </div>
      )}

      {(warehouses ?? []).length === 0 ? (
        <EmptyState title="No warehouses" description="Add one to track where stock is held." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(warehouses ?? []).map((warehouse) => (
            <Card key={warehouse.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 truncate font-semibold text-foreground">
                    <WarehouseIcon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    {warehouse.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">{warehouse.code}</p>
                </div>
                <Badge tone={warehouse.is_active ? "success" : "neutral"}>
                  {warehouse.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              {warehouse.address && (
                <p className="mt-3 text-sm text-muted-foreground">{warehouse.address}</p>
              )}

              <p className="mt-3 text-xs text-muted-foreground">
                {warehouse.stock_movements_count} stock movement
                {warehouse.stock_movements_count === 1 ? "" : "s"}
              </p>

              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(warehouse)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                {canDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => confirmDelete(warehouse)}
                    aria-label={`Remove ${warehouse.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <WarehouseDialog
          warehouse={editing === "new" ? null : editing}
          saving={save.isPending}
          onSave={async (payload) => {
            try {
              await save.mutateAsync({
                id: editing === "new" ? undefined : editing.id,
                payload,
              });
              toast.success("Warehouse saved");
              setEditing(null);
            } catch (error) {
              toast.error(toApiError(error).message);
            }
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function WarehouseDialog({
  warehouse,
  saving,
  onSave,
  onClose,
}: {
  warehouse: Warehouse | null;
  saving: boolean;
  onSave: (payload: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: warehouse?.name ?? "",
    code: warehouse?.code ?? "",
    address: warehouse?.address ?? "",
    is_active: warehouse?.is_active ?? true,
  });

  return (
    <Dialog title={warehouse ? "Edit warehouse" : "New warehouse"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...form, address: form.address || null });
        }}
        className="space-y-4"
      >
        <Field label="Name" required>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
        </Field>

        <Field label="Code" required hint="Short unique identifier, e.g. DHK-1.">
          <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
        </Field>

        <Field label="Address">
          <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </Field>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="h-4 w-4 rounded border-input accent-primary"
          />
          Active
        </label>

        <div className="flex gap-2">
          <Button type="submit" block disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
          <Button type="button" variant="subtle" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Dialog>
  );
}

function Dialog({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
      role="dialog"
      aria-modal="true"
    >
      <button type="button" className="fixed inset-0 bg-black/50" onClick={onClose} aria-label="Close" />
      <Card className="relative my-12 w-full max-w-md">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-4">{children}</div>
      </Card>
    </div>
  );
}
