# Meta Pixel + Conversions API (CAPI) Tracking System — Build Brief

## প্রজেক্ট সামারি
আমাদের একটি ই-কমার্স/অর্ডার-বেসড সিস্টেমের জন্য Meta (Facebook) Pixel ও Conversions API (CAPI) একসাথে সেটআপ করতে হবে, যাতে প্রতিটি customer action সঠিক Meta event-এ ম্যাপ হয়, duplicate event না হয়, এবং customer-দের আলাদা আলাদা segment/list-এ ভাগ করে রাখা যায় (Lookalike audience তৈরির জন্য)।

---

## ১. Event Mapping (Customer Action → Meta Event)

| Customer Action | Meta Event |
|---|---|
| Product page ভিজিট করেছে | `ViewContent` |
| Order button চেপেছে | `InitiateCheckout` |
| Form সাবমিট করেছে | `Lead` অথবা custom `OrderSubmitted` |
| ফোনে order confirm করেছে (OTP/manual call) | `Purchase` অথবা custom `ConfirmedOrder` |
| Product delivery সম্পন্ন হয়েছে | custom `DeliveredPurchase` (Offline/CAPI event) |

**Requirement:** প্রতিটি event-এর সাথে সংশ্লিষ্ট product/order data (value, currency, content_id ইত্যাদি) পাঠাতে হবে।

---

## ২. Technical Requirements

1. **Form submit event** — `Lead` বা `OrderSubmitted` নামে custom event ফায়ার করতে হবে, ফর্ম সাবমিট হওয়ার সাথে সাথে (client-side Pixel + server-side CAPI দুই জায়গা থেকেই)।
2. **OTP/Phone-confirmed order event** — `Purchase` অথবা custom `ConfirmedOrder` event, শুধুমাত্র order কনফার্ম হওয়ার পরেই ফায়ার হবে।
3. **Event ID mapping** — প্রতিটি confirmed order-এর সাথে একটি unique **Meta `event_id`** ডাটাবেজে সংরক্ষণ করতে হবে, যাতে Pixel ও CAPI থেকে পাঠানো একই event dedupe করা যায়।
4. **Deduplication** — Pixel (browser-side) ও CAPI (server-side) থেকে একই event দুইবার পাঠানো হলে Meta যেন সেটাকে single conversion হিসেবে গণনা করে — এর জন্য একই `event_id` ও `event_name` ব্যবহার করতে হবে (Meta-র official deduplication guideline অনুযায়ী)।
5. **Cancelled/fake order tagging** — এই ধরনের অর্ডারগুলো আলাদাভাবে ডাটাবেজে ট্যাগ করতে হবে, যাতে এগুলো কোনো conversion event হিসেবে Meta-তে না যায়।
6. **Delivered order sync** — ডেলিভারি সম্পন্ন হওয়া অর্ডারগুলো একটি scheduled job/webhook-এর মাধ্যমে CAPI-তে `DeliveredPurchase` (offline conversion) event হিসেবে পাঠাতে হবে।

---

## ৩. Customer Segmentation (Database Lists)

সিস্টেমে নিচের লিস্টগুলো আলাদাভাবে maintain করতে হবে:

- Delivered customers
- Repeat customers
- Confirmed but not yet delivered
- Cancelled customers
- Returned customers
- Invalid/fake submissions

**উদ্দেশ্য:** পর্যাপ্ত ডেটা জমা হলে Delivered ও Repeat customer লিস্ট থেকে সবচেয়ে strong Lookalike Audience signal তৈরি করা যাবে Meta Ads Manager-এ।

---

## ৪. Google Tag Manager (GTM) Setup

সাইটে নিচের GTM কনটেইনার বসাতে হবে (মিডিয়া বায়ার থেকে পাওয়া):

- **GTM Container ID:** `GTM-T78PFPTT`
- `<head>` ট্যাগের শুরুতে GTM head script বসবে
- `<body>` ট্যাগের ঠিক পরে GTM noscript iframe বসবে
- Pixel/CAPI event trigger গুলো GTM-এর মাধ্যমেই ফায়ার হবে যদি media buyer সেভাবে সেটআপ করে থাকেন — তাই dataLayer push structure নিয়ে media buyer-এর সাথে confirm করে নিতে হবে যাতে backend থেকে পাঠানো data ও GTM-এর dataLayer key নাম মিলে যায়।

## ৫. Purchase Event — Required CAPI Payload Fields

মিডিয়া বায়ার নির্দিষ্ট করে দিয়েছেন `Purchase` event-এ ঠিক কোন কোন ফিল্ড পাঠাতে হবে:

| Field | নোট |
|---|---|
| `event_name` | মান হবে `Purchase` |
| `event_time` | Unix timestamp (order confirm হওয়ার সময়) |
| `event_id` | Deduplication-এর জন্য unique ID (Pixel ও CAPI-তে same থাকতে হবে) |
| `value` | Order-এর টাকার পরিমাণ |
| `currency` | যেমন `BDT` |
| `order_id` | ইউনিক অর্ডার আইডি |
| `fbp` | Browser-এ সেট হওয়া Facebook Pixel cookie (`_fbp`) |
| `fbc` | Facebook Click ID cookie (`_fbc`), যদি ad click থেকে আসা visitor হয় |
| `phone` | **SHA256 hashed** ফরম্যাটে পাঠাতে হবে (plain text নয় — Meta-র `user_data` requirement অনুযায়ী hashing বাধ্যতামূলক) |

**গুরুত্বপূর্ণ পয়েন্ট:**
- `fbp` ও `fbc` কুকি ব্রাউজার থেকে ক্যাপচার করে backend-এ ফরম সাবমিটের সাথে সংরক্ষণ করতে হবে, যাতে পরে (ফোনে অর্ডার কনফার্ম হওয়ার সময়) CAPI call-এ পাঠানো যায়।
- `phone` হ্যাশ করার আগে normalize করতে হবে (country code সহ, স্পেস/ড্যাশ ছাড়া), তারপর SHA256 apply করতে হবে — Meta-র `hashing guideline` অনুসরণ করে।
- এই সব ফিল্ড `user_data` অবজেক্টের ভেতরে (`fbp`, `fbc`, `ph`) এবং বাকিগুলো top-level event data হিসেবে যাবে — এটা Meta CAPI-র official schema অনুযায়ী ঠিক করে নিতে হবে।

## ৬. Agent-কে নির্দেশনা (Instructions for Claude Agent)

> এই সিস্টেম বিল্ড করার আগে বা করার সময়, যদি নিচের যেকোনো তথ্য/অ্যাক্সেস প্রয়োজন হয়, তাহলে অনুমান না করে সরাসরি জিজ্ঞেস করবে:
>
> 1. বর্তমান tech stack (backend language/framework, database, frontend)
> 2. Meta Pixel ID ও CAPI Access Token কোথায় সংরক্ষিত আছে / কীভাবে দেওয়া হবে
> 3. বর্তমান order/form submission flow-এর কোড বা API endpoint
> 4. Delivery status কীভাবে আপডেট হয় (manual/CRM/courier API)
> 5. Existing Pixel/CAPI implementation-এর কোড (যদি থাকে) যাতে duplicate কাজ না হয়
> 6. Test event পাঠানোর জন্য Meta Test Event Code আছে কিনা
> 7. Customer segmentation ডেটা কোথায় রাখা হবে (নতুন টেবিল/existing CRM ফিল্ড)
>
> কাজ শুরুর আগে একটি সংক্ষিপ্ত implementation plan দেবে, এবং প্রতিটি ধাপ শেষে টেস্ট করার উপায় জানাবে (যেমন Meta Events Manager-এ Test Events ট্যাবে verify করা)।

---

## ৭. Deliverables (প্রত্যাশিত আউটপুট)

- [ ] GTM কন্টেইনার (`GTM-T78PFPTT`) সঠিকভাবে সাইটে ইনস্টল
- [ ] সব ৫টি event-এর জন্য Pixel + CAPI implementation
- [ ] `Purchase` event-এ উল্লেখিত সব ফিল্ড (event_id, fbp, fbc, hashed phone সহ) সঠিকভাবে পাঠানো হচ্ছে কিনা তা verify
- [ ] Event ID generation ও deduplication লজিক
- [ ] Cancelled/fake order filtering লজিক
- [ ] Delivered order-এর জন্য scheduled/webhook-based CAPI sync
- [ ] ৬টি customer list-এর জন্য ডাটাবেজ স্ট্রাকচার/query
- [ ] Testing checklist (Meta Events Manager → Test Events ট্যাবে প্রতিটি event ও তার parameter match-quality verify করার জন্য)
