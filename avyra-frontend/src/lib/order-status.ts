/**
 * The six order statuses, mirroring `App\Enums\OrderStatus` on the API.
 *
 * Shipping milestones are no longer order statuses — they live on the
 * consignment (see the Courier page), which is why there is no "In Courier" or
 * "Shipped" here. Three of these six drive a Facebook conversion:
 * pending → InitiateCheckout, confirm → Lead, delivered → Purchase.
 */
export const ORDER_STATUSES = [
  "pending",
  "confirm",
  "hold",
  "fake",
  "cancel",
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
  cancel: "bg-red-50 text-red-700 border-red-200",
  delivered: "bg-teal-50 text-teal-700 border-teal-200",
};
