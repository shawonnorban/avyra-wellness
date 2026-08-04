# Facebook Pixel + Conversions API (CAPI) Implementation Spec (v2)
### প্রজেক্ট: Next.js ল্যান্ডিং পেজ + কাস্টম অ্যাডমিন প্যানেল

এই ডকুমেন্টটি একটি ধাপে ধাপে ইমপ্লিমেন্টেশন গাইড। AI এজেন্ট এই ডকুমেন্ট অনুসরণ করে সম্পূর্ণ ফিচারটি বাস্তবায়ন করবে।

---

## ধাপ ০: শুরুর আগে বাধ্যতামূলক অডিট (Pre-implementation Audit)

কোনো নতুন কোড লেখার আগে নিচের বিষয়গুলো পুরো প্রজেক্টে খুঁজে বের করো এবং রিপোর্ট করো:

1. **বিদ্যমান Facebook Pixel কোড খোঁজো:**
   - `fbq(`, `facebook-pixel`, `FB_PIXEL_ID`, `NEXT_PUBLIC_FB_PIXEL_ID` — এসব কিওয়ার্ড দিয়ে পুরো কোডবেজ সার্চ করো।
   - `layout.tsx`, `_app.tsx`, `_document.tsx`, বা কোনো `<Script>`/`<head>` কম্পোনেন্টে Pixel base code আগে থেকে বসানো আছে কিনা চেক করো।
   - যদি থাকে, সেটা রিইউজ করো — নতুন করে ডুপ্লিকেট Pixel init কোড বসিও না (একই পেজে দুইবার Pixel init হলে ডাবল কাউন্টিং হবে)।

2. **বিদ্যমান API রুট/সার্ভার অ্যাকশন খোঁজো:**
   - `app/api/` ডিরেক্টরিতে ইতিমধ্যে কোনো ট্র্যাকিং/ইভেন্ট/webhook রুট আছে কিনা দেখো (যেমন `track-event`, `fb-event`, `pixel`, `conversion` নামে কিছু)।
   - থাকলে সেটা এক্সটেন্ড করো, নতুন ডুপ্লিকেট রুট বানিও না।

3. **অর্ডার স্ট্যাটাস আপডেট লজিক খুঁজে বের করো:**
   - অ্যাডমিন প্যানেলে অর্ডার স্ট্যাটাস পরিবর্তনের ফাংশন/সার্ভার অ্যাকশন/API রুট কোথায় আছে তা লোকেট করো (সম্ভবত `updateOrderStatus`, `changeStatus`, বা অ্যাডমিন অর্ডার কন্ট্রোলারে)।
   - এই একটিমাত্র জায়গা থেকেই সব ইভেন্ট ট্রিগার হবে — কোনোভাবেই একাধিক জায়গায় একই ইভেন্ট পাঠানোর কোড বসিও না।

4. **অর্ডার ডাটাবেজ স্কিমা দেখো:**
   - `Order` মডেল/টেবিলের বর্তমান স্ট্রাকচার কী, কোন ORM (Prisma/Mongoose/Drizzle ইত্যাদি) ব্যবহৃত হচ্ছে সেটা শনাক্ত করো।
   - ইমেইল/ফোন ফিল্ড কোন নামে সেভ আছে চেক করো।

5. **পরিবেশ ভেরিয়েবল (.env) চেক করো:**
   - `FB_PIXEL_ID`, `FB_ACCESS_TOKEN`, `NEXT_PUBLIC_FB_PIXEL_ID` ইতিমধ্যে আছে কিনা দেখো।

**অডিট শেষে একটি সংক্ষিপ্ত রিপোর্ট দাও:** কী কী ইতিমধ্যে আছে, কী নতুন বানাতে হবে, এবং কোথায় ডুপ্লিকেশনের ঝুঁকি ছিল যা এড়ানো হয়েছে।

---

## ধাপ ০.৫: বিদ্যমান অর্ডার স্ট্যাটাস অডিট ও ক্লিনআপ

এই প্রজেক্টে **শুধুমাত্র নিচের ৬টি স্ট্যাটাস** রাখা হবে। অন্য কোনো স্ট্যাটাস প্রয়োজন নেই।

```
pending, hold, fake, confirm, cancel, delivered
```

1. **বিদ্যমান স্ট্যাটাস enum/লিস্ট খুঁজে বের করো** — ডাটাবেজ স্কিমা, TypeScript টাইপ, এবং অ্যাডমিন প্যানেলের UI dropdown — সব জায়গায়।
2. **তুলনা করো** — অতিরিক্ত স্ট্যাটাস, নাম-ভিন্ন-কিন্তু-একই-অর্থ স্ট্যাটাস, অনুপস্থিত স্ট্যাটাস চিহ্নিত করো।
3. **ডাটা মাইগ্রেশন পরিকল্পনা করো** — উদাহরণ: `processing`/`verified` → `confirm`, `returned`/`rejected` → `cancel`, `spam`/`duplicate` → `fake`। মাইগ্রেশনের আগে ব্যাকআপ নেওয়ার কথা মনে করিয়ে দাও।
4. **কোড থেকে অপ্রয়োজনীয় স্ট্যাটাস মুছে ফেলো** — স্কিমা, টাইপ, UI dropdown, ডেড কোড ব্র্যাঞ্চ সব জায়গা থেকে।
5. **ফাইনাল রিপোর্ট দাও** — কী মুছল, কোথায় ম্যাপ করল, কতগুলো রেকর্ড মাইগ্রেট হলো।

**নোট:** প্রজেক্টে ইতিমধ্যে ঠিক এই ৬টি স্ট্যাটাসই থাকলে এই ধাপে পরিবর্তনের দরকার নেই — শুধু অডিট রিপোর্টে নিশ্চিত করে লেখো।

---

## ধাপ ১: অর্ডার স্ট্যাটাস ও ইভেন্ট ম্যাপিং (চূড়ান্ত স্ট্যান্ডার্ড)

| স্ট্যাটাস | Facebook Event | Event Type | কখন ট্রিগার হবে |
|---|---|---|---|
| `pending` | `InitiateCheckout` | Standard | অর্ডার ফর্ম সাবমিট হওয়ার সাথে সাথে |
| `hold` | — কোনো ইভেন্ট না | — | শুধু ইন্টারনাল ফ্ল্যাগ |
| `fake` | — কোনো ইভেন্ট না | — | শুধু ইন্টারনাল ফ্ল্যাগ + রিপোর্টিং |
| `confirm` | `Lead` | Standard | অ্যাডমিন ফোনে অর্ডার কনফার্ম করলে |
| `cancel` | — কোনো ইভেন্ট না | — | শুধু ইন্টারনাল ফ্ল্যাগ |
| `delivered` | `Purchase` | Standard (value সহ) | পণ্য ডেলিভার ও টাকা কালেক্ট হলে |

**নীতি:** `Purchase` ইভেন্ট শুধুমাত্র `delivered` স্ট্যাটাসে পাঠানো হবে, প্রকৃত অর্ডার ভ্যালু সহ। এই ৬টি ছাড়া অন্য কোনো স্ট্যাটাস তৈরি করা যাবে না।

---

## ধাপ ২: ডাটাবেজ স্কিমা পরিবর্তন

`Order` মডেলে নিচের ফিল্ডগুলো যোগ করো:

```
status: enum('pending', 'hold', 'fake', 'confirm', 'cancel', 'delivered')

fbEventsSent: {
  initiateCheckout: boolean (default false),
  lead: boolean (default false),
  purchase: boolean (default false),
}

// Attribution ও Match Quality-এর জন্য (নতুন — গ্যাপ ফিক্স)
fbclid: string | null
fbp: string | null            // পিক্সেলের _fbp কুকি ভ্যালু
fbc: string | null            // পিক্সেলের _fbc কুকি ভ্যালু (fbclid-এর প্রসেসড ভার্সন, timestamp সহ)
clientIp: string | null       // অর্ডার সাবমিট হওয়ার সময়কার IP
userAgent: string | null      // অর্ডার সাবমিট হওয়ার সময়কার browser user agent

totalAmount: number
email: string | null
phone: string
```

নতুন টেবিল — **ব্যর্থ ইভেন্ট লগ (নতুন — গ্যাপ ফিক্স, retry-এর জন্য প্রয়োজনীয়):**

```
FBEventLog {
  id: string (primary key)
  orderId: string
  eventName: string           // InitiateCheckout | Lead | Purchase
  status: enum('pending', 'success', 'failed')
  payload: json                // পাঠানো পুরো payload, ডিবাগ/রিট্রাই-এর জন্য
  errorMessage: string | null
  attemptCount: number (default 0)
  lastAttemptAt: datetime | null
  createdAt: datetime
}
```

---

## ধাপ ৩: এনভায়রনমেন্ট ভেরিয়েবল

```
NEXT_PUBLIC_FB_PIXEL_ID=your_pixel_id_here
FB_ACCESS_TOKEN=your_capi_access_token_here
FB_API_VERSION=v20.0

# নতুন — গ্যাপ ফিক্স: টেস্ট ও প্রোডাকশন ইভেন্ট আলাদা রাখার জন্য
FB_TEST_EVENT_CODE=              # শুধু ডেভেলপমেন্টে সেট থাকবে, প্রোডাকশনে খালি/অনুপস্থিত থাকবে
```

`FB_ACCESS_TOKEN` কখনোই `NEXT_PUBLIC_` প্রিফিক্স দিয়ে রাখা যাবে না।

---

## ধাপ ৪: Pixel Base Code (client-side)

**শুধুমাত্র যদি ধাপ ০-এ কোনো বিদ্যমান Pixel init কোড না পাওয়া যায়, তবেই এই ধাপ করো।**

```tsx
import Script from 'next/script';

<Script id="fb-pixel" strategy="afterInteractive">
  {`
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
    fbq('track', 'PageView');
  `}
</Script>
<noscript>
  <img height="1" width="1" style={{ display: 'none' }}
    src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FB_PIXEL_ID}&ev=PageView&noscript=1`}
  />
</noscript>
```

---

## ধাপ ৪.৫: `fbclid`/`fbp`/`fbc` ক্যাপচার ও পার্সিস্টেন্স (নতুন — গ্যাপ ফিক্স)

**সমস্যা:** কাস্টমার ল্যান্ডিং পেজে বিজ্ঞাপন থেকে এসে অন্য পেজে গেলে বা রিফ্রেশ করলে URL-এর `fbclid` হারিয়ে যায়। এছাড়া `fbc`-এর টাইমস্ট্যাম্প বর্তমান সময় দিয়ে বানানো ভুল — এটা ক্লিক হওয়ার সময়ের হওয়া উচিত।

একটি ইউটিলিটি ফাইল বানাও — `lib/facebook/captureAttribution.ts` (client-side, প্রজেক্টে ইতিমধ্যে কোনো attribution capture লজিক থাকলে সেটাই এক্সটেন্ড করো):

```ts
// পেজ লোড হওয়ার সময় (root layout বা landing page-এ) একবার কল করবে
export function captureAndPersistAttribution() {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get('fbclid');

  // fbclid থাকলে সঠিক ফরম্যাটে fbc বানিয়ে localStorage-এ সেভ করো
  if (fbclid) {
    const fbc = `fb.1.${Date.now()}.${fbclid}`; // এই মুহূর্তেই ক্লিক ধরা হচ্ছে, তাই এখানেই Date.now() ঠিক আছে
    localStorage.setItem('fb_fbc', fbc);
    localStorage.setItem('fb_fbclid', fbclid);
  }
}

// ফর্ম সাবমিট করার সময় এই ফাংশন দিয়ে সংগ্রহ করা তথ্য নাও
export function getStoredAttribution() {
  if (typeof window === 'undefined') return { fbc: null, fbp: null };

  // fbp পিক্সেল নিজেই কুকি হিসেবে সেট করে, localStorage-এ রাখার দরকার নেই — সরাসরি কুকি থেকে পড়ো
  const fbp = document.cookie.match(/_fbp=([^;]+)/)?.[1] ?? null;

  // fbc: আগে পিক্সেলের নিজস্ব _fbc কুকি চেক করো, না থাকলে localStorage-এ সেভ করা ভ্যালু ব্যবহার করো
  const fbcCookie = document.cookie.match(/_fbc=([^;]+)/)?.[1];
  const fbc = fbcCookie ?? localStorage.getItem('fb_fbc');

  return { fbc, fbp };
}
```

**ইন্টিগ্রেশন নির্দেশনা:**
- `captureAndPersistAttribution()` root layout-এ পেজ লোড হওয়ার সাথে সাথে একবার কল করো (useEffect দিয়ে)।
- অর্ডার ফর্ম সাবমিট হ্যান্ডলারে `getStoredAttribution()` কল করে `fbc`, `fbp` অর্ডার পেলোডে যোগ করো, সাথে `fbclid`-ও।
- ধাপ ০-এ বিদ্যমান ফর্ম হ্যান্ডলার খুঁজে সেখানেই এই কল যোগ করো, নতুন ফর্ম বানিও না।

---

## ধাপ ৫: কেন্দ্রীয় CAPI ইউটিলিটি ফাইল তৈরি করো (আপডেটেড — গ্যাপ ফিক্স সহ)

`lib/facebook/sendFBEvent.ts` (বিদ্যমান ফোল্ডার থাকলে সেখানেই রাখো):

```ts
import crypto from 'crypto';

function hashData(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

type FBEventName = 'InitiateCheckout' | 'Lead' | 'Purchase';

interface OrderForEvent {
  id: string;
  email?: string | null;
  phone: string;
  totalAmount?: number;
  fbc?: string | null;          // নতুন
  fbp?: string | null;          // নতুন
  clientIp?: string | null;     // নতুন
  userAgent?: string | null;    // নতুন
}

interface SendFBEventOptions {
  value?: number;
  currency?: string;
  contentIds?: string[];        // নতুন — প্রোডাক্ট-লেভেল ডেটা
  contentName?: string;         // নতুন
}

export async function sendFBEvent(
  eventName: FBEventName,
  order: OrderForEvent,
  options: SendFBEventOptions = {}
) {
  const eventId = `${order.id}-${eventName}`;

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: 'website',
        user_data: {
          em: order.email ? [hashData(order.email)] : undefined,
          ph: [hashData(order.phone)],
          fbc: order.fbc ?? undefined,
          fbp: order.fbp ?? undefined,
          client_ip_address: order.clientIp ?? undefined,   // নতুন — Match Quality বাড়ায়
          client_user_agent: order.userAgent ?? undefined,  // নতুন — Match Quality বাড়ায়
          external_id: order.id ? [hashData(order.id)] : undefined, // নতুন — Match Quality বাড়ায়
        },
        custom_data: {
          value: options.value ?? order.totalAmount,
          currency: options.currency ?? 'BDT',
          content_ids: options.contentIds,      // নতুন
          content_name: options.contentName,    // নতুন
          content_type: 'product',              // নতুন
        },
      },
    ],
    // নতুন — শুধু ডেভেলপমেন্টে টেস্ট ইভেন্ট আলাদা রাখার জন্য
    ...(process.env.FB_TEST_EVENT_CODE
      ? { test_event_code: process.env.FB_TEST_EVENT_CODE }
      : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${process.env.FB_API_VERSION}/${process.env.NEXT_PUBLIC_FB_PIXEL_ID}/events?access_token=${process.env.FB_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error(`[FB CAPI] ${eventName} failed for order ${order.id}:`, data);
      // নতুন — ব্যর্থ ইভেন্ট লগ টেবিলে সেভ করো, ধাপ ৫.৫ দেখো
      return { success: false, error: data, payload };
    }

    return { success: true, eventId };
  } catch (err) {
    console.error(`[FB CAPI] ${eventName} exception for order ${order.id}:`, err);
    return { success: false, error: err, payload };
  }
}
```

**IP ও User-Agent কোথা থেকে পাবে:** যে API রুট/সার্ভার অ্যাকশন থেকে অর্ডার সাবমিট বা স্ট্যাটাস আপডেট হ্যান্ডল হয়, সেখানকার `request` অবজেক্ট থেকে সংগ্রহ করে অর্ডার তৈরির সময় ডাটাবেজে সেভ করে রাখো (`clientIp`, `userAgent` ফিল্ড, ধাপ ২ দেখো) — যাতে পরবর্তী স্ট্যাটাস-ভিত্তিক ইভেন্টগুলোতেও (Lead, Purchase) একই তথ্য পুনরায় ব্যবহার করা যায়।

---

## ধাপ ৫.৫: ব্যর্থ ইভেন্ট লগ ও রিট্রাই মেকানিজম (নতুন — গ্যাপ ফিক্স)

**সমস্যা:** এখন কোনো CAPI কল ব্যর্থ হলে শুধু `console.error` হয়, ডেটা চিরতরে হারিয়ে যায়।

`lib/facebook/sendFBEvent.ts`-এ একটি wrapper ফাংশন যোগ করো:

```ts
export async function sendFBEventWithLogging(
  eventName: FBEventName,
  order: OrderForEvent,
  options: SendFBEventOptions = {}
) {
  const result = await sendFBEvent(eventName, order, options);

  if (!result.success) {
    await db.fbEventLog.create({
      data: {
        orderId: order.id,
        eventName,
        status: 'failed',
        payload: result.payload ?? {},
        errorMessage: JSON.stringify(result.error),
        attemptCount: 1,
        lastAttemptAt: new Date(),
      },
    });
  }

  return result;
}
```

ধাপ ৭-এ `sendFBEvent` এর জায়গায় `sendFBEventWithLogging` ব্যবহার করো।

**রিট্রাই স্ক্রিপ্ট** — একটি ক্রন জব/স্ক্রিপ্ট বানাও (`scripts/retryFailedFBEvents.ts`), যেটা নির্দিষ্ট বিরতিতে (যেমন প্রতি ঘণ্টায়) চলবে:

```ts
async function retryFailedEvents() {
  const failedLogs = await db.fbEventLog.findMany({
    where: { status: 'failed', attemptCount: { lt: 5 } }, // সর্বোচ্চ ৫ বার চেষ্টা
  });

  for (const log of failedLogs) {
    const order = await db.order.findUnique({ where: { id: log.orderId } });
    if (!order) continue;

    const result = await sendFBEvent(log.eventName as FBEventName, order);

    await db.fbEventLog.update({
      where: { id: log.id },
      data: {
        status: result.success ? 'success' : 'failed',
        attemptCount: { increment: 1 },
        lastAttemptAt: new Date(),
        errorMessage: result.success ? null : JSON.stringify(result.error),
      },
    });
  }
}
```

প্রজেক্টে ইতিমধ্যে কোনো ক্রন/স্কেজুলড জব সিস্টেম (যেমন Vercel Cron, node-cron) থাকলে সেটাই ব্যবহার করো, নতুন সিস্টেম বসিও না।

---

## ধাপ ৬: dedup গার্ড ফাংশন

```ts
export async function shouldSendEvent(
  order: { fbEventsSent?: Record<string, boolean> },
  key: 'initiateCheckout' | 'lead' | 'purchase'
): Promise<boolean> {
  return !order.fbEventsSent?.[key];
}
```

---

## ধাপ ৭: স্ট্যাটাস আপডেট ফাংশনে হুক বসানো (আপডেটেড)

```ts
import { sendFBEventWithLogging } from '@/lib/facebook/sendFBEvent';
import { shouldSendEvent } from '@/lib/facebook/markEventSent';

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  const order = await db.order.update({
    where: { id: orderId },
    data: { status: newStatus },
  });

  try {
    if (newStatus === 'pending' && (await shouldSendEvent(order, 'initiateCheckout'))) {
      const result = await sendFBEventWithLogging('InitiateCheckout', order);
      if (result.success) {
        await db.order.update({
          where: { id: orderId },
          data: { fbEventsSent: { ...order.fbEventsSent, initiateCheckout: true } },
        });
      }
    }

    if (newStatus === 'confirm' && (await shouldSendEvent(order, 'lead'))) {
      const result = await sendFBEventWithLogging('Lead', order);
      if (result.success) {
        await db.order.update({
          where: { id: orderId },
          data: { fbEventsSent: { ...order.fbEventsSent, lead: true } },
        });
      }
    }

    if (newStatus === 'delivered' && (await shouldSendEvent(order, 'purchase'))) {
      const result = await sendFBEventWithLogging('Purchase', order, {
        value: order.totalAmount,
        currency: 'BDT',
      });
      if (result.success) {
        await db.order.update({
          where: { id: orderId },
          data: { fbEventsSent: { ...order.fbEventsSent, purchase: true } },
        });
      }
    }

    // hold, fake, cancel → ইচ্ছাকৃতভাবে কিছুই পাঠানো হয় না
  } catch (fbError) {
    console.error('FB tracking error (order update still succeeded):', fbError);
  }

  return order;
}
```

---

## ধাপ ৮: (ঐচ্ছিক / ভবিষ্যতের জন্য) রিটার্ন-রিফান্ড হ্যান্ডলিং

**সমস্যা:** `delivered`-এ একবার `Purchase` পাঠানোর পর কাস্টমার যদি পণ্য ফেরত দেয়, তার জন্য কোনো সংশোধন সিগন্যাল নেই।

যদি প্রজেক্টে রিটার্ন/রিফান্ড ফিচার সাধারণ হয় (এখনই ইমপ্লিমেন্ট না করলেও অন্তত ভবিষ্যতের জন্য নোট রাখো):
- স্ট্যাটাস লিস্টে `returned` যোগ করার দরকার নেই, বরং `delivered` অর্ডারে একটি আলাদা বুলিয়ান ফ্ল্যাগ `isReturned` রাখা যায়।
- `isReturned = true` হলে Meta-এর [Offline Conversions / Value Adjustment API](https://developers.facebook.com/docs/marketing-api/conversions-api) ব্যবহার করে আগের `Purchase` ইভেন্টের ভ্যালু সংশোধন করা যায়।
- এটি এই মুহূর্তে বাধ্যতামূলক না — শুধু ভবিষ্যতে প্রয়োজন হলে রেফারেন্স হিসেবে রাখা হলো।

---

## ধাপ ৯: টেস্টিং (আপডেটেড)

1. Facebook Events Manager → **Test Events** ট্যাব থেকে টেস্ট কোড নিয়ে `.env.local`-এ `FB_TEST_EVENT_CODE` সেট করো।
2. অর্ডার তৈরি করে প্রতিটা স্ট্যাটাস পরিবর্তন করে দেখো — Events Manager-এ ইভেন্ট আসছে কিনা, এবং **Match Quality Score** কেমন দেখাচ্ছে তা যাচাই করো (আগের চেয়ে বেশি স্কোর আসা উচিত, কারণ এখন IP/UA/fbc/fbp/external_id পাঠানো হচ্ছে)।
3. `hold`, `fake`, `cancel`-এ পরিবর্তন করে নিশ্চিত হও **কোনো ইভেন্ট যাচ্ছে না**।
4. একই স্ট্যাটাসে দুইবার আপডেট করে dedup গার্ড যাচাই করো।
5. Events Manager-এ **Deduplication** কলাম চেক করো।
6. অ্যাডমিন প্যানেলের dropdown-এ শুধু ৬টি স্ট্যাটাস আছে কিনা যাচাই করো।
7. **ব্যর্থ ইভেন্ট টেস্ট:** ইচ্ছাকৃতভাবে ভুল `FB_ACCESS_TOKEN` দিয়ে একটা ইভেন্ট পাঠিয়ে দেখো `FBEventLog` টেবিলে রেকর্ড তৈরি হচ্ছে কিনা, তারপর সঠিক টোকেন দিয়ে রিট্রাই স্ক্রিপ্ট চালিয়ে দেখো সেটা `success` হচ্ছে কিনা।
8. `fbclid` সহ একটা টেস্ট লিংক দিয়ে ল্যান্ডিং পেজে ঢুকে অন্য পেজে গিয়ে ফর্ম পূরণ করে দেখো `fbc`/`fbp` ঠিকমতো অর্ডারের সাথে সেভ হচ্ছে কিনা (পার্সিস্টেন্স টেস্ট)।

---

## চূড়ান্ত চেকলিস্ট

- [ ] ধাপ ০ ও ০.৫ এর অডিট সম্পন্ন ও রিপোর্ট দেওয়া হয়েছে
- [ ] স্কিমা/টাইপ/UI-তে ঠিক ৬টি স্ট্যাটাস আছে
- [ ] কোনো ডুপ্লিকেট Pixel/API কোড নেই
- [ ] `fbEventsSent` দিয়ে dedup গার্ড কাজ করছে
- [ ] `Purchase` শুধু `delivered`-এ যাচ্ছে; `hold`/`fake`/`cancel`-এ কিছু যাচ্ছে না
- [ ] ইমেইল/ফোন SHA-256 হ্যাশ হয়ে যাচ্ছে
- [ ] **`client_ip_address`, `client_user_agent`, `fbc`, `fbp`, `external_id` পাঠানো হচ্ছে** (নতুন)
- [ ] **`fbclid`/`fbc` সঠিকভাবে ক্যাপচার ও পার্সিস্ট হচ্ছে (পেজ পরিবর্তনেও হারাচ্ছে না)** (নতুন)
- [ ] **ব্যর্থ ইভেন্ট `FBEventLog`-এ সেভ হচ্ছে এবং রিট্রাই স্ক্রিপ্ট কাজ করছে** (নতুন)
- [ ] **`FB_TEST_EVENT_CODE` দিয়ে টেস্ট ও প্রোডাকশন ইভেন্ট আলাদা থাকছে** (নতুন)
- [ ] `content_ids`/`content_name` custom_data-তে যোগ করা হয়েছে (নতুন, ভবিষ্যতের Catalog/Dynamic Ads-এর জন্য)
- [ ] `FB_ACCESS_TOKEN` শুধু সার্ভার-সাইডে ব্যবহৃত হচ্ছে
- [ ] ট্র্যাকিং ফেইল হলেও মূল অর্ডার-আপডেট অপারেশন সফল থাকছে
- [ ] Test Events-এ Match Quality Score যাচাই করা হয়েছে
