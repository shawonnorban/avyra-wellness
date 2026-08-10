# Meta Pixel + Conversions API — handover

For the media buyer configuring GTM container **`GTM-T78PFPTT`**.

The site pushes events onto the dataLayer; the container decides which tags fire.
**The Pixel base code is not in the site's source** — it must be a GTM tag, and
there must be exactly one of it. Two `fbq('init')` calls double-count everything.

---

## The funnel

| Customer action | Meta event | Fired by |
|---|---|---|
| Product page viewed | `ViewContent` | browser (GTM) |
| Order button pressed | `InitiateCheckout` | browser (GTM) |
| Form submitted | `Lead` | **browser + server** |
| Order confirmed by phone | `Purchase` | server only |
| Parcel delivered | `DeliveredPurchase` | server only |

`hold`, `fake` and `cancel` send **nothing**. They are internal judgements, not
conversions.

`Purchase` fires at phone confirmation, not delivery — cash on delivery makes the
delivered signal days late, and the algorithm needs it in hours. `DeliveredPurchase`
then closes the loop. It is a **custom** event, so it needs a Custom Conversion in
Ads Manager before it can drive optimisation.

A cancellation does **not** retract a `Purchase` already reported. Doing so needs
Meta's value-adjustment API, which is not built.

---

## dataLayer events

### `ViewContent`
```js
{ event: 'ViewContent', currency, value, content_type: 'product', content_ids: [], content_name }
```

### `InitiateCheckout`
```js
{ event: 'InitiateCheckout', currency, value, content_type: 'product',
  content_ids: [], content_name, num_items }
```

Fired when the visitor **starts** ordering, not when they submit: pressing an
order CTA, first touching the order form on a campaign page, or arriving on
`/checkout` with a cart. At most once per product per tab, so the funnel step
between `InitiateCheckout` and `Lead` measures a real drop-off. `content_name`
and `num_items` are only present where they are known — a CTA press knows the
product but not the quantity, so `value` there is the unit price.

### `Lead` — the one that deduplicates
```js
{ event: 'Lead',
  event_id,          // ← must go into the Pixel tag's Event ID field
  order_id,
  value,             // the order total; the server copy sends the same number
  currency, content_type: 'product', content_ids: [], content_name, num_items }
```

`value` is the **order total**, identical to what the server's copy reports — map
it as `{{DLV - value}}`. Do not compute it in GTM from anything else: if the two
copies disagree, a deduplicated pair carries a contradictory amount.

`Purchase` reports the same total again when the order is confirmed by phone.
That is intended — `Lead` is what campaigns optimise against and needs a value —
but it means **`Lead` value and `Purchase` value must never be summed**. They are
one order's money reported at two stages.

There is **no** `page_view` push. The Pixel's own PageView fires once per real
page load and not again as the visitor moves between pages — by request, so that
reaching `/order-success` after an order does not send a second one. Do not add a
tag on GTM's History Change trigger to reintroduce it.

---

## Deduplication — the part that is easy to get wrong

The server sends its own copy of `Lead`, `Purchase` and `DeliveredPurchase`
through the Conversions API. Meta collapses a browser copy and a server copy into
one conversion **only when `event_name` and `event_id` both match exactly**.

So in the GTM tag for `Lead`:

- Event Name → `Lead`
- **Event ID → `{{DLV - event_id}}`** (a Data Layer Variable reading `event_id`)

The id is generated server-side, stored on the order, and handed to the browser in
the checkout response. Do **not** build it from the order number in GTM — it is a
value, not a formula, precisely so the two sides cannot drift apart.

`ViewContent` and `InitiateCheckout` have no `event_id`: they happen before an
order exists, so there is no server-side copy to deduplicate against.

---

## What the server sends

Configured in the Laravel `.env`:

```
FB_PIXEL_ID=          # same pixel as the GTM tag
FB_ACCESS_TOKEN=      # Conversions API token, server-side only
FB_API_VERSION=v20.0
FB_TEST_EVENT_CODE=   # must be empty in production
```

Every server event carries:

| Field | Notes |
|---|---|
| `event_name`, `event_time`, `event_id` | `event_time` is the order's creation time |
| `action_source` | `website` |
| `custom_data.order_id` | the order number |
| `custom_data.value`, `currency` | `Purchase` and `DeliveredPurchase` only |
| `custom_data.content_ids`, `content_name`, `num_items` | from the order lines |
| `user_data.ph` | phone, normalised to `8801…` then SHA-256 |
| `user_data.em` | customer email if known, SHA-256 |
| `user_data.fbp`, `fbc` | captured at checkout, reused for the later events |
| `user_data.client_ip_address`, `client_user_agent` | captured at checkout |
| `user_data.external_id` | order id, SHA-256 |

`fbp` and `fbc` are read from the browser at form submit and stored on the order,
because `Purchase` fires hours later with no browser present.

**Trusted proxies must be configured** (`TRUSTED_PROXIES` in `.env`) or every
customer shares the proxy's IP and match quality collapses.

Failed calls land in `fb_event_logs` and are replayed hourly by
`php artisan fb:retry-events`, up to five attempts — so the scheduler has to be
running.

---

## Customer segments

**Admin → Customers → Segments** lists six groups and exports each as CSV for
Ads Manager's customer-list upload:

Delivered · Repeat (2+ delivered) · Confirmed not yet delivered · Cancelled ·
Returned · Invalid/fake

Phone numbers are exported in plain text — Ads Manager hashes them on upload, and
pre-hashing would stop them matching. Delivered and Repeat are the strongest
Lookalike seeds.

---

## Testing checklist

1. Put a Test Event Code in `FB_TEST_EVENT_CODE`, then watch Events Manager →
   **Test Events**.
2. Open a product page → `ViewContent`.
3. Press the order button → `InitiateCheckout`. Pressing a second one must **not**
   send another; it is one per product per tab.
4. Submit the form → **one** `Lead`, shown as received from both Browser and
   Server, and **no** second `InitiateCheckout` alongside it. Two separate `Lead`
   rows means the Event ID mapping is wrong.
5. Set the order to `confirm` in the admin → `Purchase` with the order value.
6. Set it to `delivered` → `DeliveredPurchase`.
7. Set another order to `hold`, `fake` or `cancel` → nothing arrives.
8. Check **Event Match Quality** on `Purchase`; it should benefit from phone, IP,
   user agent, `fbp`/`fbc` and `external_id`.
9. Clear `FB_TEST_EVENT_CODE` before going live, or production reporting stays empty.
