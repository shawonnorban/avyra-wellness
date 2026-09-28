/**
 * Browser-side tracking: the GTM dataLayer, or the Meta Pixel directly.
 *
 * Two ways to run the browser half of Meta tracking, and exactly one is ever
 * active:
 *
 *  - **GTM** (`NEXT_PUBLIC_GTM_ID` set). The Pixel base code lives inside the
 *    container, and this file only announces what happened; which tags fire on
 *    each event is the media buyer's setup.
 *  - **Direct** (`NEXT_PUBLIC_FB_PIXEL_ID` set, no GTM id). `<FacebookPixel />`
 *    installs the base code and `pushEvent` calls `fbq` itself.
 *
 * Never both: a GTM container with its own Pixel tag *plus* the direct snippet
 * is two `fbq('init')` calls, and every event is counted twice. So the direct
 * path switches itself off whenever a GTM id is present.
 *
 * Every conversion the server also reports carries an `event_id`. Meta collapses
 * the browser and server copies into one conversion only when that id matches
 * exactly — through the Pixel tag's *Event ID* field under GTM, or `eventID`
 * on the `fbq` call when direct. See docs/meta-tracking-handover.md.
 */

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
    /** Set by the Pixel snippet once `fbq('init')` has run. */
    __fbReady?: boolean;
    /** Calls made before that, replayed in order by the snippet. */
    __fbPending?: unknown[][];
  }
}

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/** The Pixel to load directly — undefined whenever GTM owns the browser half. */
export const DIRECT_PIXEL_ID: string | undefined = GTM_ID
  ? undefined
  : process.env.NEXT_PUBLIC_FB_PIXEL_ID || undefined;

/**
 * Event names pushed to the dataLayer, each mirroring the Meta event it drives.
 *
 * No `page_view`: the Pixel's own PageView on a real page load is all the shop
 * wants, and a virtual one on every App Router navigation was firing again on
 * /order-success straight after an order.
 */
export type GtmEvent = "ViewContent" | "InitiateCheckout" | "Lead";

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

/**
 * The arguments for `fbq` that carry one of our events.
 *
 * The server hands `Lead` an `event_id`, which belongs in the call's *options*
 * as `eventID` — that is the field Meta matches against the Conversions API
 * copy, not a parameter of the event. `event_name` is only there for GTM tags
 * to read and means nothing to `fbq`, so both are lifted out of the data.
 *
 * Pure and exported so the mapping can be checked without a browser.
 */
export function toPixelCall(event: GtmEvent, payload: Record<string, unknown>): unknown[] {
  const data = { ...payload };
  const eventId = typeof data.event_id === "string" && data.event_id !== "" ? data.event_id : undefined;

  delete data.event_id;
  delete data.event_name;

  return eventId ? ["track", event, data, { eventID: eventId }] : ["track", event, data];
}

/**
 * Sends to the directly-loaded Pixel, or holds the call until it exists.
 *
 * The queue is not optional. `ViewContent` fires from an effect during
 * hydration, and the Pixel snippet is an `afterInteractive` script that runs
 * later, so on a fast page the event is ready before `fbq` is. Dropping it
 * would lose the first event of nearly every visit.
 */
function sendToPixel(args: unknown[]): void {
  if (!DIRECT_PIXEL_ID) return;

  if (window.__fbReady && window.fbq) {
    window.fbq(...args);
    return;
  }

  (window.__fbPending ??= []).push(args);
}

/**
 * Announces an event. Safe before GTM or the Pixel has loaded — the GTM snippet
 * replays what is already in the array and the Pixel snippet drains its own
 * queue — and a no-op on the server.
 */
export function pushEvent(event: GtmEvent, payload: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;

  const cleared: Record<string, undefined> = {};

  for (const key of EVENT_SCOPED_KEYS) {
    if (!(key in payload)) cleared[key] = undefined;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...cleared, ...payload });

  sendToPixel(toPixelCall(event, payload));
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
