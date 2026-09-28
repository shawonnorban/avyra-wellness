# Meta Pixel / Token / Test code বদলানো — এবং বিল্ড ডিপ্লয়

Meta-র তিনটি জিনিস দুই জায়গায় থাকে। কোনটা বদলাতে চান তার উপর নির্ভর করে
রিবিল্ড লাগবে কি না।

| কী বদলাবেন | কোথায় | রিবিল্ড লাগে? |
|---|---|---|
| Test event code | Admin → Settings → Meta CAPI | না |
| Access Token | Admin → Settings → Meta CAPI | না |
| Pixel ID (সার্ভার / CAPI) | Admin → Settings → Meta CAPI | না |
| Pixel ID (ব্রাউজার) | `avyra-frontend/.env.production` | **হ্যাঁ** |

> **দুই জায়গার Pixel ID একই হতে হবে।** ব্রাউজারের Pixel আর সার্ভারের Pixel আলাদা
> হলে `Lead` ডিডুপ্লিকেট হয় না, একই অর্ডার দুবার গোনা হয়।

---

## ১. Settings থেকে বদলানো (রিবিল্ড ছাড়া)

**Admin → Settings → Meta CAPI** → বদলান → Save। সাথে সাথে কার্যকর।

- **Test event code** — টেস্টের সময় বসান। **আসল ক্যাম্পেইনের আগে ফাঁকা করে Save দিন।**
  ফাঁকা না করলে সার্ভারের ইভেন্ট শুধু Events Manager → Test Events-এ যায়, রিপোর্টিংয়ে আসে না।
- **Access Token** — সবসময় `********` দেখায়। বদলাতে না চাইলে যেমন আছে থাকতে দিন
  (Save করলে আগেরটাই থেকে যায়)। বদলাতে চাইলে নতুন টোকেন পেস্ট করুন।
- **Pixel ID** — Token শুধু যে Pixel-এর জন্য তৈরি সেটাতেই চলে। Pixel বদলালে Token-ও
  নতুন Pixel-এর জন্য বানিয়ে একসাথে বসান।
- **দ্বিতীয় Pixel** — একই পেজে দ্বিতীয় Pixel + Token জোড়া দেওয়া যায়। প্রতিটি
  কনভার্সন দুটোতেই যায়, একই `event_id` সহ। ফাঁকা রাখলে একটাই চলে।

যাচাই — সার্ভারে:

```bash
cd ~/avyra-wellness/avyra-backend
php artisan fb:doctor
```

Pixel, Token, Test code আর Scheduler (cron) এর অবস্থা দেখায়।

---

## ২. ব্রাউজার Pixel বদলানো (রিবিল্ড লাগবে)

`NEXT_PUBLIC_*` মান বিল্ডের সময় JavaScript-এ ঢুকে যায়। cPanel-এ Environment variable
বদলালে কিছু হয় না — লোকালে বদলে আবার বিল্ড করতে হয়।

### ধাপ ১ — `.env.production` বদলান

ফাইল: `avyra-frontend/.env.production`

```
NEXT_PUBLIC_API_URL=https://api.avyrabd.com/api
NEXT_PUBLIC_SITE_URL=https://avyrabd.com
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_FB_PIXEL_ID=নতুন_pixel_id
```

- `NEXT_PUBLIC_GTM_ID` **ফাঁকা** থাকলে পেজ সরাসরি Pixel লোড করে।
- GTM আইডি দিলে Pixel-এর দায়িত্ব GTM-এর, তখন `NEXT_PUBLIC_FB_PIXEL_ID` উপেক্ষা হয়।
  দুটো একসাথে চলে না — তাই ডাবল কাউন্ট হয় না।
- ফাইলটা **gitignored**। নতুন কম্পিউটারে গিট থেকে নামালে এটা থাকে না, নিজে বানাতে হবে।
  না থাকলে বিল্ড ফেল করে না, চুপচাপ `localhost:8000` বসিয়ে দেয় এবং ট্র্যাকিং বন্ধ থাকে।

### ধাপ ২ — ডেভ সার্ভার বন্ধ করুন

`npm run dev` চালু থাকলে বিল্ডের সাথে ডেভ ফাইল মিশে যায়।

```powershell
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like "*avyra-frontend*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

### ধাপ ৩ — পরিষ্কার বিল্ড

```bash
cd C:/wamp64/www/avyra-wellness/avyra-frontend
rm -rf .next
npm run build
```

`rm -rf .next` বাদ দেবেন না — পুরনো চাঙ্ক নতুন ম্যানিফেস্টের সাথে মিশে যায়।

### ধাপ ৪ — বিল্ড যাচাই

```bash
cat .next/BUILD_ID                                    # আগেরবারের থেকে আলাদা হতে হবে
grep -rl 'localhost:8000' .next/static | wc -l        # 0 হতে হবে
grep -rl 'api.avyrabd.com' .next/static | wc -l       # 0-র বেশি হতে হবে
grep -rl 'নতুন_pixel_id' .next/static | wc -l         # 1 বা বেশি হতে হবে
grep -rl 'পুরনো_pixel_id' .next | wc -l              # 0 হতে হবে
ls .next/dev 2>/dev/null | wc -l                      # 0 হতে হবে
```

`localhost:8000` পেলে `.env.production` ঠিকমতো পড়া হয়নি — জিপ করবেন না।

### ধাপ ৫ — `.next/standalone` মুছুন

`next.config.ts`-এ `output: "standalone"` আছে বলে বিল্ড একটা ২৫ MB-র `standalone`
ফোল্ডার বানায়। সার্ভার এটা ব্যবহার করে না, জিপ ফুলে ১০ MB-র বেশি হয়।

```bash
rm -rf .next/standalone
```

### ধাপ ৬ — জিপ বানান

```powershell
Set-Location C:\wamp64\www\avyra-wellness\avyra-frontend
Remove-Item ..\next-build.zip -Force -ErrorAction SilentlyContinue
Compress-Archive -Path .next -DestinationPath ..\next-build.zip -CompressionLevel Optimal
```

`-Path .next` (ফোল্ডার, `.next\*` নয়)। সাইজ প্রায় ৫–৬ MB হওয়ার কথা।

### ধাপ ৭ — কমিট ও পুশ

```bash
cd C:/wamp64/www/avyra-wellness
git add next-build.zip
git commit -m "chore: rebuild the frontend with the new Pixel"
git push origin main
```

`.env.production` গিটে যাবে না (gitignored) — এটা ঠিক আছে।

---

## ৩. সার্ভারে ডিপ্লয়

**আগে Stop, পরে ফাইল বদল।** চালু অবস্থায় ফাইল বদলালে cPanel-এ ডুপ্লিকেট `lsnode`
প্রসেস তৈরি হয়, আর প্রতিটা প্রায় ৪১–৪৩ থ্রেড খায় (লিমিট ১০০)।

1. cPanel → **Setup Node.js App** → **Stop**।
2. SSH-এ:

   ```bash
   # কোনো প্রসেস চলছে না তো?  (কিছু না দেখালে ঠিক)
   ps -u shawonsr -o pid,etime,cmd | grep avyra-frontend

   cd ~/avyra-wellness && git pull
   cd avyra-frontend
   rm -rf .next
   unzip -q ../next-build.zip          # ব্যাকস্ল্যাশ নিয়ে ওয়ার্নিং স্বাভাবিক
   chmod -R u+rwX,go+rX .next
   cat .next/BUILD_ID                  # ধাপ ৪-এর সাথে মিলতে হবে
   ```

3. cPanel → **Start**।
4. যাচাই:

   ```bash
   ps -u shawonsr -o pid,etime,cmd | grep avyra-frontend    # ঠিক একটা lsnode
   curl -s -o /dev/null -w "%{http_code}\n" https://avyrabd.com   # 200
   ```

| ধাপ | বাদ দিলে কী হয় |
|---|---|
| `rm -rf .next` | পুরনো চাঙ্ক থেকে যায়, ব্রাউজারে মিশ্র ভার্সন |
| `chmod` | Windows-এর জিপে Unix পারমিশন নেই — 503 বা সব স্ট্যাটিক ফাইলে 404 |
| Stop → Start | ডুপ্লিকেট `lsnode`, বা পুরনো প্রসেসই সার্ভ করতে থাকে |

দুটো `lsnode` দেখা গেলে দুটো `kill <pid>` করে তারপর Start দিন।

---

## ৪. ডিপ্লয়ের পর ব্রাউজারে যাচাই

- **Ctrl+Shift+R** দিয়ে সাইট খুলুন। আগে খোলা পুরনো ট্যাব দেখবেন না — ওরা পুরনো Pixel ধরে রাখে।
- Meta Pixel Helper-এ শুধু **নতুন Pixel ID** দেখাবে, একটা `PageView` সহ।
- অর্ডার সাবমিট করে `/order-success`-এ গেলে দ্বিতীয় `PageView` যাবে না।
- Events Manager → Test Events-এ Test code দিয়ে একটা টেস্ট অর্ডার দিন। ব্রাউজার ও সার্ভারের
  `Lead` মিলে **একটা** ইভেন্ট হিসেবে (Browser + Server) দেখানো উচিত। দুটো আলাদা সারি
  দেখালে ব্রাউজার ও সার্ভারের Pixel আলাদা।
- টেস্ট শেষে Settings থেকে **Test event code মুছে** Save দিন।

---

## ৫. Scheduler (cron)

`fb:retry-events` (ঘণ্টায়) আর `courier:sync` (৫ মিনিটে) চলার জন্য cron লাগে। সার্ভারে দেখুন:

```bash
crontab -l
```

না থাকলে যোগ করুন (আগে `crontab -l` দিয়ে দেখে নিন, নইলে বাকি এন্ট্রি মুছে যেতে পারে):

```
* * * * * cd /home/shawonsr/avyra-wellness/avyra-backend && php artisan schedule:run >> /dev/null 2>&1
```

cron না চললে ব্যর্থ ফেসবুক ইভেন্ট আর কখনো পুনরায় পাঠানো হয় না।

---

সাধারণ বিল্ড/ডিপ্লয়ের বিস্তারিত: [frontend-build.md](frontend-build.md)।
ট্র্যাকিং কীভাবে কাজ করে: [meta-tracking-handover.md](meta-tracking-handover.md)।
