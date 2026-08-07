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

/** Event names pushed to the dataLayer, mirroring the Meta event they drive. */
export type GtmEvent = "ViewContent" | "InitiateCheckout" | "Lead";

/**
 * Pushes an event. Safe before GTM has loaded — the snippet creates the array
 * and replays anything already in it — and a no-op on the server.
 */
export function pushEvent(event: GtmEvent, payload: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...payload });
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
