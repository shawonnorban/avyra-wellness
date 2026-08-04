"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { toApiError } from "@/lib/api";
import { getAttribution } from "@/lib/attribution";
import { trackPixelEvent } from "@/components/facebook-pixel";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { formatTaka, isValidBdPhone, normalizePhone } from "@/lib/format";
import {
  trackLandingEvent,
  usePlaceOrder,
  useStorefrontSettings,
  useValidateCoupon,
} from "@/lib/queries";
import type { DeliveryZone, LandingPage, ProductDetail, ProductVariant } from "@/lib/types";

/**
 * Adapter for pages backed by a `landing_pages` row. The form itself takes plain
 * props so the standalone campaign page can reuse it without inventing a
 * `LandingPage` object.
 */
export function LandingOrderForm({ page }: { page: LandingPage }) {
  return (
    <CampaignOrderForm
      product={page.product}
      deliveryInside={page.delivery_charge_inside}
      deliveryOutside={page.delivery_charge_outside}
      trackingSlug={page.slug}
    />
  );
}

export type CampaignOrderFormProps = {
  product: ProductDetail | null;
  /** Campaign override for the store-wide delivery charge; null falls back to settings. */
  deliveryInside?: number | null;
  deliveryOutside?: number | null;
  /**
   * Landing-page slug for attribution. Omitted on standalone pages, which have no
   * `landing_pages` row — the order is then recorded without a campaign slug.
   */
  trackingSlug?: string | null;
};

/**
 * Single-step order form embedded in a campaign page — the whole point of such a
 * page is that the buyer never leaves it. Styled with the `lp-*` design system
 * rather than the brand site's components.
 */
export function CampaignOrderForm({
  product,
  deliveryInside = null,
  deliveryOutside = null,
  trackingSlug = null,
}: CampaignOrderFormProps) {
  const router = useRouter();
  const { data: settings } = useStorefrontSettings();
  const placeOrder = usePlaceOrder();
  const checkCoupon = useValidateCoupon();
  // Memoised so the `?? []` fallback does not produce a new array every render.
  const variants = useMemo(() => product?.variants ?? [], [product]);

  const [variantId, setVariantId] = useState<string | null>(variants[0]?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [zone, setZone] = useState<DeliveryZone>("inside_dhaka");
  const [form, setForm] = useState({ customer_name: "", phone: "", address: "" });
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);

  const currency = settings?.company?.currency_symbol ?? "৳";
  const selected = variants.find((v) => v.id === variantId);
  const unitPrice = selected?.price ?? product?.price ?? 0;

  const insideCharge = deliveryInside ?? settings?.delivery?.inside_dhaka_charge ?? 0;
  const outsideCharge = deliveryOutside ?? settings?.delivery?.outside_dhaka_charge ?? 0;
  const deliveryCharge = zone === "inside_dhaka" ? insideCharge : outsideCharge;

  // A flat promotional discount off delivery, shown on its own line and never
  // taking the charge below zero. The API applies the same rule server-side.
  const deliveryDiscount = settings?.delivery?.delivery_discount_enabled
    ? Math.min(deliveryCharge, settings.delivery.delivery_discount ?? 0)
    : 0;

  const subtotal = unitPrice * quantity;
  const total = subtotal - (coupon?.discount ?? 0) + deliveryCharge - deliveryDiscount;

  if (!product) {
    return (
      <div className="card" style={{ padding: 32, textAlign: "center" }}>
        <p className="bn" style={{ color: "var(--muted)", fontSize: 14 }}>
          এই পেজে এখনো কোনো পণ্য যুক্ত করা হয়নি।
        </p>
      </div>
    );
  }

  const update =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;

    try {
      const result = await checkCoupon.mutateAsync({ code, subtotal });
      setCoupon({ code, discount: result.discount });
      toast.success(`কুপন প্রয়োগ হয়েছে — ${formatTaka(result.discount, currency)} ছাড়`);
    } catch (error) {
      setCoupon(null);
      toast.error(toApiError(error).message);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlocked(null);

    if (!isValidBdPhone(form.phone)) {
      toast.error("সঠিক মোবাইল নম্বর দিন।");
      return;
    }

    try {
      const order = await placeOrder.mutateAsync({
        customer_name: form.customer_name,
        phone: normalizePhone(form.phone),
        address: form.address,
        delivery_zone: zone,
        payment_method: "COD",
        coupon_code: coupon?.code,
        items: [{ product_id: product.id, variant_id: variantId, quantity }],
        device_fingerprint: getDeviceFingerprint(),
        // Only sent when this page is backed by a landing_pages row.
        ...(trackingSlug ? { landing_page_slug: trackingSlug } : {}),
        ...getAttribution(),
      });

      // The browser half of the conversion. The server sends the same event with
      // the same id, so Facebook counts one InitiateCheckout rather than two —
      // and the event still lands if the server call is the one that fails.
      trackPixelEvent("InitiateCheckout", `${order.order_number}-InitiateCheckout`, {
        value: order.total,
        currency: "BDT",
        content_type: "product",
        content_ids: [product.id],
        content_name: product.name,
      });

      if (trackingSlug) trackLandingEvent(trackingSlug, "order");
      router.push(`/order-success?order=${encodeURIComponent(order.order_number)}`);
    } catch (error) {
      const parsed = toApiError(error);

      if (parsed.code === "order_blocked") {
        setBlocked(parsed.message);
      } else {
        toast.error(parsed.message);
      }
    }
  };

  const whatsapp = settings?.company?.whatsapp?.replace(/\D/g, "");

  return (
    <form onSubmit={submit}>
      <div className="form-header">
        <span className="lp-form-badge bn">📦 অর্ডার ফর্ম</span>
        <h3 className="bn">অর্ডার করতে নিচের ফর্মটি পূরণ করুন</h3>
      </div>

      <div className="form-body">
        {blocked && (
          <div role="alert" className="lp-blocked">
            <AlertTriangle size={16} aria-hidden />
            <div>
              <p className="bn">{blocked}</p>
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer noopener" className="bn">
                  WhatsApp-এ যোগাযোগ করুন
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── Package picker ── */}
        {variants.length > 0 && (
          <fieldset className="lp-fieldset">
            <legend className="lp-legend bn">
              <span className="lp-legend-dot" aria-hidden />
              পণ্য সিলেক্ট করুন
            </legend>

            <div className="prod-grid">
              {variants.map((variant) => (
                <VariantCard
                  key={variant.id}
                  variant={variant}
                  productName={product.name}
                  productImage={product.images?.[0] ?? null}
                  currency={currency}
                  active={variant.id === variantId}
                  quantity={variant.id === variantId ? quantity : 1}
                  onSelect={() => setVariantId(variant.id)}
                  onQuantityChange={setQuantity}
                />
              ))}
            </div>
          </fieldset>
        )}

        <div className="form-two-col">
          {/* ── Billing details ── */}
          <div>
            <h4 className="lp-col-title bn">
              <span className="lp-col-icon" aria-hidden>📋</span>
              বিলিং তথ্য
            </h4>

            <div className="lp-fields">
              <div>
                <label className="f-label bn" htmlFor="lp-name">আপনার নাম *</label>
                <input
                  id="lp-name"
                  className="f-input"
                  value={form.customer_name}
                  onChange={update("customer_name")}
                  required
                  autoComplete="name"
                  placeholder="সম্পূর্ণ নাম লিখুন"
                />
              </div>

              <div>
                <label className="f-label bn" htmlFor="lp-phone">মোবাইল নম্বর *</label>
                <input
                  id="lp-phone"
                  type="tel"
                  className="f-input"
                  value={form.phone}
                  onChange={update("phone")}
                  required
                  autoComplete="tel"
                  placeholder="01XXXXXXXXX"
                />
              </div>

              <div>
                <label className="f-label bn" htmlFor="lp-address">সম্পূর্ণ ঠিকানা *</label>
                <textarea
                  id="lp-address"
                  className="f-input"
                  value={form.address}
                  onChange={update("address")}
                  required
                  rows={3}
                  placeholder="বাসা, রোড, এলাকা, থানা, জেলা"
                  style={{ resize: "vertical" }}
                />
              </div>

              <div>
                <label className="f-label bn" htmlFor="lp-zone">ডেলিভারি এলাকা</label>
                <select
                  id="lp-zone"
                  className="f-input f-select bn"
                  value={zone}
                  onChange={(e) => setZone(e.target.value as DeliveryZone)}
                >
                  <option value="inside_dhaka">ঢাকার মধ্যে — {formatTaka(insideCharge, currency)}</option>
                  <option value="outside_dhaka">ঢাকার বাইরে — {formatTaka(outsideCharge, currency)}</option>
                </select>
              </div>

              <div>
                <span className="f-label bn">পেমেন্ট পদ্ধতি</span>
                <div className="pay-opt on">
                  <span className="radio-dot on" aria-hidden />
                  <span className="lp-pay-icon" aria-hidden>💵</span>
                  <span>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 700 }}>Cash on Delivery</span>
                    <span className="bn" style={{ fontSize: 11.5, color: "var(--muted)" }}>
                      পণ্য হাতে পেয়ে পেমেন্ট করুন
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Order summary ── */}
          <div>
            <h4 className="lp-col-title bn">
              <span className="lp-col-icon" aria-hidden>🧾</span>
              অর্ডার সারসংক্ষেপ
            </h4>
            <div className="ord-table">
              <div className="ord-head">
                <span className="bn">পণ্য</span>
                <span className="ord-col-var bn">ধরন</span>
                <span className="bn">সংখ্যা</span>
                <span className="bn" style={{ textAlign: "right" }}>মোট</span>
              </div>

              <div className="ord-row">
                <span className="bn" style={{ fontWeight: 600 }}>{product.name}</span>
                <span className="ord-col-var" style={{ color: "var(--muted)" }}>
                  {selected?.size ?? "—"}
                </span>
                <span style={{ textAlign: "center" }}>{quantity}</span>
                <span style={{ textAlign: "right", fontWeight: 700 }}>{formatTaka(subtotal, currency)}</span>
              </div>
            </div>

            {/* ── Coupon ── */}
            <div className="coup-row" style={{ marginTop: 12 }}>
              <input
                className="coup-input"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="কুপন কোড"
                aria-label="কুপন কোড"
              />
              <button
                type="button"
                className="coup-btn bn"
                onClick={applyCoupon}
                disabled={checkCoupon.isPending || !couponInput.trim()}
              >
                প্রয়োগ
              </button>
            </div>

            <div className="sum-box" style={{ marginTop: 12 }}>
              <SummaryRow label="সাবটোটাল" value={formatTaka(subtotal, currency)} />

              {coupon && (
                <SummaryRow
                  label={`কুপন (${coupon.code})`}
                  value={`−${currency}${coupon.discount.toFixed(2)}`}
                  tone="green"
                />
              )}

              <SummaryRow label="ডেলিভারি চার্জ" value={`${currency}${deliveryCharge.toFixed(2)}`} />
              <SummaryRow
                label="মোট"
                value={`${currency}${(subtotal - (coupon?.discount ?? 0) + deliveryCharge).toFixed(2)}`}
              />

              {deliveryDiscount > 0 && (
                <SummaryRow
                  label="ডিসকাউন্ট ডেলিভারি চার্জ"
                  value={`−${currency}${deliveryDiscount.toFixed(2)}`}
                  tone="green"
                />
              )}

              <div className="sum-total">
                <span className="bn" style={{ fontWeight: 800, fontSize: 15 }}>সর্বমোট</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: "var(--red)" }}>
                  {currency}
                  {total.toFixed(2)}
                </span>
              </div>
            </div>

            <button type="submit" className="cta bn" style={{ marginTop: 16 }} disabled={placeOrder.isPending}>
              {placeOrder.isPending ? <span className="spinner" aria-label="অর্ডার হচ্ছে" /> : "✅ অর্ডার কনফার্ম করুন"}
            </button>
            <p className="bn" style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
              🔒 আপনার তথ্য সম্পূর্ণ সুরক্ষিত
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}

function SummaryRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green";
}) {
  return (
    <div className="sum-row">
      <span className="bn" style={{ color: tone === "green" ? "var(--green)" : "var(--muted)" }}>
        {label}
      </span>
      <span style={{ fontWeight: 600, color: tone === "green" ? "var(--green)" : undefined }}>
        {value}
      </span>
    </div>
  );
}

function VariantCard({
  variant,
  productName,
  productImage,
  currency,
  active,
  quantity,
  onSelect,
  onQuantityChange,
}: {
  variant: ProductVariant;
  productName: string;
  productImage: string | null;
  currency: string;
  active: boolean;
  quantity: number;
  onSelect: () => void;
  onQuantityChange: (next: number) => void;
}) {
  // `compare_at_price` drives the struck-through price and the saving badge.
  // One decimal, trimmed when the saving lands on a whole percent.
  const compareAt = variant.compare_at_price ?? null;
  const saving = compareAt && compareAt > variant.price
    ? (((compareAt - variant.price) / compareAt) * 100).toFixed(1).replace(/\.0$/, "")
    : null;

  const label = variant.size ? `${productName} (${variant.size})` : productName;

  return (
    <div
      className={`prod-card ${active ? "active" : ""} ${variant.in_stock ? "" : "lp-oos"}`}
      onClick={variant.in_stock ? onSelect : undefined}
      role="radio"
      aria-checked={active}
      aria-disabled={!variant.in_stock}
      tabIndex={variant.in_stock ? 0 : -1}
      onKeyDown={(e) => {
        if (variant.in_stock && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <span className={`radio-dot ${active ? "on" : ""}`} aria-hidden />

      {productImage && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={productImage} alt="" className="lp-prod-thumb" />
      )}

      <span className="lp-prod-body">
        <span className="lp-prod-name bn">{label}</span>

        {/* The stepper only drives the selected package. */}
        <span className="qty-row" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="qty-btn"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={!active}
            aria-label="পরিমাণ কমান"
          >
            −
          </button>
          <span className="lp-qty-value">{quantity}</span>
          <button
            type="button"
            className="qty-btn"
            onClick={() => onQuantityChange(Math.min(20, quantity + 1))}
            disabled={!active}
            aria-label="পরিমাণ বাড়ান"
          >
            +
          </button>
        </span>
      </span>

      <span className="lp-prod-price">
        {saving && <span className="lp-save-badge">-{saving}%</span>}
        {compareAt && compareAt > variant.price && (
          <s className="lp-compare">{formatTaka(compareAt, currency)}</s>
        )}
        <span className="lp-price">{formatTaka(variant.price, currency)}</span>
      </span>

      {!variant.in_stock && <span className="bn lp-oos-label">স্টকে নেই</span>}
    </div>
  );
}
