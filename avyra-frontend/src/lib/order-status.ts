/**
 * The seven order statuses, mirroring `App\Enums\OrderStatus` on the API.
 *
 * Shipping milestones are no longer order statuses — they live on the
 * consignment (see the Courier page), which is why there is no "In Courier" or
 * "Shipped" here. Three of the seven drive a Facebook conversion:
 * pending → Lead, confirm → Purchase, delivered → DeliveredPurchase. The other
 * four — hold, fake, cancel, return — send nothing.
 */
export const ORDER_STATUSES = [
  "pending",
  "confirm",
  "hold",
  "fake",
  "cancel",
  "return",
  "delivered",
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

/** Stored lower-case; shown title-case. */
export const ORDER_STATUS_LABELS: Record<OrderStatusValue, string> = {
  pending: "Pending",
  confirm: "Confirmed",
  hold: "Hold",
  fake: "Fake",
  cancel: "Cancelled",
  return: "Returned",
  delivered: "Delivered",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatusValue] ?? status;
}

/** Pill colours for the inline status control and the filter tabs. */
export const ORDER_STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  confirm: "bg-green-50 text-green-700 border-green-200",
  hold: "bg-yellow-50 text-yellow-700 border-yellow-200",
  fake: "bg-orange-50 text-orange-700 border-orange-200",
  /* Purple, so a return does not read as a cancellation at a glance:
     the goods came back, which is a different outcome and a different fix. */
  return: "bg-purple-50 text-purple-700 border-purple-200",
  cancel: "bg-red-50 text-red-700 border-red-200",
  delivered: "bg-teal-50 text-teal-700 border-teal-200",
};

/**
 * Statuses a staff member has to justify.
 *
 * These three are judgements about the *customer* rather than milestones the
 * order passed through — someone decided this order was fake, or worth holding,
 * or not worth fulfilling. Six months later the status alone says nothing about
 * why, and it is the one thing that cannot be reconstructed from the record.
 */
export const STATUSES_NEEDING_REASON: readonly string[] = ["hold", "fake", "cancel", "return"];

export function statusNeedsReason(status: string): boolean {
  return STATUSES_NEEDING_REASON.includes(status);
}
