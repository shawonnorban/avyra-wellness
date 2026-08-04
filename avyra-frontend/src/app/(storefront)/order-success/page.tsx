"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Suspense } from "react";
import { useLanguage } from "@/components/language-provider";

// useSearchParams needs a Suspense boundary so the rest of the page can prerender.
export default function OrderSuccessPage() {
  return (
    <Suspense fallback={null}>
      <OrderSuccess />
    </Suspense>
  );
}

function OrderSuccess() {
  const { t } = useLanguage();
  const orderNumber = useSearchParams().get("order");

  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-success" aria-hidden />

      <h1 className="mt-6 text-2xl font-bold text-foreground">{t("checkout.orderPlacedTitle")}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{t("checkout.willContact")}</p>

      {orderNumber && (
        <div className="mt-8 bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground">{t("checkout.yourOrderNumber")}</p>
          <p className="mt-1 text-2xl font-bold tracking-wide text-primary">{orderNumber}</p>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/track-order"
          className="inline-flex h-10 items-center rounded-sm bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t("checkout.trackOrder")}
        </Link>
        <Link
          href="/shop"
          className="inline-flex h-10 items-center rounded-sm border border-input bg-background px-5 text-sm font-medium hover:bg-secondary"
        >
          {t("checkout.shopMore")}
        </Link>
      </div>
    </div>
  );
}
