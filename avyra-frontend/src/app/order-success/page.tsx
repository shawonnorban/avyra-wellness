"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Suspense } from "react";
import { useLanguage } from "@/components/language-provider";

/**
 * Deliberately outside the (storefront) route group, like /avyravitalplus.
 *
 * Every order on the site lands here, including ones from the campaign pages,
 * which have none of the brand chrome — dropping a buyer into the full shop
 * header and footer at that moment was jarring, and the shop asked for the
 * confirmation on its own. So this page carries no navigation: the receipt, and
 * the two things a buyer might want next.
 *
 * useSearchParams needs a Suspense boundary so the rest can prerender.
 */
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
    // The page is the dialog: nothing renders around it, so it centres itself
    // in the viewport rather than sitting under a header that is no longer there.
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center erp-shadow-md">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" aria-hidden />

        <h1 className="mt-6 text-2xl font-bold text-card-foreground">
          {t("checkout.orderPlacedTitle")}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("checkout.willContact")}</p>

        {orderNumber && (
          <div className="mt-7 rounded-lg border border-border bg-background p-5">
            <p className="text-sm text-muted-foreground">{t("checkout.yourOrderNumber")}</p>
            <p className="mt-1 text-2xl font-bold tracking-wide text-primary">{orderNumber}</p>
          </div>
        )}

        <div className="mt-7 flex flex-wrap justify-center gap-3">
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
    </main>
  );
}
