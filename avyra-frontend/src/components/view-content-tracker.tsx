"use client";

import { useEffect, useRef } from "react";
import { pushEvent } from "@/lib/gtm";

/**
 * Fires `ViewContent` once a product page has its product.
 *
 * Rendered as a component rather than called from each page so the "only once
 * per product" guard lives in one place: these pages fetch through React Query,
 * so the effect would otherwise re-run on every refetch and background revalidate.
 *
 * Browser-only. There is no order yet, so nothing to carry a stored `event_id`
 * and no server-side copy to deduplicate against.
 */
export function ViewContentTracker({
  productId,
  productName,
  value,
  currency = "BDT",
}: {
  productId: string | undefined;
  productName: string | undefined;
  value: number | undefined;
  currency?: string;
}) {
  const fired = useRef<string | null>(null);

  useEffect(() => {
    if (!productId || fired.current === productId) return;

    fired.current = productId;

    pushEvent("ViewContent", {
      currency,
      value: value ?? 0,
      content_type: "product",
      content_ids: [productId],
      content_name: productName ?? "",
    });
  }, [productId, productName, value, currency]);

  return null;
}
