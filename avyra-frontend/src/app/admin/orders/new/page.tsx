"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/misc";
import { toApiError, type ApiErrorShape } from "@/lib/api";
import { useAdminProducts, useCreateOrder, useWarehouses } from "@/lib/admin";
import { formatTaka, isValidBdPhone, normalizePhone } from "@/lib/format";

type Line = { product_id: string; variant_id: string; quantity: string; unit_price: string };

const BLANK_LINE: Line = { product_id: "", variant_id: "", quantity: "1", unit_price: "" };

/**
 * POS-style order entry. The customer record is created inline by the API from
 * the phone number, so staff never have to leave this form.
 */
export default function NewOrderPage() {
  const router = useRouter();
  const create = useCreateOrder();
  const { data: productPage } = useAdminProducts({});
  const { data: warehouses } = useWarehouses();

  const products = productPage?.data ?? [];

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    payment_method: "COD",
    delivery_zone: "inside_dhaka",
    warehouse_id: "",
    delivery_charge: "0",
    discount: "0",
  });
  const [lines, setLines] = useState<Line[]>([{ ...BLANK_LINE }]);
  const [error, setError] = useState<ApiErrorShape | null>(null);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const setLine = (index: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  // Picking a product pre-fills the price; staff can still override it for a
  // negotiated sale, which the API accepts.
  const pickProduct = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);

    setLine(index, {
      product_id: productId,
      variant_id: "",
      unit_price: product ? String(product.sell_price) : "",
    });
  };

  const pickVariant = (index: number, variantId: string) => {
    const line = lines[index];
    const product = products.find((p) => p.id === line.product_id);
    const variant = product?.variants?.find((v) => v.id === variantId);

    setLine(index, {
      variant_id: variantId,
      unit_price: variant ? String(variant.sell_price) : line.unit_price,
    });
  };

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + Number(line.unit_price || 0) * Number(line.quantity || 0), 0),
    [lines],
  );

  const total = Math.max(0, subtotal - Number(form.discount || 0)) + Number(form.delivery_charge || 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidBdPhone(form.phone)) {
      toast.error("Enter a valid Bangladeshi mobile number.");
      return;
    }

    const items = lines
      .filter((line) => line.product_id && Number(line.quantity) > 0)
      .map((line) => ({
        product_id: line.product_id,
        variant_id: line.variant_id || null,
        quantity: Number(line.quantity),
        unit_price: line.unit_price === "" ? undefined : Number(line.unit_price),
      }));

    if (items.length === 0) {
      toast.error("Add at least one product.");
      return;
    }

    try {
      const order = await create.mutateAsync({
        customer_name: form.customer_name,
        phone: normalizePhone(form.phone),
        email: form.email || null,
        address: form.address,
        delivery_zone: form.delivery_zone,
        warehouse_id: form.warehouse_id || null,
        payment_method: form.payment_method,
        delivery_charge: Number(form.delivery_charge || 0),
        discount: Number(form.discount || 0),
        notes: form.notes || null,
        items,
      });

      toast.success(`Order ${order.order_number} created`);
      router.replace(`/admin/orders/${order.id}`);
    } catch (err) {
      const parsed = toApiError(err);
      setError(parsed);
      toast.error(parsed.message);
    }
  };

  const err = (field: string) => error?.errors?.[field]?.[0];

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/orders"
          className="rounded-sm p-2 text-muted-foreground hover:bg-secondary"
          aria-label="Back to orders"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">New order</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entered by staff — it skips the fraud check and starts as Confirmed.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <Card className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">Customer</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required error={err("customer_name")}>
                <Input value={form.customer_name} onChange={update("customer_name")} required />
              </Field>
              <Field label="Mobile number" required error={err("phone")} hint="Existing customers are matched on this.">
                <Input type="tel" value={form.phone} onChange={update("phone")} required placeholder="01XXXXXXXXX" />
              </Field>
              <Field label="Email" error={err("email")}>
                <Input type="email" value={form.email} onChange={update("email")} />
              </Field>
              <Field label="Delivery zone">
                <Select value={form.delivery_zone} onChange={update("delivery_zone")}>
                  <option value="inside_dhaka">Inside Dhaka</option>
                  <option value="outside_dhaka">Outside Dhaka</option>
                </Select>
              </Field>
            </div>

            <Field label="Address" required error={err("address")}>
              <Textarea value={form.address} onChange={update("address")} required />
            </Field>

            <Field label="Notes">
              <Textarea value={form.notes} onChange={update("notes")} className="min-h-16" />
            </Field>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">Items</h2>

            <div className="space-y-3">
              {lines.map((line, i) => {
                const product = products.find((p) => p.id === line.product_id);
                const variants = product?.variants ?? [];

                return (
                  <div key={i} className="grid gap-2 sm:grid-cols-[1fr_9rem_5rem_7rem_auto]">
                    <Select
                      value={line.product_id}
                      onChange={(e) => pickProduct(i, e.target.value)}
                      aria-label="Product"
                    >
                      <option value="">Choose a product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </Select>

                    <Select
                      value={line.variant_id}
                      onChange={(e) => pickVariant(i, e.target.value)}
                      disabled={variants.length === 0}
                      aria-label="Variant"
                    >
                      <option value="">{variants.length ? "No variant" : "—"}</option>
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {[v.size, v.color].filter(Boolean).join(" / ") || v.sku_suffix}
                        </option>
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
                      placeholder="Unit price"
                      aria-label="Unit price"
                    />

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setLines(lines.filter((_, index) => index !== i))}
                      disabled={lines.length === 1}
                      aria-label="Remove line"
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setLines([...lines, { ...BLANK_LINE }])}
            >
              <Plus className="h-3.5 w-3.5" /> Add line
            </Button>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Summary</h2>

            <Field label="Payment method">
              <Select value={form.payment_method} onChange={update("payment_method")}>
                <option value="COD">Cash on delivery</option>
                <option value="Cash">Cash</option>
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Rocket">Rocket</option>
                <option value="Bank">Bank transfer</option>
              </Select>
            </Field>

            <Field label="Dispatch from">
              <Select value={form.warehouse_id} onChange={update("warehouse_id")}>
                <option value="">— unassigned —</option>
                {(warehouses ?? []).map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Discount">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.discount}
                  onChange={update("discount")}
                />
              </Field>
              <Field label="Delivery">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.delivery_charge}
                  onChange={update("delivery_charge")}
                />
              </Field>
            </div>

            <dl className="space-y-1.5 border-t border-border pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatTaka(subtotal)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
                <dt>Total</dt>
                <dd className="tabular-nums text-primary">{formatTaka(total)}</dd>
              </div>
            </dl>

            <Button type="submit" block size="lg" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create order"}
            </Button>
          </Card>
        </div>
      </div>
    </form>
  );
}
