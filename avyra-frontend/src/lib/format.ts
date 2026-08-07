/** Bangladeshi Taka. The symbol comes from settings but ৳ is the safe default. */
export function formatTaka(amount: number, symbol = "৳"): string {
  return `${symbol}${new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

/**
 * The shop's timezone, mirrored from the public company settings by
 * `ShopTimeZoneSync`.
 *
 * A module variable rather than a hook because these are plain functions called
 * from dozens of places, none of which want to become settings consumers. While
 * it is undefined — the first paint, before settings resolve — `Intl` falls back
 * to the viewer's own zone, which for staff in Dhaka is already the right answer.
 */
let shopTimeZone: string | undefined;

export function setShopTimeZone(zone: string | null | undefined): void {
  shopTimeZone = zone || undefined;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: shopTimeZone,
  }).format(new Date(value));
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: shopTimeZone,
  }).format(new Date(value));
}

/**
 * Absolute URL for a stored upload path. Admin endpoints return raw paths so the
 * editors can round-trip them; the storefront gets URLs already resolved.
 */
export function productImageUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;

  const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/api\/?$/, "");

  return `${base}/storage/${path}`;
}

/**
 * Clock time only — the orders list shows it on its own line under the date.
 *
 * Feed this `created_at`, never `order_date`: the latter is a date column, so it
 * arrives as midnight and every row renders the same meaningless time.
 */
export function formatTime(value: string | null | undefined): string {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: shopTimeZone,
  }).format(new Date(value));
}

/** Strips everything but digits, matching how the API stores phone numbers. */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Loose check for a Bangladeshi mobile number (01XXXXXXXXX or 8801XXXXXXXXX). */
export function isValidBdPhone(phone: string): boolean {
  const digits = normalizePhone(phone);

  return /^(?:88)?01[3-9]\d{8}$/.test(digits);
}
