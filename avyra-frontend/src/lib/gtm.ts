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
