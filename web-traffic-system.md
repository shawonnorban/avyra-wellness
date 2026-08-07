# Web Traffic System Implementation Note

> এই নোটে বর্তমান প্রোজেক্টের Web Traffic / Site Analytics সিস্টেম কীভাবে কাজ করে, কোন ফাইল-কোড আছে এবং অন্য সাইটে একই সিস্টেম কীভাবে লাগাবেন — তা step-by-step লেখা হলো।

---

## 1. Overview (সিস্টেম কী করে)

| দিক | বর্ণনা |
|------|--------|
| **Goal** | পাবলিক সাইটের ভিজিটর কাউন্ট এবং মার্কেটিং ক্যাম্পেইন অ্যাট্রিবিউশন ট্র্যাক করা |
| **Architecture** | React SPA → Supabase (PostgreSQL) → Analytics Dashboard |
| **Tracked events** | `pageview` (route change) |
| **Captured params** | UTM (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `utm_id`), `fbclid`, `fbc`, `fbp`, landing URL, referrer, user-agent |
| **Storage** | `public.campaign_visits` table |

---

## 2. Database Layer

### Table: `public.campaign_visits`

```sql
CREATE TABLE public.campaign_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id uuid REFERENCES public.landing_pages(id),
  campaign_id uuid REFERENCES public.campaigns(id),
  event_type text NOT NULL DEFAULT 'page_view',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_visits ENABLE ROW LEVEL SECURITY;

-- authenticated users: full access
CREATE POLICY "Authenticated users can manage campaign_visits"
  ON public.campaign_visits FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- anonymous users: only insert (so public site can track visits)
CREATE POLICY "Public can insert campaign_visits"
  ON public.campaign_visits FOR INSERT TO anon WITH CHECK (true);

-- grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_visits TO authenticated;
GRANT INSERT ON public.campaign_visits TO anon;
GRANT ALL ON public.campaign_visits TO service_role;
```

> **Note:** অন্য সাইটে শুধু `campaign_visits` table টা লাগলেই চলবে। `landing_page_id` / `campaign_id` optional — আপনার প্রয়োজনে সরিয়ে দিতে পারেন।

---

## 3. Frontend Data Capture

### 3.1 Route Change Tracker

**File:** `src/components/shared/AttributionTracker.tsx`

```tsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { captureAttribution } from "@/lib/attribution";
import { supabase } from "@/integrations/supabase/client";

const PRIVATE_PREFIXES = ["/admin", "/login", "/auth"];

const recordVisit = async (path: string) => {
  if (typeof window === "undefined") return;
  if (PRIVATE_PREFIXES.some((p) => path.startsWith(p))) return;

  // dedupe per path per session
  const key = "site_visit_paths";
  let seen: string[] = JSON.parse(sessionStorage.getItem(key) || "[]");
  if (seen.includes(path)) return;
  seen.push(path);
  sessionStorage.setItem(key, JSON.stringify(seen));

  const params = new URLSearchParams(window.location.search);
  try {
    await supabase.from("campaign_visits").insert({
      event_type: "pageview",
      user_agent: navigator.userAgent,
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
    });
  } catch {
    // tracking must never break the app
  }
};

const AttributionTracker = () => {
  const location = useLocation();
  useEffect(() => {
    captureAttribution();
    recordVisit(location.pathname);
  }, [location.search, location.pathname]);
  return null;
};

export default AttributionTracker;
```

**Mount in App:** `src/App.tsx`

```tsx
<BrowserRouter>
  <AuthProvider>
    <SidebarStateProvider>
      <AttributionTracker />
      ...
    </SidebarStateProvider>
  </AuthProvider>
</BrowserRouter>
```

### 3.2 Marketing Attribution Persistence

**File:** `src/lib/attribution.ts`

```ts
const STORAGE_KEY = "attribution_v1";

export interface Attribution {
  fbclid: string | null;
  fbc: string | null;
  fbp: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  utm_id: string | null;
  landing_url: string | null;
  referrer: string | null;
}

export const captureAttribution = (): Attribution => {
  // read URL params & cookies, persist in localStorage
  // first-touch: landing_url & referrer only set once
};

export const getAttribution = (): Attribution => {
  // read from localStorage + refresh fbc/fbp from cookies
};
```

**Use case:** অর্ডার সাবমিটের সময় `getAttribution()` কল করে `orders` table-এ UTM/fbclid কলামে সেভ করা হয়। এতে campaign performance বোঝা যায়।

---

## 4. Data Fetching Hooks

### 4.1 Single Source of Truth

**File:** `src/hooks/useDatabase.ts`

```ts
export interface VisitRow {
  id: string;
  event_type: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  user_agent: string | null;
  landing_page_id: string | null;
  created_at: string;
}

const PAGE_SIZE = 1000;
const MAX_ROWS = 50000;

export const useSiteVisits = () => useQuery({
  queryKey: ["site_visits"],
  queryFn: async () => {
    const { count } = await supabase
      .from("campaign_visits")
      .select("id", { count: "exact", head: true });

    const total = count ?? 0;
    const target = Math.min(total, MAX_ROWS);
    const visits: VisitRow[] = [];

    for (let from = 0; from < target; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("campaign_visits")
        .select("id, event_type, utm_source, utm_medium, utm_campaign, user_agent, landing_page_id, created_at")
        .order("created_at", { ascending: false })
        .range(from, Math.min(from + PAGE_SIZE, target) - 1);
      if (error) throw error;
      visits.push(...((data ?? []) as VisitRow[]));
      if (!data || data.length < PAGE_SIZE) break;
    }

    const { data: pages } = await supabase.from("landing_pages").select("id, title, slug");
    const pageMap = new Map((pages ?? []).map((p) => [p.id, p.title || p.slug || "Untitled"]));
    return { visits, pageMap, total };
  },
});

export const useSiteVisitorCount = () => {
  const { data, ...rest } = useSiteVisits();
  return { ...rest, data: data?.total ?? 0 };
};
```

> **Key design:** Dashboard এবং Analytics দুই জায়গা একই `useSiteVisits` hook থেকে নেয়, তাই count mismatch হওয়ার সম্ভাবনা নেই।

---

## 5. Analytics Dashboard

**File:** `src/pages/AnalyticsPage.tsx`

Dashboard features:
- Date range filter: 7 / 30 / 90 days / all time
- Total visits, page views, today, avg per active day
- Area chart: daily trend
- Bar chart: hourly distribution (Asia/Dhaka)
- Pie chart: device mix
- Breakdown tables: source, medium, campaign, page, device, browser, OS

Parsing helpers:

```ts
const parseDevice = (ua: string | null): string => {
  if (!ua) return "Unknown";
  const s = ua.toLowerCase();
  if (/ipad|tablet/.test(s)) return "Tablet";
  if (/mobi|android|iphone|ipod/.test(s)) return "Mobile";
  return "Desktop";
};

const parseBrowser = (ua: string | null): string => { ... };
const parseOs = (ua: string | null): string => { ... };
```

### KPI Card in Dashboard

**File:** `src/pages/DashboardPage.tsx`

```tsx
const { data: visitorCount = 0 } = useSiteVisitorCount();

<KpiCard
  title="Website Visits"
  value={visitorCount.toLocaleString("en-IN")}
  icon={Eye}
  iconColor="bg-info/10 text-info"
  link="/admin/analytics"
/>
```

---

## 6. How to Implement on Another Site

### Step-by-step

1. **Database** — সেই সাইটের backend/DB-তে `campaign_visits` table তৈরি করুন।
2. **Permissions** — anonymous user-দের `INSERT` দিন (পাবলিক ভিজিট ট্র্যাক করতে), authenticated user-দের `SELECT` দিন।
3. **Attribution library** — `src/lib/attribution.ts` কপি করুন।
4. **Tracker component** — `src/components/shared/AttributionTracker.tsx` কপি করে route change hook-এ মাউন্ট করুন।
5. **Data hooks** — `useSiteVisits` + `useSiteVisitorCount` কপি করুন।
6. **Analytics page** — `src/pages/AnalyticsPage.tsx` কপি করে UI-এ আনুন।
7. **Dashboard KPI** — Dashboard-এ `useSiteVisitorCount` দিয়ে কার্ড দেখান।

### Optional: Order-level attribution

অর্ডার table-এ এই কলাম যোগ করুন:

```sql
fbclid text,
fbc text,
fbp text,
utm_source text,
utm_medium text,
utm_campaign text,
utm_term text,
utm_content text,
utm_id text,
landing_url text,
referrer text
```

অর্ডার সাবমিটের আগে `getAttribution()` কল করে এই কলামে সেভ করুন।

---

## 7. Important Notes / Best Practices

- **Never break the app:** Track calls `try/catch` দিয়ে wrap করুন।
- **Session-level dedupe:** প্রতি path একবার count হয় (sessionStorage), refresh-এ overcount রোধ।
- **Private routes excluded:** `/admin`, `/login`, `/auth` — এগুলো track হয় না।
- **Timezone:** `Asia/Dhaka` ব্যবহার করা হয়েছে "Today" / hourly stats-এ।
- **Pagination:** বড় ডাটার জন্য 1000 row pagination করা আছে।
- **Single source:** Dashboard + Analytics একই hook থেকে নেয় — mismatch কমে।

---

## 8. Related Files in This Project

- `src/components/shared/AttributionTracker.tsx` — visit tracking
- `src/lib/attribution.ts` — UTM/fbclid persistence
- `src/hooks/useDatabase.ts` — `useSiteVisits`, `useSiteVisitorCount`
- `src/pages/AnalyticsPage.tsx` — full analytics UI
- `src/pages/DashboardPage.tsx` — visitor KPI card
- `supabase/migrations/20260330161434_6700f299-57be-455b-ad53-643dfd8ebc2a.sql` — table creation
- `supabase/migrations/20260414090550_1ea9330a-f4cb-4798-b34f-ffc61faeaf7d.sql` — public INSERT policy

---

*Generated for re-implementation on other sites.*
