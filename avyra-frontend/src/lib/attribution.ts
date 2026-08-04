const STORAGE_KEY = "avyra_attribution";

/**
 * `fbc` is kept in localStorage rather than sessionStorage, unlike the rest of
 * the attribution: the click that earned it may be days before the order, and a
 * session that ends in between must not lose the credit for it.
 */
const FBC_KEY = "avyra_fbc";

export type Attribution = {
  landing_url?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  utm_id?: string;
  fbclid?: string;
  /** Facebook click id, formatted for the Conversions API. */
  fbc?: string;
  /** Facebook browser id, set by the pixel as a first-party cookie. */
  fbp?: string;
};

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
] as const;

/**
 * Captures the campaign parameters on first landing and keeps them for the
 * session, so an order placed three pages later is still credited correctly.
 * First touch wins — a later organic page view must not overwrite the ad click.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;

  // Runs before the early return below: the click id has to be captured on the
  // very page the ad landed on, whether or not this is the first touch.
  captureClickId();

  if (sessionStorage.getItem(STORAGE_KEY)) return;

  const params = new URLSearchParams(window.location.search);
  const captured: Attribution = {
    landing_url: window.location.href.slice(0, 2000),
    referrer: document.referrer ? document.referrer.slice(0, 2000) : undefined,
  };

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) captured[key] = value.slice(0, 255);
  }

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(captured));
}

export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};

  let stored: Attribution = {};

  try {
    stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}") as Attribution;
  } catch {
    stored = {};
  }

  return { ...stored, ...getFacebookCookies() };
}

/**
 * Turns an `fbclid` in the URL into the `fbc` value the Conversions API wants
 * and keeps it.
 *
 * `fb.1.<click timestamp>.<fbclid>` — the timestamp has to be the moment of the
 * click, which is why this is written on arrival rather than at checkout, where
 * `Date.now()` would be minutes or days late and the value would not match.
 */
function captureClickId(): void {
  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  if (!fbclid) return;

  try {
    localStorage.setItem(FBC_KEY, `fb.1.${Date.now()}.${fbclid}`);
  } catch {
    // Storage can be unavailable in private mode; the pixel's own cookie and
    // the plain fbclid on the order still carry most of the attribution.
  }
}

/**
 * The two identifiers the Conversions API matches on.
 *
 * The pixel writes both as first-party cookies. Its `_fbc` is preferred when
 * present because it is authoritative; the stored copy is the fallback for a
 * visitor whose pixel was blocked or who arrived before it loaded.
 */
export function getFacebookCookies(): { fbc?: string; fbp?: string } {
  if (typeof document === "undefined") return {};

  const read = (name: string) =>
    document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1];

  let stored: string | null = null;

  try {
    stored = localStorage.getItem(FBC_KEY);
  } catch {
    stored = null;
  }

  const fbc = read("_fbc") ?? stored ?? undefined;
  const fbp = read("_fbp") ?? undefined;

  return { ...(fbc ? { fbc } : {}), ...(fbp ? { fbp } : {}) };
}
