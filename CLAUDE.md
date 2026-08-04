# Avyra Wellness — E-commerce Platform

D2C storefront + order-management admin for **Avyra Wellness** (`avyrabd.com`), a natural-wellness
brand in Bangladesh. Flagship product: **Vital Plus**.

Ported from a Supabase/React prototype (`shawonsrkr/data-state-hub`), scoped down to order
management — the legacy HR, payroll, attendance, manufacturing, BOM and accounting modules are
deliberately **not** carried over.

## Layout

```
avyra-wellness/
├── avyra-backend/    Laravel 13 API (PHP 8.4+, MySQL)
└── avyra-frontend/   Next.js 16 App Router (React 19, Tailwind v4)
```

## Running it

MySQL and Apache come from WAMP. PHP is not on PATH — use the WAMP binary.

```bash
# Backend  → http://localhost:8000
cd avyra-backend
C:/wamp64/bin/php/php8.4.15/php.exe artisan migrate:fresh --seed
C:/wamp64/bin/php/php8.4.15/php.exe artisan db:seed --class=DemoDataSeeder   # sample catalogue
C:/wamp64/bin/php/php8.4.15/php.exe artisan serve --port=8000

# Frontend → http://localhost:3000
cd avyra-frontend
npm run dev
```

Seeded admin: `admin@avyrabd.com` / `password` — **change before deploying.**

```bash
C:/wamp64/bin/php/php8.4.15/php.exe artisan db:seed --class=DemoLandingPageSeeder  # /lp/vital-plus-offer

C:/wamp64/bin/php/php8.4.15/php.exe artisan test    # 66 tests
npm run build && npx eslint .
```

## Conventions that are not obvious

- **UUID primary keys everywhere**, including `users`. `foreignUuid(...)->constrained()` will fail
  against a `bigint` table, so any new table must follow suit.
- **MySQL's global `default_storage_engine` on this machine is MyISAM**, which caps index keys at
  1000 bytes and silently drops foreign keys. `config/database.php` pins `'engine' => 'InnoDB'`;
  do not remove it.
- **Money is never trusted from the client.** `CheckoutService` re-reads every price, delivery
  charge and discount from the database. A `unit_price` in the request body is ignored.
- **All stock changes go through `StockService`** so `products.quantity` and
  `product_stock_movements` cannot drift apart. Never `update(['quantity' => …])` directly.
- **Settings are a key/value JSON store** (`Setting::get('fraud_detection')`), cached and busted on
  write. Only rows with `is_public = true` are readable by the storefront; credentials never are.
  The admin API masks secrets as `********` and restores them on save if unchanged.
  A save **merges** into the stored row (recursively for nested maps like `company.social`), so a
  form that renders only part of a group cannot blank the rest. It reads `$request->input('value')`
  rather than `validated()` — naming a nested rule such as `value.logo_path` makes `validated()`
  return *only* that sub-key, which silently wiped every other field. The same trap applies to
  `landing_pages.sections`; see `LandingPageController::withRawSections()`.

## Auth & permissions

Sanctum **SPA cookie** auth — the client calls `GET /sanctum/csrf-cookie`, then `POST /api/auth/login`.
No bearer tokens in `localStorage`.

Roles live in `user_roles`, never on the user row (privilege-escalation safe), and are hierarchical:
`user(0) < employee(1) < manager(2) < admin(3)`. On top of that sits a 10-module × 5-flag matrix in
`role_permissions`, seeded by `RolePermissionSeeder`. Admins bypass the matrix entirely.

Routes are guarded by two middleware: `role:employee` (minimum level) and
`module:sales,create` (matrix lookup).

## Fraud detection

`App\Services\Fraud\FraudDetectionService` scores each checkout **before** the order is created.
Any single hard signal contributes 100 and therefore blocks on its own; soft signals accumulate.

| Signal | Score | Source |
|---|---|---|
| Phone / IP / device on the manual blocklist | 100 | `blocked_phones`, `blocked_ips`, `blocked_devices` |
| Repeat order, same phone, inside the window | 100 | `orders` |
| Repeat checkout, same IP, inside the window | 100 | `fraud_attempt_log` |
| Repeat checkout, same device fingerprint | 100 | `fraud_attempt_log` |
| Delivery success rate below threshold (3+ settled orders) | 60 | `customer_risk_profiles` |
| Phone number too short | 50 | request |
| Previous order cancelled or returned | 40 | `orders` |
| Address implausibly short | 30 | request |

Levels: Low `<30`, Medium `30–59`, High `60–99`, Critical `≥100` **= blocked**.

Only **allowed** attempts are written to `fraud_attempt_log`, so a blocked attempt cannot extend its
own window. Whitelisting a phone (`customer_risk_profiles.is_whitelisted`) clears every automatic
check but never the manual blocklists.

The IP is read from the connection, never from the request body. **Configure trusted proxies before
running behind a CDN**, or the repeat-IP rule will see the proxy address for everyone.

## Courier — Steadfast only

`CourierService` handles dispatch, sync and returns. Status flows in two ways:

- **Webhook** `POST /api/webhooks/courier/steadfast`, authenticated by a bearer token from
  `Setting::get('courier_steadfast')['webhook_token']`.
- **Scheduled poll** `php artisan courier:sync`, every 5 minutes via `routes/console.php`, as a
  backstop for anything the webhook missed. Requires a running scheduler.

`applyStatus()` is idempotent — a repeated status is a no-op — and a return restores stock exactly
once, guarded by `courier_returns.stock_restored`.

Pathao and RedX are out of scope; add them behind the same `CourierService` shape if needed.

## Order statuses — exactly six

`pending · hold · fake · confirm · cancel · delivered`, lower-case, in `App\Enums\OrderStatus`.

An earlier build had fourteen, most of them shipping milestones. **Those are not gone — they moved.**
`CourierStatus` keeps the courier's own vocabulary (Picked / In Transit / Delivered / Returned /
Cancelled) on the consignment at full fidelity; only settlement is reflected back onto the order, as
`delivered` or `cancel`. Dispatch therefore no longer changes the order status at all, and
`courier_returns.stock_restored` still guards stock restoration off the consignment, not the order.

Do not add a seventh. The set is what the Facebook event mapping keys off, and an unmapped status
would silently send nothing.

## Facebook Pixel + Conversions API

Three statuses convert; the other three send **nothing**:

| Status | Event | Value |
|---|---|---|
| `pending` | `Lead` | — |
| `confirm` | `Purchase` | order total |
| `cancel` | `Cancel` (custom) | — |

The mapping sits one stage earlier than Facebook's own funnel naming, to suit cash on delivery: a
submitted order is a `Lead`, and `Purchase` fires when an admin confirms it by phone rather than on
delivery. That reports money for orders that may still fail to deliver, in exchange for a signal the
algorithm gets in hours instead of days. **`delivered` therefore sends nothing** — the Purchase has
already gone.

`Cancel` is **not a Meta standard event**; it goes as a custom event, so it needs a Custom Conversion
before it can drive optimisation, and it does not retract the `Purchase` already sent at `confirm`.

`App\Observers\OrderObserver` is the **single trigger point** — hooking the admin controller would
have missed the courier webhook and `courier:sync`, and hooking all three would have double-sent.

- **Dedup** lives in `orders.fb_events_sent`, written only *after* Facebook accepts the call, so a
  failure leaves the event still owed. `event_id` is `{order_number}-{EventName}`, which the browser
  pixel reproduces — hence the id is built from the order number, not the uuid the client never sees.
- **Failures** land in `fb_event_logs` with the payload; `php artisan fb:retry-events` (hourly)
  replays them verbatim, up to 5 attempts. Tracking never fails an order update.
- **Match quality**: `ip_address` and `user_agent` are captured at checkout from the connection and
  reused for the later Purchase and Cancel, which have no browser. Phone is normalised to `8801…`
  before hashing — the local `01…` form matches nothing.
- **`fbc` persistence**: `lib/attribution.ts` writes `fb.1.<click ts>.<fbclid>` to *localStorage* on
  arrival (the rest of the attribution is sessionStorage). The timestamp must be the click, so it
  cannot be built at checkout.
- The pixel mounts on `/lp/[slug]` and `/avyravitalplus` only — never the storefront or admin, which
  is also why a second `init` cannot double-count.
- `FB_ACCESS_TOKEN` is server-side only. Blank credentials disable sending; nothing else breaks.

Returns after a `Purchase` do not retract it — Meta's value-adjustment API is out of scope for now.

## Images are uploaded, never linked

There is no image-URL field anywhere. Every image goes through
`POST /api/admin/uploads`, which re-encodes it to WebP (stripping EXIF), writes a
`_thumb` variant, caps the longest edge per folder and registers the file in `uploads`.

Columns store the **disk-relative path**, not a URL — `App\Support\Media::url()` derives the
public URL on the way out, so the storage host can change without a data migration. Any field
that accepts an image is validated with `App\Rules\StoredImagePath`, which rejects a value that
is not a registered upload; pasting `https://…` into `images[]`, `image_path`,
`hero_image_path` or a landing-page section fails with 422.

Folders and their max edge live in `UploadService::FOLDERS`. Uploads need
`php artisan storage:link` and `FILESYSTEM_DISK=public`.

**Images are downscaled in the browser first** (`lib/image-resize.ts` → WebP, longest edge 2400).
This is not just an optimisation: WAMP ships `upload_max_filesize = 2M`, and a file over that is
discarded by PHP before Laravel sees it, surfacing only as a bare "failed to upload". Shrinking
client-side keeps uploads working whatever the host allows. `UploadService::maxBytes()` therefore
advertises the *smaller* of 5 MB and PHP's own limit, and both the per-file 422 and the
`post_max_size` 413 now name the actual limit.

## Landing pages have their own design system

`/lp/[slug]` is deliberately **not** the brand site. It is a direct-response layout — red
(`#E8253A`) on slate, Sora + Noto Serif Bengali — living in `src/app/lp/landing.css`, scoped
under `.lp` so none of it leaks into the storefront or admin. The brand chrome (teal header,
gradient footer, Anek Bangla) is not used here.

Fixed furniture around the authored blocks: patterned top header, announcement ticker, trust
strip, and a pre-footer CTA band. `landing-chrome.tsx` holds `Reveal`, `Countdown`,
`TrustStrip`, `ReviewCarousel` and `Lightbox`.

## Landing page builder

`landing_pages.sections` is an ordered JSON array of `{ type, ...props }` blocks. The admin editor
(`/admin/landing-pages/[id]`) writes it; `/lp/[slug]` renders it via
`components/landing/section-renderer.tsx`. **Unknown block types render as nothing**, so an older
published page never breaks when a new type is added.

If a page has no `order_form` block, one is appended automatically — every campaign page must be
able to take an order.

Two blocks have a fixed shape: `gallery` renders its **first** image as a wide banner and the next
four in a row beneath it; `reviews` renders every image in an auto-advancing carousel with arrows
and a dot per page. The editor updates `draft.sections` functionally — reading `draft` from the
render closure lost all but the last change, which is why only one image ever stuck.

## `/avyravitalplus` — standalone campaign page

A second Vital Plus sales page that borrows the `.lp` design system but has a **fixed layout
and no `landing_pages` row**. It lives at `src/app/avyravitalplus/`, outside the `(storefront)`
route group, so it gets none of the brand header or navigation — only `AvyraFooter`.

- All its copy is in `copy.ts` beside the page; lines still marked `[TODO]` are awaiting the
  real Bengali text. `PRODUCT_SLUG` and `VIDEO_URL` live there too.
- The order form is shared: `CampaignOrderForm` takes plain props, and `LandingOrderForm`
  is a thin adapter for pages that do have a `landing_pages` row. Without a `trackingSlug`
  no `landing_page_slug` is posted and no campaign visit is recorded — UTM attribution still
  rides along via `getAttribution()`.
- `PurchasePopup` shows staff-written "just ordered" names from the public `purchase_popup`
  setting (Settings → Social proof). They are examples, never real customer records. It does
  not use the global sonner Toaster, which is reserved for action feedback.
- Below the video it reuses the home page's brand sections (`HomeFromNature` →`AvyraFaq`)
  verbatim, wrapped in `font-sans` — `.lp` sets Sora for the campaign layout and would
  otherwise cascade into them.

## Storefront policy pages

`/returns-policy`, `/shipping-policy`, `/terms` and `/privacy` all render `PolicyPage`, whose body
is plain text in the public `policies` setting (blank lines separate paragraphs). Staff edit them
under Settings → Policies; no deploy needed.

## Design system

Ported from the previous build, not reinvented. Everything lives in
`src/app/globals.css` — Tailwind v4 has no config file.

- **Two palettes.** shadcn-style semantic tokens (`primary`, `card`, `muted`, `sidebar`, …)
  drive the shop and admin chrome; the `avyra-*` brand tokens (`avyra-teal-deep`,
  `avyra-cream`, `avyra-coral`, `avyra-teal-light`, `avyra-ink`) drive the brand pages.
  `--radius` is **0.25rem** — the UI is deliberately square-ish.
- **Custom utilities:** `avyra-footer-gradient`, `avyra-coral-gradient`, `erp-shadow`,
  `erp-shadow-md`, `animate-marquee`.
- **Fonts:** Rethink Sans throughout; the entire stack switches to Anek Bangla when the
  language toggle sets `lang="bn"` on `<html>`.
- **Bilingual.** `src/lib/translations.ts` holds every string as `{ en, bn }`; components read
  them through `useLanguage().t(key)`. Add copy there, not inline.
- **Brand imagery** lives in `public/avyra/` (25 files copied from the old repo). A few
  backdrops that were hosted on the old Lovable/CDN domains are reproduced as CSS gradients
  or still point at `rpropertybd.com`, which serves them publicly.

## Frontend notes

- **Next.js 16**: `params` and `searchParams` are Promises, unwrapped with React's `use()`.
  Turbopack is the default bundler. See `node_modules/next/dist/docs/` before reaching for
  older API shapes.
- Product images come from admin-entered URLs, so plain `<img>` is used rather than `next/image`
  and its remote-host allowlist.
- Forms that need server data seed `useState` from props and are mounted only once that data
  exists — no `setState` inside an effect.
- Browser-only state (language, sidebar collapse) is read with `useStoredValue`
  (`useSyncExternalStore`), so SSR and hydration agree without a post-mount re-render.

> **Editing files on Windows:** do not bulk-rewrite sources with PowerShell 5.1 —
> `Get-Content`/`Set-Content` round-trip UTF-8 through the ANSI codepage and corrupt the
> Bengali strings. Use the editing tools or `sed`.
