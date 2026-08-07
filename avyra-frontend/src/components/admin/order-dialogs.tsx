"use client";

import { Loader2, Plus, Trash2, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge, Card, Spinner, statusTone } from "@/components/ui/misc";
import { toApiError } from "@/lib/api";
import {
  useAdminProducts,
  useDispatchOrder,
  useOrderDetail,
  useUpdateOrder,
} from "@/lib/admin";
import { formatDateTime, formatTaka } from "@/lib/format";
import type { AdminOrder } from "@/lib/types";

const PAYMENT_METHODS = ["COD", "Cash", "bKash", "Nagad", "Rocket", "Bank Transfer", "Card"];

function Modal({
  title,
  subtitle,
  width = "max-w-2xl",
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  width?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button type="button" className="fixed inset-0 bg-black/50" onClick={onClose} aria-label="Close" />

      <Card className={`relative my-10 w-full ${width} p-0`}>
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-5 py-4">{children}</div>

        {footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>}
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span>{" "}
      <span className="font-medium text-foreground">{value ?? "—"}</span>
    </div>
  );
}

/* ---------- View ---------- */

export function OrderViewDialog({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const { data, isLoading } = useOrderDetail(orderId);
  const dispatchOrder = useDispatchOrder();

  if (isLoading || !data) {
    return (
      <Modal title="Order details" onClose={onClose}>
        <div className="flex justify-center py-12">
          <Spinner className="text-primary" />
        </div>
      </Modal>
    );
  }

  const { data: order, risk, invoice } = data;
  const currency = invoice.company.currency_symbol;
  const consignment = order.consignments?.[0];
  const blocked = risk.find((r) => r.action_taken === "blocked" || r.action_taken === "flagged");

  const sendToCourier = async () => {
    try {
      const created = await dispatchOrder.mutateAsync({ orderId });
      toast.success(`Sent to courier · ${created.tracking_code ?? "pending code"}`);
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  return (
    <Modal title={`Order Details — ${order.order_number}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Detail label="Source" value={order.order_source ?? "POS"} />
          {/* `created_at`, not `order_date` — the latter carries no time. */}
          <Detail label="Date" value={formatDateTime(order.created_at)} />
          <Detail label="Customer" value={order.customer.name} />
          <Detail label="Phone" value={order.customer.phone} />
          <div className="col-span-2">
            <Detail label="Address" value={order.customer.address} />
          </div>
          <Detail label="Payment" value={order.payment.method ?? "COD"} />
          <Detail label="Zone" value={order.delivery_zone ?? "—"} />
          {order.payment.sender_number && (
            <Detail label="Payment No" value={order.payment.sender_number} />
          )}
          {order.payment.txn_ref && <Detail label="TrxID" value={order.payment.txn_ref} />}

          <div>
            <span className="text-muted-foreground">Status:</span>{" "}
            <Badge tone={statusTone(order.status)}>{order.status}</Badge>
          </div>
          <Detail label="Amount" value={formatTaka(order.total, currency)} />

          {order.status_reason && (
            <div className="col-span-2">
              <Detail label={`${order.status} reason`} value={order.status_reason} />
            </div>
          )}

          {order.notes && (
            <div className="col-span-2">
              <Detail label="Note" value={order.notes} />
            </div>
          )}

          <div className="col-span-2">
            <span className="text-muted-foreground">Courier:</span>{" "}
            {consignment ? (
              <Badge tone="info">
                <Truck className="mr-1 inline h-3 w-3" />
                {consignment.courier} — {consignment.status}
                {consignment.tracking_code && ` · ${consignment.tracking_code}`}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">Not assigned</span>
            )}
          </div>
        </div>

        {blocked && (
          <div className="rounded-sm border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm font-medium text-destructive">
              Fraud check: {blocked.risk_level} ({blocked.risk_score})
            </p>
            <ul className="mt-1 space-y-0.5">
              {(blocked.signals ?? []).map((signal) => (
                <li key={signal.code} className="text-xs text-foreground">
                  {signal.label} <span className="text-muted-foreground">(+{signal.score})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {order.attribution && (
          <div className="rounded-sm border border-border bg-muted/40 p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Marketing attribution
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {order.attribution.utm_source && <Detail label="Source" value={order.attribution.utm_source} />}
              {order.attribution.utm_medium && <Detail label="Medium" value={order.attribution.utm_medium} />}
              {order.attribution.utm_campaign && (
                <Detail label="Campaign" value={order.attribution.utm_campaign} />
              )}
              {order.attribution.landing_url && (
                <div className="col-span-2 break-all">
                  <Detail label="Landing" value={order.attribution.landing_url} />
                </div>
              )}
            </div>
          </div>
        )}

        {!consignment && (
          <div className="flex items-center gap-2 rounded-sm border border-border bg-muted/50 p-3">
            <Truck className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span className="flex-1 text-xs text-muted-foreground">Send this order via courier</span>
            <Button size="sm" onClick={sendToCourier} disabled={dispatchOrder.isPending}>
              {dispatchOrder.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Steadfast"}
            </Button>
          </div>
        )}

        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Products
          </h4>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="w-16 py-1.5 pr-3 font-medium">Image</th>
                <th className="py-1.5 pr-3 font-medium">Product</th>
                <th className="py-1.5 pr-3 text-right font-medium">Qty</th>
                <th className="py-1.5 pr-3 text-right font-medium">Price</th>
                <th className="py-1.5 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(order.items ?? []).map((item) => (
                <tr key={item.id}>
                  <td className="py-2 pr-3">
                    {item.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.image} alt="" className="h-12 w-12 rounded object-cover" />
                    ) : (
                      <span className="block h-12 w-12 rounded bg-secondary" aria-hidden />
                    )}
                  </td>
                  <td className="py-2 pr-3 font-medium text-foreground">
                    {item.product_name}
                    {item.variant_label && (
                      <span className="block text-xs text-muted-foreground">{item.variant_label}</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">{item.quantity}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">
                    {formatTaka(item.unit_price, currency)}
                  </td>
                  <td className="py-2 text-right font-semibold tabular-nums text-primary">
                    {formatTaka(item.total_price, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
            <Row label="Subtotal" value={formatTaka(order.subtotal, currency)} />
            {order.discount > 0 && (
              <Row
                label={`Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}`}
                value={`− ${formatTaka(order.discount, currency)}`}
              />
            )}
            <Row label="Delivery" value={formatTaka(order.delivery_charge, currency)} />
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
              <dt>Total</dt>
              <dd className="tabular-nums text-primary">{formatTaka(order.total, currency)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

/* ---------- Edit ---------- */

type EditLine = { product_id: string; variant_id: string; quantity: string; unit_price: string };

export function OrderEditDialog({
  order,
  onClose,
}: {
  order: AdminOrder;
  onClose: () => void;
}) {
  const { data: detail, isLoading } = useOrderDetail(order.id);
  const { data: productPage } = useAdminProducts({});
  const update = useUpdateOrder();

  const products = productPage?.data ?? [];

  if (isLoading || !detail) {
    return (
      <Modal title={`Edit Order — ${order.order_number}`} onClose={onClose}>
        <div className="flex justify-center py-12">
          <Spinner className="text-primary" />
        </div>
      </Modal>
    );
  }

  return (
    <EditForm
      order={detail.data}
      products={products}
      saving={update.isPending}
      onSave={async (payload) => {
        try {
          await update.mutateAsync({ id: order.id, payload });
          toast.success("Order updated");
          onClose();
        } catch (error) {
          toast.error(toApiError(error).message);
        }
      }}
      onClose={onClose}
    />
  );
}

function EditForm({
  order,
  products,
  saving,
  onSave,
  onClose,
}: {
  order: AdminOrder;
  products: { id: string; name: string; sku: string; sell_price: number; is_active: boolean }[];
  saving: boolean;
  onSave: (payload: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    customer_name: order.customer.name,
    phone: order.customer.phone ?? "",
    address: order.customer.address ?? "",
    payment_method: order.payment.method ?? "COD",
    delivery_charge: String(order.delivery_charge),
    discount: String(order.discount),
    notes: order.notes ?? "",
  });

  const [lines, setLines] = useState<EditLine[]>(
    (order.items ?? []).map((item) => ({
      product_id: item.product_id ?? "",
      variant_id: item.variant_id ?? "",
      quantity: String(item.quantity),
      unit_price: String(item.unit_price),
    })),
  );

  const setLine = (index: number, patch: Partial<EditLine>) =>
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + Number(l.unit_price || 0) * Number(l.quantity || 0), 0),
    [lines],
  );

  const total = Math.max(0, subtotal - Number(form.discount || 0)) + Number(form.delivery_charge || 0);

  const submit = () => {
    const items = lines
      .filter((line) => line.product_id && Number(line.quantity) > 0)
      .map((line) => ({
        product_id: line.product_id,
        variant_id: line.variant_id || null,
        quantity: Number(line.quantity),
        unit_price: line.unit_price === "" ? undefined : Number(line.unit_price),
      }));

    if (items.length === 0) {
      toast.error("An order needs at least one product.");
      return;
    }

    onSave({
      customer_name: form.customer_name,
      phone: form.phone,
      address: form.address,
      payment_method: form.payment_method,
      delivery_charge: Number(form.delivery_charge || 0),
      discount: Number(form.discount || 0),
      notes: form.notes || null,
      items,
    });
  };

  return (
    <Modal
      title={`Edit Order — ${order.order_number}`}
      subtitle="Line items are replaced wholesale; stock is returned and re-deducted."
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Customer">
            <Input
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address">
              <Textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="min-h-16"
              />
            </Field>
          </div>
          <Field label="Payment method">
            <Select
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </Select>
          </Field>
          <Field label="Notes">
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <Field label="Discount">
            <Input
              type="number"
              step="0.01"
              min={0}
              value={form.discount}
              onChange={(e) => setForm({ ...form, discount: e.target.value })}
            />
          </Field>
          <Field label="Delivery charge">
            <Input
              type="number"
              step="0.01"
              min={0}
              value={form.delivery_charge}
              onChange={(e) => setForm({ ...form, delivery_charge: e.target.value })}
            />
          </Field>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Products</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setLines([...lines, { product_id: "", variant_id: "", quantity: "1", unit_price: "" }])
              }
            >
              <Plus className="h-3.5 w-3.5" /> Add product
            </Button>
          </div>

          {lines.map((line, i) => (
            <div key={i} className="grid gap-2 rounded-sm bg-secondary/50 p-3 sm:grid-cols-[1fr_5rem_7rem_auto]">
              <Select
                value={line.product_id}
                onChange={(e) => {
                  const picked = products.find((p) => p.id === e.target.value);
                  setLine(i, {
                    product_id: e.target.value,
                    unit_price: picked ? String(picked.sell_price) : line.unit_price,
                  });
                }}
                aria-label="Product"
              >
                <option value="">Select product</option>
                {products.filter((p) => p.is_active).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </Select>

              <Input
                type="number"
                min={1}
                value={line.quantity}
                onChange={(e) => setLine(i, { quantity: e.target.value })}
                aria-label="Quantity"
              />

              <Input
                type="number"
                step="0.01"
                min={0}
                value={line.unit_price}
                onChange={(e) => setLine(i, { unit_price: e.target.value })}
                aria-label="Unit price"
              />

              <Button
                size="icon"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setLines(lines.filter((_, index) => index !== i))}
                disabled={lines.length === 1}
                aria-label="Remove product"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <dl className="space-y-1 border-t border-border pt-3 text-sm">
          <Row label="Subtotal" value={formatTaka(subtotal)} />
          <div className="flex justify-between text-base font-bold text-foreground">
            <dt>Total</dt>
            <dd className="tabular-nums text-primary">{formatTaka(total)}</dd>
          </div>
        </dl>
      </div>
    </Modal>
  );
}

