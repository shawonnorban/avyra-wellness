<?php

namespace App\Enums;

/**
 * The six order states the business actually works in.
 *
 * An earlier build carried fourteen, most of them shipping milestones. Those
 * milestones are not lost — they live on the consignment as
 * {@see \App\Services\Courier\CourierStatus}, which keeps the courier's own
 * vocabulary (Picked / In Transit / Delivered / Returned / Cancelled) at full
 * fidelity. The order row now only records where the *order* stands, which is
 * what the Facebook event mapping keys off.
 *
 * Exactly three of these produce a Facebook event; see
 * {@see \App\Services\Facebook\FacebookEventMap}.
 */
enum OrderStatus: string
{
    case Pending = 'pending';
    case Hold = 'hold';
    case Fake = 'fake';
    case Confirm = 'confirm';
    case Cancel = 'cancel';
    case Delivered = 'delivered';

    /**
     * The goods came back.
     *
     * Distinct from `cancel`, which is an order that never shipped or was called
     * off. A return has stock coming back onto the shelf and a delivery that was
     * attempted and failed, and the shop wants to see the two apart.
     *
     * A courier return settles here rather than on `cancel`, so this status and
     * the `courier_returns` table cannot tell different stories about the same
     * parcel. A staff member can also set it by hand, for goods brought back to
     * the counter, where there is no consignment at all.
     */
    case Return = 'return';

    public static function values(): array
    {
        return array_map(fn (self $case) => $case->value, self::cases());
    }

    /** Title-case label for admin lists and invoices. */
    public function label(): string
    {
        return ucfirst($this->value);
    }

    /**
     * Statuses an order can be dispatched to a courier from. Only a confirmed
     * order goes out — everything between dispatch and delivery is tracked on
     * the consignment rather than on the order.
     */
    public static function dispatchable(): array
    {
        return [self::Confirm];
    }

    /**
     * Statuses that count as a sale in inventory reporting.
     *
     * A `pending` order is a request, not a sale: nobody has agreed to buy it
     * yet and it may well turn out to be fake. `hold` is the same, still
     * undecided. Counting either inflated "sold" against stock that had not
     * actually moved.
     *
     * One list, used by both the product list and the per-variant stock report,
     * so the two can never disagree about what a sale is.
     *
     * @return array<int, string>
     */
    public static function soldValues(): array
    {
        return [self::Confirm->value, self::Delivered->value];
    }

    /**
     * No further transitions happen automatically once an order reaches these.
     */
    public function isTerminal(): bool
    {
        return in_array($this, [self::Delivered, self::Cancel, self::Return], true);
    }

    /**
     * Counts as a successful delivery when computing customer risk profiles.
     */
    public function isSuccessful(): bool
    {
        return $this === self::Delivered;
    }

    /**
     * Counts as a failed delivery when computing customer risk profiles.
     *
     * `fake` is excluded on purpose: it is a judgement about the order, not a
     * delivery outcome, and counting it would hold a customer responsible for
     * an order they may never have placed.
     *
     * `return` is included: the parcel went out and came back, which is exactly
     * the outcome this profile exists to predict.
     */
    public function isFailed(): bool
    {
        return in_array($this, [self::Cancel, self::Return], true);
    }
}
