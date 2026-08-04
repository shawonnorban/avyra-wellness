"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2, Package, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { toApiError, type ApiErrorShape } from "@/lib/api";
import { getAttribution } from "@/lib/attribution";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { formatTaka, isValidBdPhone, normalizePhone } from "@/lib/format";
import {
  usePlaceOrder,
  useSendOtp,
  useStorefrontSettings,
  useValidateCoupon,
  useVerifyOtp,
} from "@/lib/queries";
import type { DeliveryZone } from "@/lib/types";
import { cartSubtotal, useCart } from "@/store/cart";

const WALLETS = [
  { id: "bKash", labelKey: "pay.bkash", descKey: "pay.bkashDesc", field: "bkash_number" },
  { id: "Nagad", labelKey: "pay.nagad", descKey: "pay.nagadDesc", field: "nagad_number" },
  { id: "Rocket", labelKey: "pay.rocket", descKey: "pay.rocketDesc", field: "rocket_number" },
] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { lines, clear } = useCart();
  const { data: settings } = useStorefrontSettings();

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    payment_sender_number: "",
    payment_txn_ref: "",
  });
  const [zone, setZone] = useState<DeliveryZone>("inside_dhaka");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [apiError, setApiError] = useState<ApiErrorShape | null>(null);

  const validateCoupon = useValidateCoupon();
  const placeOrder = usePlaceOrder();
  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();

  const subtotal = cartSubtotal(lines);
  const currency = settings?.company?.currency_symbol ?? "৳";

  const deliveryCharge = useMemo(() => {
    const config = settings?.delivery;
    if (!config) return 0;
    if (config.free_delivery_above !== null && subtotal >= config.free_delivery_above) return 0;

    return zone === "inside_dhaka" ? config.inside_dhaka_charge : config.outside_dhaka_charge;
  }, [settings, subtotal, zone]);

  // Flat promotional discount off delivery, shown on its own line — the same rule
  // the campaign pages use, and the same one CheckoutService applies server-side.
  const deliveryDiscount = settings?.delivery?.delivery_discount_enabled
    ? Math.min(deliveryCharge, settings.delivery.delivery_discount ?? 0)
    : 0;

  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, subtotal - discount) + deliveryCharge - deliveryDiscount;

  const availableWallets = WALLETS.filter((w) => Boolean(settings?.payment?.[w.field]));
  const activeWallet = WALLETS.find((w) => w.id === paymentMethod);
  const walletNumber = activeWallet ? settings?.payment?.[activeWallet.field] : undefined;

  if (lines.length === 0 && !placeOrder.isPending) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">{t("checkout.cartEmpty")}</p>
        <Link
          href="/shop"
          className="mt-6 inline-flex h-10 items-center rounded-sm bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t("checkout.shopMore")}
        </Link>
      </div>
    );
  }

  const update =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;

    try {
      const result = await validateCoupon.mutateAsync({ code: couponInput.trim(), subtotal });
      setCoupon({ code: result.code, discount: result.discount });
      toast.success(`${result.code} — ${formatTaka(result.discount, currency)}`);
    } catch (error) {
      setCoupon(null);
      toast.error(toApiError(error).message);
    }
  };

  const requestOtp = async () => {
    if (!isValidBdPhone(form.phone)) {
      toast.error(t("checkout.errProvideContact"));
      return;
    }

    try {
      const result = await sendOtp.mutateAsync(form.phone);
      setOtpSent(result.sent);
      toast[result.sent ? "success" : "error"](result.message);
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  const submitOtp = async () => {
    try {
      const result = await verifyOtp.mutateAsync({ phone: form.phone, code: otpCode });
      setOtpVerified(result.verified);
      toast.success(result.message);
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setBlocked(null);

    if (!isValidBdPhone(form.phone)) {
      toast.error(t("checkout.errProvideContact"));
      return;
    }

    try {
      const order = await placeOrder.mutateAsync({
        customer_name: form.customer_name,
        phone: normalizePhone(form.phone),
        email: form.email || undefined,
        address: form.address,
        delivery_zone: zone,
        notes: form.notes || undefined,
        payment_method: paymentMethod,
        payment_sender_number: paymentMethod === "COD" ? undefined : form.payment_sender_number,
        payment_txn_ref: paymentMethod === "COD" ? undefined : form.payment_txn_ref,
        coupon_code: coupon?.code,
        items: lines.map((line) => ({
          product_id: line.productId,
          variant_id: line.variantId,
          quantity: line.quantity,
        })),
        device_fingerprint: getDeviceFingerprint(),
        ...getAttribution(),
      });

      clear();
      toast.success(t("checkout.orderSuccessToast"));
      router.push(`/order-success?order=${encodeURIComponent(order.order_number)}`);
    } catch (error) {
      const parsed = toApiError(error);
      setApiError(parsed);

      // A fraud block is shown inline with the WhatsApp fallback, not as a toast.
      if (parsed.code === "order_blocked") {
        setBlocked(parsed.message);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (parsed.code === "otp_required") {
        toast.error(parsed.message);
      } else {
        toast.error(t("checkout.orderFailToast"));
      }
    }
  };

  const whatsapp = settings?.company?.whatsapp?.replace(/\D/g, "");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-lg font-bold text-foreground">{t("checkout.title")}</h1>

      {blocked && (
        <div
          role="alert"
          className="mt-5 flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-5"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
          <div>
            <p className="font-semibold text-destructive">{t("checkout.sorry")}</p>
            <p className="mt-1 leading-relaxed text-destructive/90">{blocked}</p>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-block text-sm font-medium text-destructive underline"
              >
                WhatsApp-এ যোগাযোগ করুন
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => setBlocked(null)}
            className="ml-auto text-destructive/60 hover:text-destructive"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form onSubmit={submit} className="mt-6 grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <h2 className="font-semibold text-card-foreground">{t("checkout.deliveryInfo")}</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("checkout.name")} error={apiError?.errors?.customer_name?.[0]}>
                <Input
                  value={form.customer_name}
                  onChange={update("customer_name")}
                  required
                  autoComplete="name"
                  placeholder={t("checkout.namePlaceholder")}
                  invalid={Boolean(apiError?.errors?.customer_name)}
                />
              </Field>

              <Field label={t("checkout.phone")} error={apiError?.errors?.phone?.[0]}>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={update("phone")}
                  required
                  autoComplete="tel"
                  placeholder="01XXXXXXXXX"
                  invalid={Boolean(apiError?.errors?.phone)}
                />
              </Field>
            </div>

            <Field label={t("checkout.emailOptional")}>
              <Input
                type="email"
                value={form.email}
                onChange={update("email")}
                autoComplete="email"
                placeholder="email@example.com"
              />
            </Field>

            <Field label={t("checkout.address")} error={apiError?.errors?.address?.[0]}>
              <Textarea
                value={form.address}
                onChange={update("address")}
                required
                autoComplete="street-address"
                placeholder={t("checkout.addressPlaceholder")}
                invalid={Boolean(apiError?.errors?.address)}
              />
            </Field>

            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-foreground">{t("checkout.deliveryArea")}</legend>
              <div className="flex gap-4">
                {(
                  [
                    ["inside_dhaka", t("checkout.insideDhaka"), settings?.delivery?.inside_dhaka_charge],
                    ["outside_dhaka", t("checkout.outsideDhaka"), settings?.delivery?.outside_dhaka_charge],
                  ] as const
                ).map(([value, label, charge]) => (
                  <label
                    key={value}
                    className={`flex items-center gap-2 border rounded-lg px-4 py-2.5 cursor-pointer flex-1 transition-colors ${
                      zone === value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery_zone"
                      value={value}
                      checked={zone === value}
                      onChange={() => setZone(value)}
                      className="accent-primary"
                    />
                    <span className="text-sm flex-1">
                      <span className="font-medium">{label}</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        {charge === 0 ? t("checkout.freeDelivery") : formatTaka(charge ?? 0, currency)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <Field label={t("checkout.notesOptional")}>
              <Textarea
                value={form.notes}
                onChange={update("notes")}
                rows={2}
                placeholder={t("checkout.notesPlaceholder")}
              />
            </Field>
          </div>

          <div className="bg-card rounded-xl border border-border p-5 space-y-3">
            <h2 className="font-semibold text-card-foreground">{t("checkout.paymentMethod")}</h2>

            <div className="space-y-2">
              {settings?.payment?.cod_enabled !== false && (
                <PaymentOption
                  active={paymentMethod === "COD"}
                  onSelect={() => setPaymentMethod("COD")}
                  label={t("pay.cod")}
                  description={t("pay.codDesc")}
                />
              )}

              {availableWallets.map((wallet) => (
                <PaymentOption
                  key={wallet.id}
                  active={paymentMethod === wallet.id}
                  onSelect={() => setPaymentMethod(wallet.id)}
                  label={t(wallet.labelKey)}
                  description={t(wallet.descKey)}
                />
              ))}
            </div>

            {paymentMethod !== "COD" && (
              <div className="space-y-4 pt-2">
                {walletNumber && (
                  <p className="rounded-sm bg-warning/10 px-4 py-3 text-sm text-foreground">
                    {paymentMethod} {t("pay.merchantNo")}:{" "}
                    <span className="font-semibold">{walletNumber}</span> — {formatTaka(total, currency)}
                  </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("pay.yourNo").replace("{label}", paymentMethod)}>
                    <Input
                      value={form.payment_sender_number}
                      onChange={update("payment_sender_number")}
                      required
                      placeholder="01XXXXXXXXX"
                    />
                  </Field>
                  <Field label={t("pay.transactionId")}>
                    <Input
                      value={form.payment_txn_ref}
                      onChange={update("payment_txn_ref")}
                      required
                      placeholder={t("pay.reference")}
                    />
                  </Field>
                </div>
              </div>
            )}
          </div>

          {apiError?.code === "otp_required" && !otpVerified && (
            <div className="bg-card rounded-xl border border-border p-5 space-y-3">
              <h2 className="font-semibold text-card-foreground">Verify your number</h2>

              <div className="flex flex-wrap items-end gap-3">
                {!otpSent ? (
                  <Button type="button" onClick={requestOtp} disabled={sendOtp.isPending}>
                    {sendOtp.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code"}
                  </Button>
                ) : (
                  <>
                    <div className="w-40">
                      <Field label="Verification code">
                        <Input
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          inputMode="numeric"
                          maxLength={6}
                        />
                      </Field>
                    </div>
                    <Button type="button" onClick={submitOtp} disabled={verifyOtp.isPending}>
                      Verify
                    </Button>
                    <Button type="button" variant="ghost" onClick={requestOtp}>
                      Resend
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {otpVerified && (
            <p className="flex items-center gap-2 text-sm text-success">
              <Check className="h-4 w-4" aria-hidden /> Phone number verified.
            </p>
          )}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border border-border p-5 space-y-4 sticky top-6">
            <h2 className="font-semibold text-card-foreground">{t("checkout.orderSummary")}</h2>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {lines.map((line) => (
                <div
                  key={`${line.productId}-${line.variantId ?? "base"}`}
                  className="flex items-center gap-2 text-sm"
                >
                  {line.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={line.image} alt={line.name} className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-accent flex items-center justify-center">
                      <Package className="w-4 h-4 text-primary/30" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-card-foreground line-clamp-1 text-xs">{line.name}</p>
                    {line.variantLabel && (
                      <p className="text-[11px] text-muted-foreground">{line.variantLabel}</p>
                    )}
                    <p className="text-xs text-muted-foreground">x{line.quantity}</p>
                  </div>

                  <span className="text-xs font-medium">
                    {formatTaka(line.price * line.quantity, currency)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Coupon code"
                aria-label="Coupon code"
                className="h-9"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 shrink-0"
                onClick={applyCoupon}
                disabled={validateCoupon.isPending}
              >
                Apply
              </Button>
            </div>

            <dl className="space-y-2 border-t border-border pt-3 text-sm">
              <Row label={t("checkout.subtotal")} value={formatTaka(subtotal, currency)} />
              {discount > 0 && (
                <Row
                  label={t("checkout.couponDiscount")}
                  value={`− ${formatTaka(discount, currency)}`}
                  tone="primary"
                />
              )}
              <Row
                label={t("checkout.delivery")}
                value={deliveryCharge === 0 ? t("checkout.free") : formatTaka(deliveryCharge, currency)}
              />
              {deliveryDiscount > 0 && (
                <Row
                  label={t("checkout.deliveryDiscount")}
                  value={`− ${formatTaka(deliveryDiscount, currency)}`}
                  tone="primary"
                />
              )}
              <div className="flex justify-between border-t border-border pt-3 text-base font-bold text-card-foreground">
                <dt>{t("checkout.total")}</dt>
                <dd className="text-primary">{formatTaka(total, currency)}</dd>
              </div>
            </dl>

            <Button type="submit" block size="lg" disabled={placeOrder.isPending}>
              {placeOrder.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("checkout.placingOrder")}
                </>
              ) : (
                t("checkout.confirmOrder")
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "primary" }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={tone === "primary" ? "text-primary" : "text-card-foreground"}>{value}</dd>
    </div>
  );
}

function PaymentOption({
  active,
  onSelect,
  label,
  description,
}: {
  active: boolean;
  onSelect: () => void;
  label: string;
  description: string;
}) {
  return (
    <label
      className={`flex items-center gap-3 border rounded-lg px-4 py-2.5 cursor-pointer transition-colors ${
        active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
      }`}
    >
      <input
        type="radio"
        name="payment_method"
        checked={active}
        onChange={onSelect}
        className="accent-primary"
      />
      <span className="flex-1">
        <span className="block text-sm font-medium text-card-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}
