/** UI strings for /vitalplus. Reality-check and 4-week-plan text is shared with /avyravitalplus. */
export const copy = {
  cta: "এখনই অর্ডার করুন",

  /** Used when Settings → Company has no scrolling announcement. */
  announcement: "🌿 প্রকৃতির সেরা শক্তি — Avyra Vital Plus",

  hero: {
    title: "প্রতিদিনের ক্লান্তি দূর করুন, ফিরে পান আপনার হারানো শক্তি ও আত্মবিশ্বাস।",
    sub: "শারীরিক দুর্বলতাকে বলুন বিদায়; Avyra Vital Plus-এর সাথে প্রতিদিন কাটুক এনার্জিতে ভরপুর।",
  },

  trust: ["১০০% প্রাকৃতিক", "ক্যাশ অন ডেলিভারি", "সারা দেশে ডেলিভারি"],
  trustLine: "সারা দেশে ক্যাশ অন ডেলিভারিতে সংগ্রহ করুন",

  videoTitle: "এক নজরে Vital Plus",

  benefits: {
    title: "Avyra Vital Plus সেবনের উপকারীতা",
    items: [
      { icon: "✅", text: "উত্থান শক্তি বৃদ্ধি করে" },
      { icon: "⏱️", text: "টাইমিং ও স্ট্যামিনা উন্নত করে" },
      { icon: "💪", text: "ক্লান্তি ও দুর্বলতা দূর করে" },
      { icon: "⚡", text: "কাজের এনার্জি বাড়ায়" },
      { icon: "🧠", text: "মনোযোগ ও আত্মবিশ্বাস বাড়ায়" },
      { icon: "🍃", text: "পুরুষ হরমোন ব্যালান্স করে" },
      { icon: "❤️", text: "দাম্পত্য জীবনে সন্তুষ্টি আনে" },
      { icon: "🌿", text: "সম্পূর্ণ হারবাল ও পার্শ্বপ্রতিক্রিয়ামুক্ত" },
    ],
  },

  problem: {
    title: "প্রতিদিনের ক্লান্তি, এনার্জির ঘাটতি আর আত্মবিশ্বাসের চ্যালেঞ্জ?",
    sub: "আপনার দৈনন্দিন জীবনযাত্রায় যেসব বিষয় প্রভাব ফেলতে পারে",
    items: [
      { icon: "😩", title: "সারাদিন ক্লান্ত অনুভব করা", body: "দৈনন্দিন কাজের পর শরীরে অবসাদ ও ক্লান্তি অনুভব করা।" },
      { icon: "🔋", title: "কাজে এনার্জির ঘাটতি", body: "ব্যস্ত দিনের কাজগুলোতে স্বাভাবিক উদ্যম ধরে রাখতে অসুবিধা।" },
      { icon: "🥱", title: "শারীরিক দুর্বলতা অনুভব করা", body: "দৈনন্দিন রুটিনে আগের মতো সক্রিয় থাকতে না পারা।" },
      { icon: "🏃", title: "স্ট্যামিনা নিয়ে উদ্বেগ", body: "শারীরিক সক্ষমতা ও দৈনন্দিন পারফরম্যান্স নিয়ে সচেতনতা।" },
      { icon: "💭", title: "দাম্পত্য জীবনে আত্মবিশ্বাসের অভাব", body: "ব্যক্তিগত জীবন ও সম্পর্কের ক্ষেত্রে নিজের সুস্থতা নিয়ে উদ্বিগ্ন থাকা।" },
      { icon: "🌙", title: "নিজের সুস্থতা নিয়ে অনিয়ম", body: "পর্যাপ্ত ঘুম, পুষ্টিকর খাবার ও নিয়মিত জীবনযাপনের অভাব।" },
    ],
  },

  /* Names come from the product FAQ ("মূল উপাদানগুলো কী কী?"). Tiles without a matching
     photo in /public/avyra use an emoji instead, so no ingredient is shown with the wrong picture. */
  ingredients: {
    title: "Vital Plus-এর উপাদান",
    items: [
      { img: "/avyra/ing-honey.webp", name: "খাঁটি মধু" },
      { img: "/avyra/ing-leaf-large.webp", name: "অশ্বগন্ধা" },
      { img: "/avyra/ing-sprout.webp", name: "চিলগুজার শাঁস" },
      { img: "/avyra/ing-fern.webp", name: "শতমূলী" },
      { img: "/avyra/ing-mastic.webp", name: "রুমি মস্তগি" },
      { img: "/avyra/ing-cardamom.webp", name: "এলাচ" },
      { emoji: "🥜", name: "কাজু বাদাম" },
      { emoji: "🧈", name: "ঘি" },
    ] as { img?: string; emoji?: string; name: string }[],
    moreTitle: "এছাড়াও আরও যা আছে",
    more: ["পানিফল", "পেস্তা বাদাম", "কাঠ বাদাম", "চুনিয়া গদ", "জয়ফল", "আমলকী", "চিনা বাদাম", "আরও বহু ভেষজ উপাদান"],
  },

  reviews: {
    badge: "সন্তুষ্ট গ্রাহক",
    title: "গ্রাহকরা কী বলছেন?",
    sub: "সত্যিকারের রিভিউ, সত্যিকারের ফলাফল",
  },

  reality: { title: "কাদের জন্য Vital Plus একদমই না?" },

  plan: { title: "৪ সপ্তাহের অ্যাকশন প্ল্যান" },

  offer: {
    label: "স্পেশাল অফার",
    cod: { title: "ক্যাশ অন ডেলিভারি", sub: "পণ্য হাতে পেয়ে টাকা দিন, অগ্রিম লাগবে না।", tag: "COD" },
    total: "অফার মূল্য",
    cta: "এখনই অর্ডার করুন",
  },

  faq: { title: "সাধারণ প্রশ্নোত্তর" },

  form: {
    unavailable: "অর্ডার ফর্মটি এই মুহূর্তে লোড হচ্ছে না। একটু পরে আবার চেষ্টা করুন।",
    retry: "আবার চেষ্টা করুন",
  },

  disclaimer:
    "এই পণ্য কোনো রোগ নির্ণয়, চিকিৎসা বা প্রতিরোধের জন্য নয়। ফলাফল ব্যক্তিভেদে ভিন্ন হতে পারে। কোনো শারীরিক সমস্যা থাকলে বা নিয়মিত ওষুধ সেবন করলে ব্যবহারের আগে চিকিৎসকের পরামর্শ নিন।",
} as const;
