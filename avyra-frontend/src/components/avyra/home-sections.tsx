"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { ChevronDown, ShoppingBag } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Reveal } from "@/components/avyra/reveal";
import { useLanguage } from "@/components/language-provider";

const A = "/avyra";
export const BUY_HREF = "/shop/vital-plus";

/**
 * Where every "buy" button in these sections points. The storefront sends people
 * to the product page; a campaign page that reuses these sections overrides it
 * with its own on-page order form, so a click never leaves the campaign.
 */
const BuyHrefContext = createContext(BUY_HREF);

export function BuyHrefProvider({ href, children }: { href: string; children: ReactNode }) {
  return <BuyHrefContext.Provider value={href}>{children}</BuyHrefContext.Provider>;
}

function useBuyHref() {
  return useContext(BuyHrefContext);
}

/* ─── Hero ─────────────────────────────────────────────────────────────── */

export function HomeHero() {
  const buyHref = useBuyHref();
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 120]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[560px] md:min-h-[640px] overflow-hidden">
      <motion.div style={{ y, scale }} className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${A}/hero-man.webp`} alt="Avyra wellness" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/50" />
      </motion.div>

      <div className="relative h-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 grid grid-cols-12 gap-x-6 pt-24 md:pt-28 pb-10 md:pb-14">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="col-span-12 md:col-span-4 text-white text-3xl md:text-lg font-medium leading-snug self-start whitespace-pre-line"
        >
          {t("about.heroTagline")}
        </motion.p>

        <div className="col-span-12 self-end flex flex-col items-start md:items-center text-left md:text-center">
          <motion.img
            src={`${A}/avyra-wordmark.webp`}
            alt="AVYRA"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="hidden md:block w-full max-w-[1100px] h-auto select-none pointer-events-none"
            draggable={false}
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9 }}
            className="text-white font-display font-bold leading-[1.05] md:leading-[1] mt-1 -translate-y-32 md:translate-y-0"
            style={{ fontSize: "clamp(2.75rem, 5.2vw, 4.5rem)" }}
          >
            {t("about.heroHeadline")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="mt-6 md:mt-8"
          >
            <Link
              href={buyHref}
              className="group inline-flex items-center gap-3 flex-row-reverse md:flex-row pr-6 pl-2 md:pl-6 md:pr-2 py-2 rounded-full bg-white md:bg-avyra-coral text-avyra-teal-deep md:text-white font-medium text-sm shadow-[0_10px_30px_-10px_rgba(232,93,58,0.7)] hover:shadow-[0_15px_40px_-10px_rgba(232,93,58,0.9)] transition-all hover:-translate-y-0.5"
            >
              <span>{t("common.viewProducts")}</span>
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-avyra-coral md:bg-white text-white md:text-avyra-coral group-hover:rotate-[-20deg] transition-transform">
                <ShoppingBag className="w-4 h-4" />
              </span>
            </Link>
          </motion.div>
        </div>
      </div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70"
      >
        <ChevronDown className="w-6 h-6" />
      </motion.div>
    </section>
  );
}

/* ─── Value props ──────────────────────────────────────────────────────── */

export function HomeValueProps() {
  const buyHref = useBuyHref();
  const { t } = useLanguage();

  const props = [
    { icon: `${A}/icon-sprout.webp`, key: "about.vp1" },
    { icon: `${A}/icon-lotus.webp`, key: "about.vp2" },
    { icon: `${A}/icon-balance.webp`, key: "about.vp3" },
  ];

  return (
    <section className="relative bg-avyra-cream pt-32 md:pt-44 pb-56 md:pb-64 overflow-hidden">
      {/* The original offer backdrop lived on the old host; this reproduces its
          deep-forest wash so the white type keeps the same contrast. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, hsl(188 55% 24%) 0%, hsl(192 70% 12%) 75%)",
        }}
      />
      <div className="absolute inset-0 bg-black/35 pointer-events-none" />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${A}/tree-vector.webp`}
        alt=""
        aria-hidden
        className="absolute left-0 top-32 md:top-20 w-20 md:w-40 opacity-40 -rotate-12 -translate-x-4 md:-translate-x-8 pointer-events-none select-none"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${A}/tree-vector.webp`}
        alt=""
        aria-hidden
        className="absolute right-0 top-8 md:top-4 w-20 md:w-40 opacity-40 rotate-12 translate-x-4 md:translate-x-8 pointer-events-none select-none scale-x-[-1]"
      />

      <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="text-center">
          <Reveal
            as="h2"
            className="font-display font-bold text-4xl md:text-6xl text-white leading-tight drop-shadow-lg whitespace-pre-line"
          >
            {t("about.offerHeading")}
          </Reveal>

          <Reveal delay={0.15} className="mt-10 flex justify-center">
            <Link
              href={buyHref}
              className="group inline-flex items-center gap-3 p-1.5 pr-6 rounded-full bg-avyra-coral text-white font-medium text-sm ring-2 ring-white/50 shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white text-avyra-coral group-hover:rotate-[-20deg] transition-transform">
                <ShoppingBag className="w-4 h-4" />
              </span>
              <span>{t("common.viewProducts")}</span>
            </Link>
          </Reveal>
        </div>
      </div>

      <div className="relative z-20 max-w-[1280px] mx-auto px-6 lg:px-10 translate-y-32 md:translate-y-40">
        <div className="grid grid-cols-1 md:grid-cols-3 bg-transparent backdrop-blur-sm rounded-[8px] overflow-hidden border border-white shadow-[0_25px_80px_rgba(0,0,0,0.15)]">
          {props.map((v, i) => (
            <Reveal
              key={v.key}
              delay={0.1 * i}
              className={`p-8 lg:p-12 flex flex-col items-start ${
                i > 0 ? "border-t md:border-t-0 md:border-l border-black/40" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.icon} alt="" className="w-20 h-20 md:w-24 md:h-24 mb-6 select-none" />
              <p className="text-sm md:text-base text-white leading-relaxed font-medium max-w-[280px]">
                {t(v.key)}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Family banner ────────────────────────────────────────────────────── */

export function HomeFamilyBanner() {
  const { t } = useLanguage();

  return (
    <section className="relative w-full">
      <Reveal className="relative w-full overflow-hidden aspect-[4/3] md:aspect-[1330/789]">
        <motion.img
          src={`${A}/family-home.webp`}
          alt="Happy family"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          whileInView={{ scale: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          loading="lazy"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${A}/family-mask.webp`}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-bottom pointer-events-none select-none opacity-50 mix-blend-screen"
        />
        <div className="relative h-full flex items-end justify-center px-6 pb-8 md:pb-12 text-center">
          <h2
            className="font-display font-bold text-white leading-[1.05] drop-shadow-[0_4px_20px_rgba(0,0,0,0.45)] whitespace-pre-line"
            style={{ fontSize: "clamp(2rem, 8.5vw, 6rem)" }}
          >
            {t("about.familyBanner")}
          </h2>
        </div>
      </Reveal>
    </section>
  );
}

/* ─── From nature, for you ─────────────────────────────────────────────── */

type IngredientCfg = {
  src: string;
  left: string;
  top: string;
  width: string;
  rot: number;
  dx: number;
  dy: number;
  start: number;
  end: number;
};

function IngredientItem({
  progress,
  ing,
  reduce,
}: {
  progress: MotionValue<number>;
  ing: IngredientCfg;
  reduce: boolean;
}) {
  // Entry happens in the first half of the ingredient's own window; the drift then
  // continues across the whole range so scrolling either way always shows movement.
  const mid = (ing.start + ing.end) / 2;
  const x = useTransform(progress, [ing.start, ing.end, 1], reduce ? [0, 0, 0] : [ing.dx, 0, -ing.dx * 0.45]);
  const y = useTransform(progress, [ing.start, ing.end, 1], reduce ? [0, 0, 0] : [ing.dy, 0, -ing.dy * 0.45 - 30]);
  const rotate = useTransform(
    progress,
    [ing.start, ing.end, 1],
    reduce ? [ing.rot, ing.rot, ing.rot] : [ing.rot - 25, ing.rot, ing.rot + 18],
  );
  const scale = useTransform(progress, [ing.start, mid, 1], reduce ? [1, 1, 1] : [0.7, 1, 1.06]);
  const opacity = useTransform(progress, [ing.start, mid], [0, 1]);

  return (
    <div
      aria-hidden
      className="absolute pointer-events-none select-none"
      style={{ left: ing.left, top: ing.top, width: ing.width, transform: "translate(-50%, -50%)" }}
    >
      <motion.img
        src={ing.src}
        alt=""
        className="w-full h-auto block will-change-transform"
        style={{ transformOrigin: "center", x, y, rotate, scale, opacity }}
        draggable={false}
      />
    </div>
  );
}

const INGREDIENTS: IngredientCfg[] = [
  { src: `${A}/ing-mastic.webp`, left: "1.5%", top: "34%", width: "7.5%", rot: -8, dx: -40, dy: 0, start: 0.1, end: 0.45 },
  { src: `${A}/ing-cinnamon.webp`, left: "13%", top: "66%", width: "8.9%", rot: -4, dx: -30, dy: 40, start: 0.15, end: 0.5 },
  { src: `${A}/ing-rosemary.webp`, left: "21%", top: "8%", width: "5.9%", rot: 8, dx: 0, dy: -40, start: 0.12, end: 0.47 },
  { src: `${A}/ing-sprout.webp`, left: "32%", top: "4%", width: "9.5%", rot: 0, dx: 0, dy: -30, start: 0.2, end: 0.55 },
  { src: `${A}/ing-fern.webp`, left: "49%", top: "22%", width: "6.4%", rot: 5, dx: 0, dy: -30, start: 0.25, end: 0.6 },
  { src: `${A}/ing-cardamom.webp`, left: "69%", top: "8%", width: "6.9%", rot: 3, dx: 0, dy: -30, start: 0.28, end: 0.62 },
  { src: `${A}/ing-honey.webp`, left: "95%", top: "30%", width: "11.4%", rot: 4, dx: 40, dy: 0, start: 0.22, end: 0.58 },
  { src: `${A}/ing-leaf-large.webp`, left: "85%", top: "82%", width: "5%", rot: -6, dx: 30, dy: 30, start: 0.32, end: 0.65 },
];

export function HomeFromNature() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: progress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const headingRightX = useTransform(progress, [0, 0.45], reduce ? ["0%", "0%"] : ["14%", "0%"]);
  const headingRightOpacity = useTransform(progress, [0, 0.45], [0, 1]);
  const headingLeftX = useTransform(progress, [0.2, 0.65], reduce ? ["0%", "0%"] : ["-14%", "0%"]);
  const headingLeftOpacity = useTransform(progress, [0.2, 0.65], [0, 1]);
  const badgeRotate = useTransform(progress, [0.1, 0.55], reduce ? [8, 8] : [-47, 8]);
  const badgeScale = useTransform(progress, [0.1, 0.55], [0.55, 1]);
  const badgeOpacity = useTransform(progress, [0.1, 0.45], [0, 1]);
  const ribbonScaleX = useTransform(progress, [0.05, 0.5], [0.85, 1]);
  const ribbonOpacity = useTransform(progress, [0.05, 0.45], [0, 1]);

  return (
    <section ref={ref} className="relative bg-avyra-cream py-16 md:py-24 overflow-hidden">
      <div className="px-6 lg:px-10">
        <motion.h2
          style={{ x: headingRightX, opacity: headingRightOpacity }}
          className="font-display font-bold text-avyra-teal-deep leading-[0.95] tracking-tight text-center"
        >
          <span className="block" style={{ fontSize: "clamp(2.5rem, 7.2vw, 7.5rem)" }}>
            {t("about.fromNature")}
          </span>
        </motion.h2>
      </div>

      <div className="relative w-full mt-16 md:mt-28" style={{ aspectRatio: "1916 / 660" }}>
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 pointer-events-none select-none"
          style={{ width: "105%", transform: "translate(-50%, -50%) rotate(0.5deg)" }}
        >
          <motion.img
            src={`${A}/coral-ribbon.webp`}
            alt=""
            className="w-full h-auto"
            style={{
              mixBlendMode: "multiply",
              transformOrigin: "center",
              scaleX: ribbonScaleX,
              opacity: ribbonOpacity,
            }}
            draggable={false}
          />
        </div>

        {INGREDIENTS.map((ing) => (
          <IngredientItem key={ing.src} progress={progress} ing={ing} reduce={!!reduce} />
        ))}

        <div
          className="absolute left-1/2 top-1/2 z-10 pointer-events-none select-none"
          style={{ width: "27%", maxWidth: "506px", transform: "translate(-14%, -24%)" }}
        >
          <motion.img
            src={`${A}/ing-vital-badge.webp`}
            alt="Vital Plus — Avyra Wellness"
            className="w-full h-auto block"
            style={{ transformOrigin: "center", rotate: badgeRotate, scale: badgeScale, opacity: badgeOpacity }}
            draggable={false}
          />
        </div>
      </div>

      <div className="px-6 lg:px-10">
        <motion.h2
          style={{ x: headingLeftX, opacity: headingLeftOpacity }}
          className="font-display font-bold text-avyra-ink leading-[0.95] tracking-tight text-center mt-8 md:mt-14"
        >
          <span className="block" style={{ fontSize: "clamp(2.5rem, 7.2vw, 7.5rem)" }}>
            {t("about.madeForModern")}
          </span>
        </motion.h2>
      </div>
    </section>
  );
}

/* ─── Product showcase ─────────────────────────────────────────────────── */

function Chip({
  label,
  icon,
  reverse = false,
}: {
  label: ReactNode;
  icon: string;
  reverse?: boolean;
}) {
  return (
    <div
      className={`flex w-full md:w-auto md:inline-flex items-center gap-1.5 md:gap-3 bg-avyra-cream/95 backdrop-blur rounded-full pl-1 pr-2 md:pl-2 md:pr-5 py-0.5 md:py-1.5 shadow-md border border-white min-w-0 ${
        reverse ? "flex-row-reverse pr-1 pl-2 md:pr-2 md:pl-5" : ""
      }`}
    >
      <span className="shrink-0 w-6 h-6 md:w-10 md:h-10 rounded-full bg-white overflow-hidden flex items-center justify-center shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={icon} alt="" className="w-4 h-4 md:w-8 md:h-8 object-contain" draggable={false} />
      </span>
      <span className="font-display font-semibold text-avyra-teal-deep text-[10px] md:text-sm leading-tight min-w-0 whitespace-pre-line">
        {label}
      </span>
    </div>
  );
}

export function HomeProductShowcase() {
  const buyHref = useBuyHref();
  const { t } = useLanguage();
  const [flip, setFlip] = useState(false);

  // The two pack shots cross-fade on a 1s cycle, as in the original.
  useEffect(() => {
    const timer = setInterval(() => setFlip((f) => !f), 1000);
    return () => clearInterval(timer);
  }, []);

  const leftChips = [
    { label: t("about.chipCashew"), icon: `${A}/ing-cardamom.webp`, reverse: false },
    { label: t("about.chipHoney"), icon: `${A}/ing-honey.webp`, reverse: true },
    { label: t("about.chipAshwagandha"), icon: `${A}/ing-leaf-large.webp`, reverse: false },
  ];

  const rightChips = [
    { label: t("about.chipPine"), icon: `${A}/ing-sprout.webp` },
    { label: t("about.chipMastic"), icon: `${A}/ing-mastic.webp` },
    { label: t("about.chipOtherNatural"), icon: `${A}/ing-fern.webp` },
  ];

  const pack = (
    <div className="relative w-full max-w-[240px] md:max-w-[450px] overflow-visible">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${A}/vital-plus-box.webp`}
        alt="Avyra Vital Plus product box"
        className={`w-full h-auto drop-shadow-2xl transition-opacity duration-1000 ease-in-out ${flip ? "opacity-0" : "opacity-100"}`}
        draggable={false}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${A}/vital-plus-box-hover.webp`}
        alt="Avyra Vital Plus packaging"
        className={`absolute bottom-0 left-0 w-full h-auto drop-shadow-2xl transition-opacity duration-1000 ease-in-out ${flip ? "opacity-100" : "opacity-0"}`}
        draggable={false}
      />
    </div>
  );

  return (
    <section className="relative bg-avyra-cream pt-16 md:pt-24 overflow-hidden">
      <div className="text-center px-6">
        <Reveal as="h3" className="font-display font-extrabold leading-none tracking-tight">
          <span className="text-avyra-coral" style={{ fontSize: "clamp(2.25rem, 5vw, 4.5rem)" }}>Vital</span>{" "}
          <span className="text-avyra-teal-deep" style={{ fontSize: "clamp(2.25rem, 5vw, 4.5rem)" }}>Plus</span>
        </Reveal>
        <Reveal delay={0.05} as="p" className="mt-3 font-display font-semibold text-avyra-teal-deep text-xl md:text-2xl">
          {t("about.tiredless")}
        </Reveal>
        <Reveal delay={0.1} as="p" className="mt-3 text-avyra-ink/70 text-sm md:text-base">
          {t("about.naturalEnergyLine")}
        </Reveal>
      </div>

      <div className="relative mt-10 md:mt-14 pb-16 md:pb-24">
        <div aria-hidden className="absolute inset-x-0 bottom-0 bg-avyra-teal-light" style={{ height: "72%" }} />

        <div className="relative max-w-[1280px] mx-auto px-3 md:px-6 lg:px-10">
          {/* Mobile */}
          <div className="md:hidden grid grid-cols-12 items-center gap-x-0.5">
            <div className="col-span-3 flex flex-col gap-1.5">
              {leftChips.map((chip, i) => (
                <Reveal key={chip.icon} delay={0.05 + i * 0.1}>
                  <Chip label={chip.label} icon={chip.icon} reverse={chip.reverse} />
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.1} className="col-span-6 flex justify-center">{pack}</Reveal>

            <div className="col-span-3 flex flex-col gap-1.5">
              {rightChips.map((chip, i) => (
                <Reveal key={chip.icon} delay={0.1 + i * 0.1}>
                  <Chip label={chip.label} icon={chip.icon} reverse />
                </Reveal>
              ))}
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden md:grid relative grid-cols-12 items-center gap-x-4 min-h-[620px]">
            <div className="col-span-3 flex flex-col items-start gap-8 md:gap-12 relative z-10">
              {leftChips.map((chip, i) => (
                <Reveal key={chip.icon} delay={0.05 + i * 0.1} className={i === 1 ? "ml-6" : undefined}>
                  <Chip label={chip.label} icon={chip.icon} reverse={chip.reverse} />
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.1} className="col-span-6 flex justify-center">{pack}</Reveal>

            <div className="col-span-3 flex flex-col items-end gap-8 md:gap-12 relative z-10">
              {rightChips.map((chip, i) => (
                <Reveal key={chip.icon} delay={0.05 + i * 0.1} className={i === 1 ? "mr-6" : undefined}>
                  <Chip label={chip.label} icon={chip.icon} reverse />
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={0.2} className="relative pb-16 pt-8 flex justify-center">
            <Link
              href={buyHref}
              className="inline-flex items-center gap-2 pl-2 pr-6 py-2 rounded-full bg-avyra-coral text-white text-base font-semibold hover:scale-105 transition-transform shadow-lg"
            >
              <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-avyra-coral" />
              </span>
              {t("common.buyNowLower")}
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─── Reconnect CTA ────────────────────────────────────────────────────── */

function ReconnectIcon({ name }: { name: "bolt" | "clock" | "bowl" }) {
  if (name === "bolt") {
    return (
      <svg width="56" height="56" viewBox="0 0 24 24" fill="white" aria-hidden>
        <path d="M13.5 2 4 13.5h6L9 22l9.5-11.5h-6L13.5 2Z" />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg width="56" height="56" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="white" />
        <path d="M12 7v5.25l3.5 2" stroke="hsl(14 75% 60%)" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  return (
    <svg width="64" height="56" viewBox="0 0 32 26" fill="white" aria-hidden>
      <path d="M12 9c-1.2-2.4-3-3.6-5-3.8.4 2.2 1.8 3.6 4 4.2" />
      <circle cx="13.5" cy="4.5" r="1" />
      <path d="M16 9c.4-3 1.4-4.6 3-5.8.6 2.6.2 4.6-1.6 6" />
      <circle cx="19.5" cy="2.5" r="1" />
      <path d="M20 9c1.4-1.8 3-2.4 4.8-2.4-.4 1.8-1.6 2.8-3.2 3.2" />
      <path d="M2 11h28c0 7-6.3 12-14 12S2 18 2 11Z" />
    </svg>
  );
}

export function HomeReconnect() {
  const buyHref = useBuyHref();
  const { t } = useLanguage();

  const features = [
    { icon: "bolt" as const, l1: "about.rf1l1", l2: "about.rf1l2" },
    { icon: "clock" as const, l1: "about.rf2l1", l2: "about.rf2l2" },
    { icon: "bowl" as const, l1: "about.rf3l1", l2: "about.rf3l2" },
  ];

  return (
    <section className="relative avyra-coral-gradient py-16 md:py-24 text-white overflow-hidden">
      <div className="relative max-w-[1280px] mx-auto px-8 lg:px-10">
        <div className="text-center max-w-3xl mx-auto">
          <Reveal
            as="h2"
            className="font-sans font-extrabold text-[2.25rem] leading-[1.05] tracking-tight md:text-6xl whitespace-pre-line"
          >
            {t("about.reconnectHeading")}
          </Reveal>
          <Reveal
            delay={0.1}
            className="mt-8 max-w-[20rem] md:max-w-md mx-auto text-white text-[1.0625rem] md:text-lg leading-[1.35] font-normal"
          >
            {t("about.reconnectSub")}
          </Reveal>
          <Reveal delay={0.2} className="mt-10">
            <Link
              href={buyHref}
              className="inline-flex items-center gap-2.5 pl-1.5 pr-7 py-1.5 rounded-full bg-black text-white text-[1.0625rem] font-medium hover:scale-105 transition-transform"
            >
              <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                <ShoppingBag className="w-[18px] h-[18px] text-avyra-coral" strokeWidth={2.4} />
              </span>
              {t("common.buyNow")}
            </Link>
          </Reveal>
        </div>

        <div className="mt-20 md:mt-24 flex flex-col md:flex-row gap-16 md:gap-10 items-center md:items-start justify-center max-w-4xl mx-auto">
          {features.map((f, i) => (
            <Reveal key={f.icon} delay={0.1 * i} className="flex-1 flex flex-col items-center text-center">
              <span className="mb-6 flex items-center justify-center">
                <ReconnectIcon name={f.icon} />
              </span>
              <p className="font-sans font-bold text-[1.0625rem] md:text-lg leading-[1.3]">
                {t(f.l1)}
                <br />
                {t(f.l2)}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Just begin ───────────────────────────────────────────────────────── */

export function HomeJustBegin() {
  const buyHref = useBuyHref();
  const { t } = useLanguage();

  return (
    <section className="bg-avyra-teal-light py-24 md:py-32">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 text-center">
        <Reveal
          as="h2"
          className="font-sans font-bold text-[2.25rem] md:text-5xl text-avyra-ink leading-[1.2] tracking-tight whitespace-pre-line"
        >
          {t("about.justBegin")}
        </Reveal>
        <Reveal delay={0.15} className="mt-10">
          <Link
            href={buyHref}
            className="inline-flex items-center gap-2.5 pl-1.5 pr-6 py-1.5 rounded-full bg-avyra-teal-deep text-white text-base font-semibold hover:scale-105 transition-transform"
          >
            <span className="w-9 h-9 rounded-full bg-avyra-coral flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" strokeWidth={2.2} />
            </span>
            {t("common.buyNowLower")}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── FAQ ──────────────────────────────────────────────────────────────── */

/** Number of `faq.qN`/`faq.aN` pairs in translations.ts — keep the two in step. */
const FAQ_COUNT = 7;

export function AvyraFaq({
  className = "bg-avyra-cream py-20",
  layout = "home",
}: {
  className?: string;
  layout?: "home" | "narrow";
}) {
  const { t } = useLanguage();
  const items = Array.from({ length: FAQ_COUNT }, (_, i) => ({
    q: `faq.q${i + 1}`,
    a: `faq.a${i + 1}`,
  }));

  return (
    <section className={className}>
      <div
        className={
          layout === "home"
            ? "max-w-[1280px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-x-6 gap-y-8"
            : "max-w-[1000px] mx-auto px-6 lg:px-10 grid md:grid-cols-[280px_1fr] gap-10 md:gap-16"
        }
      >
        <Reveal
          as="h2"
          className={
            layout === "home"
              ? "col-span-12 md:col-span-4 font-display text-3xl md:text-4xl text-avyra-teal-deep"
              : "font-display font-bold text-2xl md:text-3xl text-avyra-ink"
          }
        >
          {t("common.faq")}
        </Reveal>

        <Reveal delay={0.1} className={layout === "home" ? "col-span-12 md:col-span-8" : undefined}>
          <div className="w-full">
            {items.map((item, i) => (
              <details
                key={item.q}
                open={i === 0}
                className="group border-b border-avyra-teal/15"
              >
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none py-5 text-left font-medium text-avyra-teal-deep">
                  <span>
                    {i + 1}. {t(item.q)}
                  </span>
                  <ChevronDown className="w-4 h-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="text-sm text-avyra-ink/75 leading-relaxed pb-5">{t(item.a)}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
