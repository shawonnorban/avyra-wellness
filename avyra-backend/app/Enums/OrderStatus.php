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
     * No further transitions happen automatically once an order reaches these.
     */
    public function isTerminal(): bool
    {
        return in_array($this, [self::Delivered, self::Cancel], true);
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
     */
    public function isFailed(): bool
    {
        return $this === self::Cancel;
    }
}
