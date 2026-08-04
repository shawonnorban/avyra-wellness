export type Lang = "en" | "bn";

export interface TEntry {
  en: string;
  bn: string;
}

export const translations: Record<string, TEntry> = {
  // ─── Common / shared ───
  "common.buyNow": { en: "Buy Now", bn: "এখনই কিনুন" },
  "common.buyNowLower": { en: "Buy now", bn: "এখনই কিনুন" },
  "common.viewProducts": { en: "View products", bn: "পণ্য দেখুন" },
  "common.faq": { en: "Frequently asked questions", bn: "সাধারণ জিজ্ঞাসা" },
  "common.close": { en: "Close", bn: "বন্ধ করুন" },

  // ─── Header / Nav ───
  "nav.home": { en: "Home", bn: "হোম" },
  "nav.vitalPlus": { en: "Vital Plus", bn: "ভাইটাল প্লাস" },
  "nav.ourStory": { en: "Our Story", bn: "আমাদের গল্প" },
  "nav.menu": { en: "Menu", bn: "মেনু" },

  // ─── Footer ───
  "footer.tagline": {
    en: "Avyra Wellness\nguided by nature\nmade for everyday living",
    bn: "অ্যাভিরা ওয়েলনেস\nপ্রকৃতির নির্দেশনায়\nপ্রতিদিনের জীবনের জন্য।",
  },
  "footer.contact": { en: "Contact", bn: "যোগাযোগ" },
  "footer.login": { en: "Login", bn: "লগইন" },
  "footer.register": { en: "Register", bn: "রেজিস্টার" },
  "footer.factory": { en: "Factory", bn: "কারখানা" },
  "footer.corporateOffice": { en: "Corporate office", bn: "কর্পোরেট অফিস" },
  "footer.allRights": {
    en: "All rights reserved. Developed by Sarkar IT Firm",
    bn: "সর্বস্বত্ব সংরক্ষিত। ডেভেলপ করেছে সরকার আই,টি ফার্ম",
  },
  "policy.empty": {
    en: "This policy has not been published yet. Please contact us and we will be glad to help.",
    bn: "এই নীতিটি এখনো প্রকাশ করা হয়নি। আমাদের সাথে যোগাযোগ করলে আমরা সাহায্য করতে পারব।",
  },
  "policy.questions": {
    en: "Questions about this policy? Get in touch:",
    bn: "এই নীতি সম্পর্কে প্রশ্ন থাকলে যোগাযোগ করুন:",
  },
  "footer.returnsPolicy": { en: "Returns policy", bn: "রিটার্ন নীতি" },
  "footer.shippingPolicy": { en: "Shipping policy", bn: "শিপিং নীতি" },
  "footer.terms": { en: "Terms of services", bn: "সেবার শর্তাবলী" },
  "footer.privacy": { en: "Privacy policy", bn: "গোপনীয়তা নীতি" },

  // ─── About / Home page ───
  "about.heroTagline": {
    en: "Avyra Wellness,\nguided by nature.",
    bn: "অ্যাভিরা ওয়েলনেস,\nপ্রকৃতির শক্তিতে প্রাণবন্ত জীবন।",
  },
  "about.heroHeadline": {
    en: "Bringing nature back to everyday life",
    bn: "দৈনন্দিন জীবনে ফিরিয়ে আনুন প্রকৃতির স্পর্শ",
  },
  "about.offerHeading": {
    en: "Everything we offer,\nrooted in true nature",
    bn: "আমাদের সবকিছুই প্রকৃতির শিকড়ে গাঁথা",
  },
  "about.vp1": {
    en: "Naturally crafted ingredients your body welcomes every day.",
    bn: "প্রাকৃতিকভাবে তৈরি উপাদান, যা আপনার শরীর প্রতিদিন সাদরে গ্রহণ করে।",
  },
  "about.vp2": {
    en: "Supports natural balance without overwhelming your body.",
    bn: "শরীরের ওপর চাপ না দিয়ে প্রাকৃতিক ভারসাম্য বজায় রাখে।",
  },
  "about.vp3": {
    en: "Simple wellness rituals made for everyday life.",
    bn: "প্রতিদিনের জীবনের জন্য তৈরি সহজ সুস্থতার অভ্যাস।",
  },
  "about.familyBanner": {
    en: "Simply healthy,\nnaturally happy",
    bn: "সুস্থ থাকুন সহজভাবে,\nসুখী থাকুন স্বাভাবিকভাবে।",
  },
  "about.fromNature": { en: "From nature, for you", bn: "প্রকৃতির শক্তি" },
  "about.madeForModern": { en: "made for modern life", bn: "আধুনিক জীবনের জন্য" },
  "about.tiredless": { en: "Tiredless, everyday", bn: "ক্লান্তিহীন, প্রতিদিন" },
  "about.naturalEnergyLine": {
    en: "Natural Energy, Daily Balance, Pure Ingredients",
    bn: "প্রাকৃতিক শক্তি, দৈনিক ভারসাম্য, বিশুদ্ধ উপাদান",
  },
  "about.chipCashew": { en: "Cashew Nuts", bn: "কাজু বাদাম" },
  "about.chipHoney": { en: "Honey", bn: "মধু" },
  "about.chipAshwagandha": { en: "Ashwagandha", bn: "অশ্বগন্ধা" },
  "about.chipPine": { en: "Pine Nuts", bn: "পাইন বাদাম" },
  "about.chipMastic": { en: "Mastic Gum", bn: "রুমি মস্তগি" },
  "about.chipOther": { en: "15+ Other\ningredients", bn: "১৫+ অন্যান্য\nউপাদান" },
  "about.chipOtherNatural": { en: "15+ Other\nnatural ingredients", bn: "১৫+ অন্যান্য\nপ্রাকৃতিক উপাদান" },
  "about.reconnectHeading": {
    en: "Reconnect with\nyour roots.\nReturn to nature.",
    bn: "প্রকৃতি হোক\nআপনার প্রতিদিনের সঙ্গী।",
  },
  "about.reconnectSub": {
    en: "Rediscover the balance of natural living. Bring the wisdom of nature back into everyday life.",
    bn: "প্রাকৃতিক জীবনযাপনের জন্য স্মার্ট চয়েজ।",
  },
  "about.rf1l1": { en: "Natural ingredients", bn: "প্রাকৃতিক উপাদান" },
  "about.rf1l2": { en: "your body responds to", bn: "যাতে আপনার শরীর থাকে প্রানবন্ত" },
  "about.rf2l1": { en: "Supports balance,", bn: "ভারসাম্য বজায় রাখে," },
  "about.rf2l2": { en: "not forced results", bn: "প্রতিদিনের ছোট ছোট অভ্যাস দেয় দীর্ঘস্থায়ী সমাধান" },
  "about.rf3l1": { en: "Simple and easy for", bn: "প্রতিদিনের জীবনের জন্য" },
  "about.rf3l2": { en: "daily life", bn: "সহজ ও স্বাচ্ছন্দ্য" },
  "about.justBegin": {
    en: "Just begin with\none better \nchoice, today!",
    bn: "শুরু করুন আজ\nএকটি ভালো\nসিদ্ধান্ত দিয়ে!",
  },
  "about.testimonial": { en: "Testimonial", bn: "অভিমত" },

  // ─── Testimonials ───
  "tm1.quote": {
    en: "Vital Plus has become a part of my daily routine. It helps me stay energized, focused, and productive throughout my busy workdays.",
    bn: "ভাইটাল প্লাস আমার দৈনিক রুটিনের অংশ হয়ে উঠেছে। এটি আমাকে ব্যস্ত কর্মদিবসে সতেজ, মনোযোগী এবং উৎপাদনশীল থাকতে সাহায্য করে।",
  },
  "tm1.name": { en: "Rakib Hasan", bn: "রাকিব হাসান" },
  "tm1.role": { en: "Business Owner, Dhaka", bn: "ব্যবসায়ী, ঢাকা" },
  "tm2.quote": {
    en: "Training regularly requires stamina and consistency. Vital Plus helps me feel energized and ready to perform at my best every day.",
    bn: "নিয়মিত অনুশীলনের জন্য সহনশীলতা ও ধারাবাহিকতা প্রয়োজন। ভাইটাল প্লাস আমাকে প্রতিদিন সতেজ অনুভব করতে এবং সর্বোচ্চ পারফরম্যান্স দিতে সাহায্য করে।",
  },
  "tm2.name": { en: "Nafis Ahmed", bn: "নাফিস আহমেদ" },
  "tm2.role": { en: "Athlete, Chattogram", bn: "অ্যাথলিট, চট্টগ্রাম" },
  "tm3.quote": {
    en: "My schedule is always busy, but Vital Plus helps me stay focused and maintain my energy throughout the day.",
    bn: "আমার সময়সূচি সবসময় ব্যস্ত থাকে, কিন্তু ভাইটাল প্লাস আমাকে মনোযোগী রাখতে এবং সারাদিন শক্তি বজায় রাখতে সাহায্য করে।",
  },
  "tm3.name": { en: "Sabiha Rahman", bn: "সাবিহা রাহমান" },
  "tm3.role": { en: "Corporate Executive, Sylhet", bn: "কর্পোরেট এক্সিকিউটিভ, সিলেট" },
  "tm4.quote": {
    en: "Since I started using Vital Plus, I've experienced a noticeable boost in my energy, stamina, and overall vitality. I feel more confident, more active, and better equipped to enjoy every aspect of my daily life. The difference has been truly remarkable.",
    bn: "ভাইটাল প্লাস ব্যবহার শুরু করার পর থেকে আমার শক্তি, সহনশীলতা এবং সার্বিক প্রাণশক্তিতে লক্ষণীয় পরিবর্তন দেখেছি। আমি আরও আত্মবিশ্বাসী, আরও সক্রিয় এবং দৈনিক জীবনের প্রতিটি দিক উপভোগ করার জন্য প্রস্তুত অনুভব করি। এই পরিবর্তন সত্যিই বিস্ময়কর।",
  },
  "tm4.name": { en: "Mahmudul Hasan", bn: "মাহমুদুল হাসান" },
  "tm4.role": { en: "Businessman, Rajshahi", bn: "ব্যবসায়ী, রাজশাহী" },

  // ─── VitalPlus page ───
  "vp.heroEyebrow": { en: "Tiredless, every day", bn: "ক্লান্তিহীন, প্রতিদিন" },
  "vp.heroHeadline": {
    en: "Leave tiredness behind.\nStay naturally engaging.",
    bn: "ক্লান্তিকে পেছনে ফেলে \nস্বাভাবিকভাবে সুস্থ ও প্রাণবন্ত থাকুন।",
  },
  "vp.ingHeading": {
    en: "Selected from nature,\nguided by ancient tradition",
    bn: "প্রকৃতি থেকে বেছে নেওয়া",
  },
  "vp.ingClosing": {
    en: "A blend of carefully selected herbs and natural elements, made to support men's body energy and balance",
    bn: "যত্নে বাছাই করা ভেষজ ও প্রাকৃতিক উপাদানের মিশ্রণ, পুরুষের শারীরিক শক্তি ও ভারসাম্যে সহায়তার জন্য তৈরি",
  },
  "vp.trustHeading": {
    en: "Made natural care,\nyou can trust",
    bn: "প্রাকৃতিক যত্নে তৈরি,\nআপনার ভরসার জন্য।",
  },
  "vp.usage1": { en: "Take 2 tablespoons daily", bn: "প্রতিদিন ১ টেবিল চামচ নিন" },
  "vp.usage2": { en: "Have it in the morning and night", bn: "সকালে ও রাতে গ্রহণ করুন" },
  "vp.usage3": { en: "Stay consistent for best results", bn: "ভালো ফলাফলের জন্য নিয়মিত সেবন করুন" },
  "vp.routine": {
    en: "No complex routines.\nJust a simple daily habit your body can rely on.",
    bn: "কোনো জটিল রুটিন নয়।\nশুধু একটি সহজ দৈনিক অভ্যাস, যার ওপর আপনার শরীর ভরসা করতে পারে।",
  },
  "vp.coralCta": {
    en: "Fuels your vitality, keeps you balanced, energized, and less drained.",
    bn: "আপনার প্রাণশক্তি জোগায়, ভারসাম্য রাখে, সতেজ রাখে এবং ক্লান্তি কমায়।",
  },
  "vp.ingPineNuts": { en: "Pine Nuts", bn: "পাইন বাদাম" },
  "vp.ingPineNutsDesc": {
    en: "Packed with nutrients that fuel the body and sharpen mental energy",
    bn: "পুষ্টিতে ভরপুর, যা শরীরকে শক্তি দেয় ও মানসিক সতেজতা বাড়ায়",
  },
  "vp.ingCashew": { en: "Cashew Nuts", bn: "কাজু বাদাম" },
  "vp.ingCashewDesc": {
    en: "A rich source of natural energy and essential minerals for daily vitality",
    bn: "প্রতিদিনের প্রাণশক্তির জন্য প্রাকৃতিক শক্তি ও খনিজের সমৃদ্ধ উৎস",
  },
  "vp.ingHoney": { en: "Honey", bn: "মধু" },
  "vp.ingHoneyDesc": {
    en: "Supports natural strength and daily wellness",
    bn: "প্রাকৃতিক শক্তি ও দৈনিক সুস্থতায় সহায়তা করে",
  },
  "vp.ingAshwagandha": { en: "Ashwagandha", bn: "অশ্বগন্ধা" },
  "vp.ingAshwagandhaDesc": {
    en: "Supports sustained energy, reduces fatigue, and strengthens the body from within",
    bn: "ধারাবাহিক শক্তি জোগায়, ক্লান্তি কমায় এবং ভেতর থেকে শরীরকে করে শক্তিশালী",
  },
  "vp.ingMastic": { en: "Mastic Gum", bn: "রুমি মস্তগি" },
  "vp.ingMasticDesc": {
    en: "Used traditionally for internal strength and support",
    bn: "শরীরের ভেতরের শক্তি ও সাপোর্টের জন্য ঐতিহ্যগতভাবে ব্যবহৃত",
  },
  "vp.ingOther": { en: "Other ingredients", bn: "অন্যান্য উপাদান" },
  "vp.ingOtherDesc": { en: "And 15+ other natural ingredients", bn: "এবং ১৫+ অন্যান্য প্রাকৃতিক উপাদান" },

  // ─── Shared FAQ (Home + Vital Plus). FAQ_COUNT in home-sections.tsx must match. ───
  "faq.q1": { en: "What is Avyra Vital Plus?", bn: "অ্যাভিরা ভাইটাল প্লাস কী?" },
  "faq.a1": {
    en: "Vital Plus is a wellness food made from natural herbal ingredients that helps maintain the body's energy, stamina, immunity and overall well-being. It helps reduce fatigue, improve performance and meet daily nutritional needs. Alongside that, it also helps naturally maintain personal well-being, confidence and marital vitality.",
    bn: "Vital Plus একটি প্রাকৃতিক ভেষজ উপাদানে তৈরি ওয়েলনেস ফুড, যা শরীরের এনার্জি, স্ট্যামিনা, রোগ প্রতিরোধ ক্ষমতা ও সার্বিক সুস্থতা বজায় রাখতে সহায়তা করে। এটি ক্লান্তি কমাতে, কর্মক্ষমতা বাড়াতে এবং দৈনন্দিন পুষ্টির চাহিদা পূরণে সহায়ক। পাশাপাশি, এটি প্রাকৃতিকভাবে ব্যক্তিগত সুস্থতা, আত্মবিশ্বাস ও দাম্পত্য জীবনের প্রাণশক্তি বজায় রাখতেও সহায়ক।",
  },
  "faq.q2": { en: "Why Avyra Vital Plus?", bn: "কেন অ্যাভিরা ভাইটাল প্লাস?" },
  "faq.a2": {
    en: "As everything around us is increasingly adulterated, we set out to put a wellness food made from natural ingredients into your hands — one that supports men's health.",
    bn: "আমাদের আশেপাশের সবকিছু যখন ভেজালে ভরে যাচ্ছে, তখন আমরা চেষ্টা করেছি প্রাকৃতিক উপাদান দিয়ে তৈরি একটি ওয়েলনেস ফুড আপনাদের হাতে তুলে দিতে, যা পুরুষ সাস্থে সহায়ক।",
  },
  "faq.q3": { en: "Who is this product for?", bn: "এই পণ্যটি কাদের জন্য?" },
  "faq.a3": {
    en: "AVYRA Vital Plus is for those who want to maintain their everyday energy, vitality and performance. It is a fitting addition to the daily wellness routine of men in particular who are looking for natural herbal support for stamina, confidence and self-assurance in married life.",
    bn: "AVYRA Vital Plus তাদের জন্য, যারা প্রতিদিনের এনার্জি, প্রাণশক্তি ও কর্মক্ষমতা বজায় রাখতে চান। বিশেষ করে যেসব পুরুষ স্ট্যামিনা, আত্মবিশ্বাস ও দাম্পত্য জীবনে আত্মবিশ্বাসের জন্য প্রাকৃতিক ভেষজ সাপোর্ট খুঁজছেন, তাদের দৈনন্দিন ওয়েলনেস রুটিনে এটি একটি উপযোগী সংযোজন।",
  },
  "faq.q4": { en: "What are the key ingredients?", bn: "মূল উপাদানগুলো কী কী?" },
  "faq.a4": {
    en: "Made from a blend of more than 18 premium natural and herbal ingredients. Its special formula contains pure honey, ashwagandha, pine nut kernels, shatavari, water chestnut, mastic gum, cardamom, pistachio, cashew nut, almond, tragacanth gum, nutmeg, amla, peanut, ghee and many other valuable herbal ingredients. Every ingredient is carefully selected and combined so that it can naturally support your everyday wellness, vitality and active lifestyle.",
    bn: "১৮টিরও বেশি প্রিমিয়াম প্রাকৃতিক ও ভেষজ উপাদানের সমন্বয়ে তৈরি। এর বিশেষ ফর্মুলায় রয়েছে খাঁটি মধু, অশ্বগন্ধা, চিলগুজার শাঁস, শতমূলী, পানিফল, রুমি মস্তগি, এলাচ, পেস্তা বাদাম, কাজু বাদাম, কাঠ বাদাম, চুনিয়া গদ, জয়ফল, আমলকী, চিনা বাদাম, ঘি এবং আরও বহু মূল্যবান ভেষজ উপাদান। প্রতিটি উপাদান যত্নসহকারে নির্বাচন করে এমনভাবে সংযোজন করা হয়েছে, যাতে এটি আপনার প্রতিদিনের সুস্থতা, প্রাণশক্তি ও সক্রিয় জীবনধারাকে প্রাকৃতিকভাবে সাপোর্ট করতে পারে।",
  },
  "faq.q5": { en: "What benefits can I expect?", bn: "আমি কী কী উপকার আশা করতে পারি?" },
  "faq.a5": {
    en: "Vital Plus is a wellness food made from natural herbal ingredients that helps maintain the body's strength, stamina, immunity and overall well-being. It helps reduce fatigue, improve performance and meet daily nutritional needs. It also helps naturally maintain personal well-being, confidence and marital vitality.",
    bn: "ভাইটাল প্লাস একটি প্রাকৃতিক ভেষজ উপাদানে তৈরি ওয়েলনেস ফুড, যা শরীরের শক্তি, স্ট্যামিনা, রোগ প্রতিরোধ ক্ষমতা ও সার্বিক সুস্থতা বজায় রাখতে সাহায্য করে। এটি ক্লান্তি কমাতে, পারফরম্যান্স বাড়াতে ও দৈনিক পুষ্টির চাহিদা মেটাতে সহায়তা করে। পাশাপাশি প্রাকৃতিকভাবে ব্যক্তিগত সুস্থতা, আত্মবিশ্বাস ও দাম্পত্য প্রাণশক্তি বজায় রাখতেও সহায়ক।",
  },
  "faq.q6": { en: "Are there any side effects?", bn: "এর কি কোনো পার্শ্বপ্রতিক্রিয়া আছে?" },
  "faq.a6": {
    en: "Since Vital Plus is a functional food made from entirely natural herbal ingredients, there is no risk of harmful side effects. It is as safe for the body as ordinary food and is suitable for long-term use.",
    bn: "যেহেতু ভাইটাল প্লাস সম্পূর্ণ প্রাকৃতিক ভেষজ উপাদানে তৈরি একটি ফাংশনাল ফুড, তাই কোনো ক্ষতিকর পার্শ্বপ্রতিক্রিয়ার ঝুঁকি নেই। এটি সাধারণ খাবারের মতোই শরীরের জন্য নিরাপদ এবং দীর্ঘমেয়াদী ব্যবহারের উপযোগী।",
  },
  "faq.q7": { en: "How should Vital Plus be taken?", bn: "ভাইটাল প্লাস খাওয়ার নিয়ম কি ?" },
  "faq.a7": {
    en: "For the best results, take one spoonful of Vital Plus after meals in the morning and at night each day — this brings the expected results very quickly.",
    bn: "ভালো ফলাফলের জন্য প্রতিদিন সকালে ও রাতে খাবারের পর এক চামচ ভাইটাল প্লাস খেলে খুব দ্রুত প্রত্যাশিত ফলাফল পাওয়া যায়।",
  },

  // ─── Story page ───
  "story.title": { en: "Our Story", bn: "আমাদের গল্প" },
  "story.intro1": {
    en: "We didn't grow up thinking about wellness.\nWe just lived. And somehow, that was enough.",
    bn: "আমরা সুস্থতা নিয়ে বড় হইনি।\nআমরা শুধু বেঁচেছি। আর সেই বেঁচে থাকাটুকুই ছিল যথেষ্ট।",
  },
  "story.intro2": {
    en: "Food came from places we trusted. Rest came naturally. And when the body needed something, the answer was never far. Our grandparents knew. Their parents knew before them. It wasn't a system or a routine. It was simply how life worked.",
    bn: "খাবার আসত সেইসব উৎস থেকে, যাদের প্রতি আমাদের ছিল অকুণ্ঠ আস্থা। বিশ্রাম ছিল জীবনেরই এক স্বাভাবিক অনুষঙ্গ—তাকে আলাদা করে খুঁজে নিতে হতো না। আর শরীরের যখন কোনো কিছুর প্রয়োজন দেখা দিত, তার উত্তরও যেন হাতের কাছেই মেলে থাকত।\nআমাদের দাদা-দাদীরা তা জানতেন। তাঁদের আগে তাঁদের বাবা-মায়েরাও জানতেন। এটি কোনো নিয়মের বাঁধাধরা কাঠামো ছিল না, ছিল না কোনো পরিকল্পিত জীবনযাপন পদ্ধতি। এ ছিল জীবনের সহজাত ছন্দ—প্রকৃতির সঙ্গে একাত্ম হয়ে বেঁচে থাকার এক স্বাভাবিক উপায়। জীবন তখন এমনভাবেই প্রবাহিত হতো।",
  },
  "story.heritageTitle": {
    en: "Our Heritage of Connection",
    bn: "আমাদের সংযোগের ঐতিহ্য",
  },

  "story.heritage1": {
    en: "There was a time when the people around us knew things we have since forgotten.",
    bn: "একসময় আমাদের চারপাশের মানুষ এমন কিছু জানতেন, যা আমরা ধীরে ধীরে ভুলে গেছি।",
  },

  "story.heritage2": {
    en: "Your grandmother didn't read ingredient labels. She didn't need to. She knew what the earth gave, and she trusted it completely. The remedies were simple. The food was honest. And the body, somehow, kept up.",
    bn: "আপনার দাদি-নানি খাবারের উপাদানের তালিকা দেখতেন না। তাঁর দরকারও হতো না। তিনি জানতেন প্রকৃতি কী দেয়, এবং সেটার ওপর পূর্ণ আস্থা রাখতেন। খাবার ছিল সহজ, জীবন ছিল স্বাভাবিক, আর শরীরও তাতে খাপ খাইয়ে চলত।",
  },

  "story.heritage3": {
    en: "That knowledge didn't come from research. It came from generations of quiet, careful attention. A relationship between people and nature that was never dramatic, just deeply real.",
    bn: "এই জ্ঞান কোনো গবেষণা থেকে আসেনি। এসেছে প্রজন্মের নীরব অভিজ্ঞতা আর যত্ন থেকে। মানুষ ও প্রকৃতির সম্পর্ক ছিল সহজ, কিন্তু গভীরভাবে সত্য।",
  },

  "story.heritage4": {
    en: "We grew up at the edge of that world. Close enough to remember it. Far enough to feel what it means to lose it.",
    bn: "আমরা সেই পৃথিবীর কিনারায় বড় হয়েছি। কাছাকাছি ছিল, তাই কিছুটা মনে আছে; আবার দূরে ছিল, তাই অনেক কিছু হারিয়ে যাওয়ার অনুভূতিও আছে।",
  },
  "story.disconnectTitle": { en: "The Great Disconnect", bn: "বড় বিচ্ছিন্নতা" },

  "story.disconnect1": {
    en: "But somewhere between then and now, life changed.",
    bn: "কিন্তু তখন আর এখনের মাঝে কোথাও জীবন বদলে গেছে।",
  },

  "story.disconnect2": {
    en: "Not in a single moment. Slowly. The way you don't notice you've stopped sleeping well until you can't remember the last time you woke up feeling rested. The way you don't notice you've stopped eating real food until your body starts telling you something is missing.",
    bn: "একদিনে নয়। ধীরে ধীরে। আপনি খেয়ালই করেন না যে ভালো ঘুম বন্ধ হয়ে গেছে, যতক্ষণ না মনে করতে পারেন শেষ কবে ভালোভাবে বিশ্রাম নিয়ে উঠেছিলেন। আবার খেয়াল করেন না যে আসল খাবার খাওয়া কমে গেছে, যতক্ষণ না শরীর জানাতে শুরু করে কিছু একটা ঘাটতি আছে।",
  },

  "story.disconnect3": {
    en: "The world got faster. And you kept up with it, because that is what you do.",
    bn: "পৃথিবী দ্রুত হয়ে গেল। আর আপনি তার সাথে তাল মিলিয়ে চললেন, কারণ আপনি সেটাই করেন।",
  },

  "story.disconnect4": {
    en: "But speed has a cost. And most of us are paying it quietly, every single day.",
    bn: "কিন্তু দ্রুততার একটা দাম আছে। আর আমরা বেশিরভাগই সেটা নীরবে দিচ্ছি, প্রতিদিন।",
  },

  "story.promiseTitle": { en: "AVYRA: The Promise", bn: "AVYRA: প্রতিশ্রুতি" },

  "story.promise1": {
    en: "We started Avyra because we felt it too.",
    bn: "আমরা Avyra শুরু করেছি কারণ আমরাও এটা অনুভব করেছি।",
  },

  "story.promise2": {
    en: "That gap between the life we were living and the way we actually wanted to feel. We didn't want to go backwards. We just wanted to bring something forward. The ingredients that have always worked. The wisdom that never stopped being true. Taken seriously, prepared carefully, and brought into your life without pretending to be something they are not.",
    bn: "আমরা যে জীবন যাপন করছিলাম আর যেভাবে সত্যি অনুভব করতে চেয়েছিলাম, তার মাঝে যে ফাঁক ছিল। আমরা পিছনে যেতে চাইনি। আমরা শুধু কিছু ভালো জিনিস সামনে আনতে চেয়েছি। যেগুলো সবসময় কাজ করেছে, সেই উপাদানগুলো। যে জ্ঞান কখনো মিথ্যা হয়নি। সবকিছু গুরুত্ব দিয়ে, যত্ন করে তৈরি করে, এমনভাবে আনা যা আসলেই যা তা-ই থাকে।",
  },

  "story.promise3": {
    en: "No shortcuts. No noise. Just nature, given the respect it has always deserved.",
    bn: "কোনো শর্টকাট নয়। কোনো বাড়াবাড়ি নয়। শুধু প্রকৃতি—যাকে তার প্রাপ্য সম্মান দেওয়া হয়েছে।",
  },

  "story.promise4": {
    en: "Because somewhere inside you, you already know what your body needs. You have always known.",
    bn: "কারণ আপনার ভেতরে কোথাও আপনি আগেই জানেন আপনার শরীরের কী দরকার। আপনি সবসময়ই সেটা জানতেন।",
  },

  "story.promise5": {
    en: "Avyra is simply here to help you listen again.",
    bn: "Avyra শুধু এখানে আছে আপনাকে আবার নিজের কথা শুনতে সাহায্য করতে।",
  },

  // ─── Product detail page ───
  "product.loading": { en: "Loading...", bn: "লোড হচ্ছে..." },
  "product.notFound": { en: "Product not found", bn: "পণ্য পাওয়া যায়নি" },
  "product.backToShop": { en: "Back to Shop", bn: "শপে ফিরে যান" },
  "product.sku": { en: "SKU", bn: "এসকেইউ" },
  "product.size": { en: "Size", bn: "সাইজ" },
  "product.quantity": { en: "Quantity", bn: "পরিমাণ" },
  "product.addToCart": { en: "Add to cart", bn: "কার্টে যোগ করুন" },
  "product.buyNow": { en: "Buy Now", bn: "এখনই কিনুন" },
  "product.description": { en: "Product Description", bn: "পণ্যের বিবরণ" },
  "product.deliveryPolicy": { en: "Delivery Policy", bn: "ডেলিভারি নীতি" },
  "product.deliveryDefault": { en: "All over bangladesh free", bn: "সারা বাংলাদেশে ফ্রি" },

  // ─── Checkout page ───
  "checkout.title": { en: "Checkout", bn: "চেকআউট" },
  "checkout.deliveryInfo": { en: "Delivery Information", bn: "ডেলিভারি তথ্য" },
  "checkout.name": { en: "Name *", bn: "নাম *" },
  "checkout.namePlaceholder": { en: "Your name", bn: "আপনার নাম" },
  "checkout.phone": { en: "Phone *", bn: "ফোন *" },
  "checkout.emailOptional": { en: "Email (Optional)", bn: "ইমেইল (ঐচ্ছিক)" },
  "checkout.address": { en: "Address *", bn: "ঠিকানা *" },
  "checkout.addressPlaceholder": { en: "Full delivery address...", bn: "সম্পূর্ণ ডেলিভারি ঠিকানা..." },
  "checkout.deliveryArea": { en: "Delivery Area *", bn: "ডেলিভারি এলাকা *" },
  "checkout.insideDhaka": { en: "Inside Dhaka", bn: "ঢাকার ভিতরে" },
  "checkout.outsideDhaka": { en: "Outside Dhaka", bn: "ঢাকার বাইরে" },
  "checkout.freeDelivery": { en: "Free delivery", bn: "ফ্রি ডেলিভারি" },
  "checkout.notesOptional": { en: "Notes (Optional)", bn: "নোট (ঐচ্ছিক)" },
  "checkout.notesPlaceholder": { en: "Additional instructions...", bn: "অতিরিক্ত নির্দেশনা..." },
  "checkout.paymentMethod": { en: "Payment Method", bn: "পেমেন্ট পদ্ধতি" },
  "checkout.orderSummary": { en: "Order Summary", bn: "অর্ডার সারাংশ" },
  "checkout.subtotal": { en: "Subtotal", bn: "সাবটোটাল" },
  "checkout.couponDiscount": { en: "Coupon Discount", bn: "কুপন ডিসকাউন্ট" },
  "checkout.delivery": { en: "Delivery", bn: "ডেলিভারি" },
  "checkout.deliveryDiscount": { en: "Delivery discount", bn: "ডিসকাউন্ট ডেলিভারি চার্জ" },
  "checkout.free": { en: "Free", bn: "ফ্রি" },
  "checkout.gross": { en: "Total", bn: "মোট" },
  "checkout.discountDelivery": { en: "Discount delivery charge", bn: "ডিসকাউন্ট ডেলিভারি চার্জ" },
  "checkout.total": { en: "Total", bn: "সর্বমোট" },
  "checkout.placingOrder": { en: "Placing order...", bn: "অর্ডার দেওয়া হচ্ছে..." },
  "checkout.confirmOrder": { en: "Confirm Order", bn: "অর্ডার নিশ্চিত করুন" },
  "checkout.orderPlacedTitle": { en: "Order Placed Successfully! 🎉", bn: "অর্ডার সফলভাবে সম্পন্ন হয়েছে! 🎉" },
  "checkout.yourOrderNumber": { en: "Your order number:", bn: "আপনার অর্ডার নম্বর:" },
  "checkout.willContact": { en: "We will contact you shortly.", bn: "আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।" },
  "checkout.shopMore": { en: "Shop More", bn: "আরও কিনুন" },
  "checkout.trackOrder": { en: "Track Order", bn: "অর্ডার ট্র্যাক করুন" },
  "checkout.cartEmpty": { en: "Cart is empty", bn: "কার্ট খালি" },
  "checkout.sorry": { en: "Sorry!", bn: "দুঃখিত!" },
  "checkout.errProvideContact": {
    en: "Please provide name, phone and address",
    bn: "অনুগ্রহ করে নাম, ফোন ও ঠিকানা দিন",
  },
  "checkout.orderSuccessToast": { en: "Order placed successfully!", bn: "অর্ডার সফলভাবে সম্পন্ন হয়েছে!" },
  "checkout.orderFailToast": { en: "Failed to place order", bn: "অর্ডার দিতে ব্যর্থ হয়েছে" },

  // ─── Payment method selector ───
  "pay.cod": { en: "Cash on Delivery", bn: "ক্যাশ অন ডেলিভারি" },
  "pay.codDesc": { en: "Pay on delivery", bn: "ডেলিভারিতে পরিশোধ করুন" },
  "pay.bkash": { en: "bKash", bn: "বিকাশ" },
  "pay.bkashDesc": { en: "bKash mobile payment", bn: "বিকাশ মোবাইল পেমেন্ট" },
  "pay.nagad": { en: "Nagad", bn: "নগদ" },
  "pay.nagadDesc": { en: "Nagad mobile payment", bn: "নগদ মোবাইল পেমেন্ট" },
  "pay.rocket": { en: "Rocket", bn: "রকেট" },
  "pay.rocketDesc": { en: "Rocket mobile payment", bn: "রকেট মোবাইল পেমেন্ট" },
  "pay.yourNo": { en: "Your {label} No *", bn: "আপনার {label} নম্বর *" },
  "pay.reference": { en: "Reference / TrxID", bn: "রেফারেন্স / TrxID" },
  "pay.transactionId": { en: "Transaction ID", bn: "ট্রানজেকশন আইডি" },
  "pay.merchantNo": { en: "No", bn: "নম্বর" },
};
