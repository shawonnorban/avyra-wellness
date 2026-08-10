/**
 * Google Tag Manager dataLayer.
 *
 * GTM owns the browser half of Meta tracking — the Pixel base code is configured
 * inside the container, not here. This file only announces what happened; which
 * tags fire on each event is the media buyer's setup.
 *
 * Every conversion the server also reports carries an `event_id`. Meta collapses
 * the browser and server copies into one conversion only when that id matches
 * exactly, so the GTM tag must map it into the Pixel tag's *Event ID* field.
 * See docs/meta-tracking-handover.md.
 */

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * Event names pushed to the dataLayer, each mirroring the Meta event it drives.
 *
 * No `page_view`: the Pixel's own PageView on a real page load is all the shop
 * wants, and a virtual one on every App Router navigation was firing again on
 * /order-success straight after an order.
 */
export type GtmEvent = "ViewContent" | "InitiateCheckout" | "Lead";

/**
 * Pushes an event. Safe before GTM has loaded — the snippet creates the array
 * and replays anything already in it — and a no-op on the server.
 */
/**
 * Keys that belong to one event and must not survive into the next.
 *
 * GTM's data layer is cumulative: a push *merges* into the existing model rather
 * than replacing it, so whatever `ViewContent` set is still readable when `Lead`
 * fires. `Lead` deliberately carries no `value` — only the money events report
 * one — but a tag reading `{{DLV - value}}` on it would quietly pick up the unit
 * price left behind by `ViewContent` and report ৳1490 for a ৳1540 order.
 *
 * So every key in this list that the current payload does not set is explicitly
 * pushed as `undefined`, which is how GTM clears a data layer variable.
 */
const EVENT_SCOPED_KEYS = [
  "value",
  "currency",
  "content_type",
  "content_ids",
  "content_name",
  "num_items",
  "event_id",
  "event_name",
  "order_id",
] as const;

export function pushEvent(event: GtmEvent, payload: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;

  const cleared: Record<string, undefined> = {};

  for (const key of EVENT_SCOPED_KEYS) {
    if (!(key in payload)) cleared[key] = undefined;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...cleared, ...payload });
}

/** The product identity a funnel event carries. */
export type TrackedProduct = { id: string; name: string; price?: number | null };

/**
 * Products this tab has already reported an `InitiateCheckout` for.
 *
 * Module scope rather than component state on purpose: the trigger sits on
 * several unrelated buttons on the same page, and a client-side navigation back
 * to a page already counted must not count it twice. Reset by a real reload,
 * which is a new session anyway.
 */
const initiated = new Set<string>();

/**
 * `InitiateCheckout` — when the visitor *starts* ordering, not when they finish.
 *
 * This used to fire on form submit, one line above `Lead`. Both numbers were then
 * identical by construction and the funnel step between them measured nothing.
 * Intent is the CTA press, or the first touch of the order form for someone who
 * scrolls straight to it.
 *
 * Browser-only: no order exists yet, so there is no stored `event_id` to carry
 * and no server-side copy to deduplicate against. `value` is the unit price —
 * the quantity is not known until the form is filled in.
 */
export function pushInitiateCheckout(product: TrackedProduct | null | undefined): void {
  if (!product || initiated.has(product.id)) return;

  initiated.add(product.id);

  pushEvent("InitiateCheckout", {
    currency: "BDT",
    value: product.price ?? 0,
    content_type: "product",
    content_ids: [product.id],
    content_name: product.name,
  });
}
