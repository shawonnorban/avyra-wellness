<?php

namespace App\Enums;

/**
 * Where an order came from.
 *
 * Stored as a plain string on `orders.order_source` rather than cast to this
 * enum: rows predate it, and an unrecognised value must not break the order
 * list. Compare against `->value`.
 *
 * The distinction that matters is {@see self::Shop}. A sale rung up over the
 * counter reached no advertising, so it sends nothing to Meta — reporting it
 * would credit campaigns with revenue they had no part in. It also has no
 * delivery, no courier and no fraud risk, so it does not belong in the queues
 * the sales team works from; it has its own panel.
 *
 * `Pos` is *not* the same thing. A cash-on-delivery buyer who rings the number
 * in an advert is a real conversion, just not a browser one — those still go to
 * Meta, as `phone_call`. See {@see \App\Services\Facebook\FacebookCapiService}.
 */
enum OrderSource: string
{
    case Website = 'Website';
    case LandingPage = 'Landing Page';
    case Pos = 'POS';
    case Shop = 'Shop';

    /** The sources a staff member can pick when entering an order by hand. */
    public static function staffEntered(): array
    {
        return [self::Pos->value, self::Shop->value];
    }
}
