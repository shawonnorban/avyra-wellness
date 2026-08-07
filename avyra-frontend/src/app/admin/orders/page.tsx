"use client";

import Link from "next/link";
import {
  BarChart3,
  Check,
  Eye,
  FileText,
  Loader2,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Truck,
} from "lucide-react";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Card, EmptyState, Spinner } from "@/components/ui/misc";
import { OrderEditDialog, OrderViewDialog } from "@/components/admin/order-dialogs";
import { toApiError } from "@/lib/api";
import { openInvoice } from "@/lib/invoice";
import { useStorefrontSettings } from "@/lib/queries";
import {
  useAdminOrders,
  useBulkDispatch,
  useDeleteOrder,
  useMe,
  useOrderStatusCounts,
  useUpdateOrderStatus,
  type OrderFilters,
} from "@/lib/admin";
import type { AdminOrder } from "@/lib/types";
import { formatDate, formatTaka, formatTime } from "@/lib/format";
import {
  ORDER_STATUSES,
  ORDER_STATUS_STYLES,
  orderStatusLabel,
} from "@/lib/order-status";

const STATUSES = ORDER_STATUSES;

/**
 * Quick-filter tabs across the top. `key` is the status filter sent to the API;
 * `today` is the one tab that filters by date instead.
 */
const TABS: { label: string; key: string | null; countKey: string; className: string }[] = [
  { label: "All Orders", key: null, countKey: "total", className: "bg-[#166534] text-white" },
  { label: "Today's Orders", key: "__today", countKey: "today", className: "bg-[#2563eb] text-white" },
  { label: "Pending", key: "pending", countKey: "pending", className: "bg-[#475569] text-white" },
  { label: "Confirmed", key: "confirm", countKey: "confirm", className: "bg-[#16a34a] text-white" },
  { label: "Delivered", key: "delivered", countKey: "delivered", className: "bg-[#0d9488] text-white" },
  { label: "Hold", key: "hold", countKey: "hold", className: "bg-[#eab308] text-white" },
  { label: "Fake", key: "fake", countKey: "fake", className: "bg-[#ea580c] text-white" },
  { label: "Cancelled", key: "cancel", countKey: "cancel", className: "bg-[#dc2626] text-white" },
];


export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<Spinner className="text-primary" />}>
      <OrdersView />
    </Suspense>
  );
}

function OrdersView() {
  const searchParams = useSearchParams();
  const { data: me } = useMe();

  const [activeTab, setActiveTab] = useState<string | null>(searchParams.get("status"));
  const [filters, setFilters] = useState<OrderFilters>({
    status: searchParams.get("status") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    page: 1,
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [viewing, setViewing] = useState<AdminOrder | null>(null);
  const [editing, setEditing] = useState<AdminOrder | null>(null);

  const { data: settings } = useStorefrontSettings();
  const { data, isLoading, isFetching } = useAdminOrders(filters);
  const { data: counts } = useOrderStatusCounts();
  const updateStatus = useUpdateOrderStatus();
  const bulkDispatch = useBulkDispatch();
  const removeOrder = useDeleteOrder();

  const orders = data?.data ?? [];
  const canEdit = me?.permissions.sales?.edit ?? false;
  const canCreate = me?.permissions.sales?.create ?? false;
  const canDelete = me?.permissions.sales?.delete ?? false;
  const canDispatch = me?.permissions.courier?.create ?? false;

  const setFilter = (patch: Partial<OrderFilters>) =>
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));

  const pickTab = (key: string | null) => {
    setActiveTab(key);

    // "Today" is a date filter, every other tab is a status filter.
    const today = new Date().toISOString().slice(0, 10);

    setFilter(
      key === "__today"
        ? { status: undefined, from: today, to: today }
        : { status: key ?? undefined, from: undefined, to: undefined },
    );
  };

  const toggleAll = () =>
    setSelected((prev) => (prev.length === orders.length ? [] : orders.map((o) => o.id)));

  const changeStatus = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Order marked ${status}`);
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  const confirmDelete = async (order: AdminOrder) => {
    if (!window.confirm(`Delete order ${order.order_number}? This cannot be undone.`)) return;

    try {
      await removeOrder.mutateAsync(order.id);
      toast.success("Order deleted");
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  const dispatchSelected = async () => {
    try {
      const result = await bulkDispatch.mutateAsync(selected);
      setSelected([]);

      if (result.dispatched.length > 0) {
        toast.success(`${result.dispatched.length} order(s) sent to courier`);
      }
      // Per-order failures are the common case (already dispatched, not confirmed),
      // so each reason is surfaced rather than a single generic error.
      result.failed.forEach((item) =>
        toast.error(`${item.order_number}: ${item.reason}`, { duration: 6000 }),
      );
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  /**
   * The invoice needs line items, which the list payload already carries, so it
   * opens straight away without another round trip.
   */
  const printInvoice = (order: AdminOrder) => {
    const company = settings?.company;

    const opened = openInvoice(order, order.items ?? [], {
      name: company?.name ?? "Avyra Wellness",
      tagline: company?.tagline,
      phone: company?.phone,
      email: company?.email,
      address: company?.address,
      logo_url: company?.logo_url,
      currency_symbol: company?.currency_symbol,
    });

    if (!opened) toast.error("Allow pop-ups for this site to print the invoice.");
  };

  const exportUrl = `${process.env.NEXT_PUBLIC_API_URL}/admin/orders/export`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales &amp; Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">Orders, shipment tracking &amp; revenue</p>
        </div>

        <div className="flex gap-2">
          {canDispatch && selected.length > 0 && (
            <Button onClick={dispatchSelected} disabled={bulkDispatch.isPending}>
              {bulkDispatch.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Truck className="h-4 w-4" /> Dispatch {selected.length}
                </>
              )}
            </Button>
          )}

          <a href={exportUrl} download>
            <Button variant="outline">
              <FileText className="h-4 w-4" /> Export
            </Button>
          </a>

          {canCreate && (
            <Link href="/admin/orders/new">
              <Button>
                <Plus className="h-4 w-4" /> New Order
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;

          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => pickTab(tab.key)}
              aria-pressed={active}
              className={twMerge(
                "inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-opacity",
                tab.className,
                active ? "opacity-100 ring-2 ring-offset-1 ring-current" : "opacity-90 hover:opacity-100",
              )}
            >
              {tab.key === null && <Check className="h-3.5 w-3.5" aria-hidden />}
              {tab.label}
              <span className="rounded bg-black/20 px-1.5 py-0.5 tabular-nums">
                {counts?.[tab.countKey] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="font-semibold text-foreground">
            {TABS.find((t) => t.key === activeTab)?.label ?? "All Orders"}
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                placeholder="Search orders..."
                defaultValue={filters.search ?? ""}
                onChange={(e) => setFilter({ search: e.target.value || undefined })}
                className="w-56 pl-9"
                aria-label="Search orders"
              />
            </div>

            <Select
              value={filters.status ?? ""}
              onChange={(e) => {
                setActiveTab(e.target.value || null);
                setFilter({ status: e.target.value || undefined, from: undefined, to: undefined });
              }}
              aria-label="Filter by status"
              className="w-40"
            >
              <option value="">All Status</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>{orderStatusLabel(status)}</option>
              ))}
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No orders found" description="Try a different filter." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={twMerge("w-full text-sm", isFetching && "opacity-60")}>
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="w-10 py-3 pl-5">
                    <input
                      type="checkbox"
                      checked={selected.length === orders.length && orders.length > 0}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-input accent-primary"
                      aria-label="Select all orders"
                    />
                  </th>
                  <th className="py-3 pr-4 font-semibold">Order</th>
                  <th className="py-3 pr-4 font-semibold">Customer</th>
                  <th className="py-3 pr-4 font-semibold">Products</th>
                  <th className="py-3 pr-4 font-semibold">Amount</th>
                  <th className="py-3 pr-4 font-semibold">Status</th>
                  <th className="py-3 pr-5 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    selected={selected.includes(order.id)}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onToggleSelect={() =>
                      setSelected((prev) =>
                        prev.includes(order.id)
                          ? prev.filter((id) => id !== order.id)
                          : [...prev, order.id],
                      )
                    }
                    onChangeStatus={(status) => changeStatus(order.id, status)}
                    onDelete={() => confirmDelete(order)}
                    onView={() => setViewing(order)}
                    onEdit={() => setEditing(order)}
                    onInvoice={() => printInvoice(order)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
            <span className="text-muted-foreground">
              Page {data.current_page} of {data.last_page}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.current_page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.current_page >= data.last_page}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {viewing && <OrderViewDialog orderId={viewing.id} onClose={() => setViewing(null)} />}
      {editing && <OrderEditDialog order={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function OrderRow({
  order,
  selected,
  canEdit,
  canDelete,
  onToggleSelect,
  onChangeStatus,
  onDelete,
  onView,
  onEdit,
  onInvoice,
}: {
  order: AdminOrder;
  selected: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onToggleSelect: () => void;
  onChangeStatus: (status: string) => void;
  onDelete: () => void;
  onView: () => void;
  onEdit: () => void;
  onInvoice: () => void;
}) {
  const phoneDigits = order.customer.phone?.replace(/\D/g, "") ?? "";

  return (
    <tr className="align-top hover:bg-muted/40">
      <td className="py-4 pl-5">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="h-4 w-4 rounded border-input accent-primary"
          aria-label={`Select ${order.order_number}`}
        />
      </td>

      <td className="py-4 pr-4">
        <Link
          href={`/admin/orders/${order.id}`}
          className="font-semibold text-foreground hover:text-primary hover:underline"
        >
          {order.order_number}
        </Link>
        <span className="mt-1 block text-xs text-muted-foreground">{formatDate(order.order_date)}</span>
        {/* The clock time comes from `created_at`. `order_date` is a date column,
            so it arrives as midnight and rendered every order at 06:00 am. */}
        <span className="block text-xs text-muted-foreground">{formatTime(order.created_at)}</span>
      </td>

      <td className="py-4 pr-4">
        <span className="block font-semibold text-foreground">{order.customer.name}</span>

        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          {order.customer.phone}
          {phoneDigits && (
            <>
              <a href={`tel:${phoneDigits}`} aria-label="Call customer" className="hover:text-primary">
                <Phone className="h-3 w-3" />
              </a>
              <a
                href={`https://wa.me/${phoneDigits}`}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Message on WhatsApp"
                className="hover:text-primary"
              >
                <MessageCircle className="h-3 w-3" />
              </a>
              <Link
                href={`/admin/customers?search=${encodeURIComponent(phoneDigits)}`}
                aria-label="Customer history"
                className="hover:text-primary"
              >
                <BarChart3 className="h-3 w-3" />
              </Link>
              <Link
                href={`/admin/fraud?search=${encodeURIComponent(phoneDigits)}`}
                aria-label="Fraud check"
                className="hover:text-primary"
              >
                <ShieldCheck className="h-3 w-3" />
              </Link>
            </>
          )}
        </span>

        <span className="mt-0.5 block max-w-56 truncate text-xs text-muted-foreground">
          {order.customer.address}
        </span>
      </td>

      <td className="py-4 pr-4">
        <span className="flex items-center gap-2">
          {order.thumbnail ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={order.thumbnail} alt="" className="h-10 w-10 rounded object-cover" />
          ) : (
            <span className="h-10 w-10 rounded bg-secondary" aria-hidden />
          )}
          <span className="text-primary">
            {order.items_count} item{order.items_count === 1 ? "" : "s"}
          </span>
        </span>
      </td>

      <td className="py-4 pr-4 font-semibold tabular-nums text-foreground">{formatTaka(order.total)}</td>

      <td className="py-4 pr-4">
        {canEdit ? (
          <Select
            value={order.status}
            onChange={(e) => onChangeStatus(e.target.value)}
            aria-label={`Status for ${order.order_number}`}
            className={twMerge(
              "w-32 border px-2 py-1 text-xs font-semibold",
              ORDER_STATUS_STYLES[order.status] ?? ORDER_STATUS_STYLES.pending,
            )}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>{orderStatusLabel(status)}</option>
            ))}
          </Select>
        ) : (
          <span
            className={twMerge(
              "inline-block rounded border px-2.5 py-1 text-xs font-semibold",
              ORDER_STATUS_STYLES[order.status] ?? ORDER_STATUS_STYLES.pending,
            )}
          >
            {orderStatusLabel(order.status)}
          </span>
        )}

        {order.status_reason && (
          <span className="mt-1.5 block max-w-40 text-[11px] leading-tight text-destructive">
            Reason: {order.status_reason}
          </span>
        )}
      </td>

      <td className="py-4 pr-5">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onView}
            aria-label={`View ${order.order_number}`}
            className="text-muted-foreground hover:text-primary"
          >
            <Eye className="h-4 w-4" />
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${order.order_number}`}
              className="text-muted-foreground hover:text-primary"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onInvoice}
            aria-label={`Invoice for ${order.order_number}`}
            className="text-muted-foreground hover:text-primary"
          >
            <FileText className="h-4 w-4" />
          </button>

          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Delete ${order.order_number}`}
              className="text-destructive/70 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
