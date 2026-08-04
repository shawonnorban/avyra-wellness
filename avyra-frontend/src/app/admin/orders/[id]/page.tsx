"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, Loader2, Printer, Truck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, use, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { Badge, Card, Spinner, statusTone } from "@/components/ui/misc";
import { toApiError } from "@/lib/api";
import {
  useDispatchOrder,
  useMe,
  useOrderCustomerHistory,
  useOrderDetail,
  useUpdateOrderStatus,
} from "@/lib/admin";
import { formatDate, formatDateTime, formatTaka } from "@/lib/format";

const STATUSES = [
  "Pending", "Confirmed", "Processing", "Ready", "In Courier", "Shipped",
  "Delivered", "Paid", "Hold", "Ship Later", "Returned", "Lost", "Cancelled", "Incomplete",
];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Spinner className="text-primary" />}>
      <OrderDetail params={params} />
    </Suspense>
  );
}

function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const { data, isLoading } = useOrderDetail(id);
  const { data: history } = useOrderCustomerHistory(id);
  const { data: me } = useMe();

  const updateStatus = useUpdateOrderStatus();
  const dispatchOrder = useDispatchOrder();
  const [printing, setPrinting] = useState(false);

  // Printing swaps to an invoice-only layout, so it needs no separate route or popup.
  const print = useCallback(() => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 50);
  }, []);

  // The orders list links here with ?print=1 for its invoice action.
  const wantsPrint = searchParams.get("print") === "1";

  useEffect(() => {
    if (!wantsPrint || !data) return;

    const timer = setTimeout(print, 400);
    return () => clearTimeout(timer);
  }, [wantsPrint, data, print]);

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="text-primary" />
      </div>
    );
  }

  const { data: order, risk, invoice } = data;
  const currency = invoice.company.currency_symbol;
  const canEdit = me?.permissions.sales?.edit ?? false;
  const canDispatch = me?.permissions.courier?.create ?? false;

  const changeStatus = async (status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Order marked ${status}`);
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  const dispatchToCourier = async () => {
    try {
      const consignment = await dispatchOrder.mutateAsync({ orderId: id });
      toast.success(`Sent to courier · ${consignment.tracking_code ?? "pending code"}`);
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  const blocked = risk.find((r) => r.action_taken === "blocked" || r.action_taken === "flagged");

  return (
    <div className="space-y-5">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice, #invoice * { visibility: visible; }
          #invoice { position: absolute; inset: 0; padding: 24px; }
        }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="rounded-sm p-2 text-muted-foreground hover:bg-secondary"
            aria-label="Back to orders"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{order.order_number}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(order.order_date)} · {order.order_source ?? "—"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit ? (
            <Select
              value={order.status}
              onChange={(e) => changeStatus(e.target.value)}
              className="w-40"
              aria-label="Order status"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          ) : (
            <Badge tone={statusTone(order.status)}>{order.status}</Badge>
          )}

          {canDispatch && (order.consignments ?? []).length === 0 && (
            <Button onClick={dispatchToCourier} disabled={dispatchOrder.isPending}>
              {dispatchOrder.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Truck className="h-4 w-4" /> Dispatch
                </>
              )}
            </Button>
          )}

          <Button variant="outline" onClick={print} disabled={printing}>
            <Printer className="h-4 w-4" /> Invoice
          </Button>
        </div>
      </div>

      {blocked && (
        <Card className="border-destructive/30 bg-destructive/5 print:hidden">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
            <div>
              <p className="font-medium text-destructive">
                Fraud check: {blocked.risk_level} ({blocked.risk_score})
              </p>
              <ul className="mt-1 space-y-0.5">
                {(blocked.signals ?? []).map((signal) => (
                  <li key={signal.code} className="text-sm text-foreground">
                    {signal.label} <span className="text-muted-foreground">(+{signal.score})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem] print:block">
        {/* Invoice — also the on-screen summary. */}
        <div id="invoice">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                {invoice.company.logo_url && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={invoice.company.logo_url} alt="" className="mb-2 h-10 w-auto object-contain" />
                )}
                <p className="font-semibold text-foreground">{invoice.company.name}</p>
                {invoice.company.address && (
                  <p className="text-sm text-muted-foreground">{invoice.company.address}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {invoice.company.phone}
                  {invoice.company.email && ` · ${invoice.company.email}`}
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-semibold text-foreground">Invoice</p>
                <p className="text-sm text-muted-foreground">{order.order_number}</p>
                <p className="text-sm text-muted-foreground">{formatDate(order.order_date)}</p>
                {invoice.consignment?.tracking_code && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {invoice.consignment.courier} · {invoice.consignment.tracking_code}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 border-b border-border py-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bill to</p>
                <p className="mt-1 font-medium text-foreground">{order.customer.name}</p>
                <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
                <p className="text-sm text-muted-foreground">{order.customer.address}</p>
              </div>

              <div className="sm:text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment</p>
                <p className="mt-1 text-sm text-foreground">{order.payment.method}</p>
                {order.payment.sender_number && (
                  <p className="text-sm text-muted-foreground">From {order.payment.sender_number}</p>
                )}
                {order.payment.txn_ref && (
                  <p className="text-sm text-muted-foreground">Txn {order.payment.txn_ref}</p>
                )}
              </div>
            </div>

            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Item</th>
                  <th className="pb-2 pr-4 text-right font-medium">Qty</th>
                  <th className="pb-2 pr-4 text-right font-medium">Unit</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(order.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 pr-4">
                      {item.product_name}
                      {item.variant_label && (
                        <span className="block text-xs text-muted-foreground">{item.variant_label}</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">{item.quantity}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">
                      {formatTaka(item.unit_price, currency)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {formatTaka(item.total_price, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
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
                <dd className="tabular-nums">{formatTaka(order.total, currency)}</dd>
              </div>
            </dl>

            {order.notes && (
              <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Notes: </span>
                {order.notes}
              </p>
            )}
          </Card>
        </div>

        {/* Side panels — hidden when printing. */}
        <div className="space-y-4 print:hidden">
          {(order.consignments ?? []).length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold text-foreground">Courier</h2>
              {(order.consignments ?? []).map((c) => (
                <div key={c.id} className="mt-3 space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="capitalize text-muted-foreground">{c.courier}</span>
                    <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                  </div>
                  <p className="text-muted-foreground">Tracking: {c.tracking_code ?? "—"}</p>
                  <p className="text-muted-foreground">COD: {formatTaka(c.cod_amount, currency)}</p>
                  {c.last_synced_at && (
                    <p className="text-xs text-muted-foreground">
                      Synced {formatDateTime(c.last_synced_at)}
                    </p>
                  )}
                </div>
              ))}
            </Card>
          )}

          {history?.risk_profile && (
            <Card>
              <h2 className="text-sm font-semibold text-foreground">Buyer history</h2>
              <dl className="mt-3 space-y-1.5 text-sm">
                <Row label="Total orders" value={String(history.risk_profile.total_orders)} />
                <Row label="Delivered" value={String(history.risk_profile.delivered)} />
                <Row label="Failed" value={String(history.risk_profile.failed)} />
                <Row label="Failure rate" value={`${history.risk_profile.failure_rate}%`} />
              </dl>
              <div className="mt-3 flex gap-2">
                <Badge
                  tone={
                    history.risk_profile.risk_flag === "High"
                      ? "danger"
                      : history.risk_profile.risk_flag === "Medium"
                        ? "warning"
                        : "success"
                  }
                >
                  {history.risk_profile.risk_flag} risk
                </Badge>
                {history.risk_profile.is_whitelisted && <Badge tone="info">Whitelisted</Badge>}
              </div>
            </Card>
          )}

          {(history?.data ?? []).length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold text-foreground">Previous orders</h2>
              <ul className="mt-3 divide-y divide-border">
                {(history?.data ?? []).map((past) => (
                  <li key={past.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <Link href={`/admin/orders/${past.id}`} className="text-primary hover:underline">
                      {past.order_number}
                    </Link>
                    <span className="flex items-center gap-2">
                      <Badge tone={statusTone(past.status)}>{past.status}</Badge>
                      <span className="tabular-nums text-muted-foreground">
                        {formatTaka(past.total, currency)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
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
