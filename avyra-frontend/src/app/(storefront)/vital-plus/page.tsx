"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { AvyraFaq } from "@/components/avyra/home-sections";
import { Reveal } from "@/components/avyra/reveal";
import { useLanguage } from "@/components/language-provider";

const A = "/avyra";
const BUY_HREF = "/shop/vital-plus";

// Hosted on the brand's own CDN, exactly as in the previous build.
const HERO_URL = "https://rpropertybd.com/public/vital-plus-hero.png";
const BOTTLE_URL = "https://rpropertybd.com/public/vital-bottle.png";
const WORDMARK_URL = "https://rpropertybd.com/public/vital-plus.png";
const PATTERN_URL = "https://rpropertybd.com/public/bgsq.png";

function BuyNow({ light = false }: { light?: boolean }) {
  const { t } = useLanguage();

  return (
    <Link
      href={BUY_HREF}
      className={`group inline-flex items-center gap-2 rounded-full pl-2 pr-5 py-2 font-medium text-sm shadow-[0_10px_30px_-10px_rgba(232,93,58,0.6)] transition-all hover:-translate-y-0.5 ${
        light ? "bg-black text-white" : "bg-avyra-coral text-white"
      }`}
    >
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 group-hover:rotate-[-15deg] transition-transform">
        <ShoppingBag className="w-4 h-4" />
      </span>
      <span>{t("common.buyNow")}</span>
    </Link>
  );
}

const INGREDIENTS = [
  { icon: `${A}/ing-sprout.png`, title: "vp.ingPineNuts", desc: "vp.ingPineNutsDesc" },
  { icon: `${A}/ing-cardamom.png`, title: "vp.ingCashew", desc: "vp.ingCashewDesc" },
  { icon: `${A}/ing-honey.png`, title: "vp.ingHoney", desc: "vp.ingHoneyDesc" },
  { icon: `${A}/ing-leaf-large.png`, title: "vp.ingAshwagandha", desc: "vp.ingAshwagandhaDesc" },
  { icon: `${A}/ing-mastic.png`, title: "vp.ingMastic", desc: "vp.ingMasticDesc" },
  { icon: `${A}/ing-fern.png`, title: "vp.ingOther", desc: "vp.ingOtherDesc" },
];

export default function VitalPlusPage() {
  const { t } = useLanguage();

  return (
    <>
      {/* HERO */}
      <section className="relative h-[88svh] min-h-[780px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HERO_URL} alt="Avyra Vital Plus" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

        <div className="relative h-full max-w-[1440px] mx-auto px-6 lg:px-10 flex flex-col justify-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white/90 text-base md:text-lg font-medium"
          >
            {t("vp.heroEyebrow")}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mt-3 text-white font-display font-bold leading-[1.05] max-w-2xl whitespace-pre-line"
            style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)" }}
          >
            {t("vp.heroHeadline")}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-8"
          >
            <BuyNow light />
          </motion.div>
        </div>
      </section>

      {/* INGREDIENTS */}
      <section className="relative overflow-hidden bg-white py-20 md:py-28">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${A}/tree-vector.png`}
          alt=""
          aria-hidden
          className="pointer-events-none select-none absolute top-0 left-0 w-28 md:w-40 opacity-60"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${A}/tree-vector.png`}
          alt=""
          aria-hidden
          className="pointer-events-none select-none absolute top-0 right-0 w-28 md:w-40 opacity-60 -scale-x-100"
        />

        <div className="relative max-w-[1440px] mx-auto px-6 lg:px-10">
          <Reveal
            as="h2"
            className="text-center font-display font-bold text-3xl md:text-4xl text-avyra-ink leading-tight whitespace-pre-line"
          >
            {t("vp.ingHeading")}
          </Reveal>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {INGREDIENTS.map((ing, i) => (
              <Reveal key={ing.title} delay={i * 0.06} className="border border-avyra-ink/15 rounded-xl overflow-hidden">
                <div className="flex flex-col items-start text-left p-8 h-full">
                  <span className="w-16 h-16 rounded-full bg-avyra-cream flex items-center justify-center shadow-sm overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ing.icon} alt={t(ing.title)} className="w-12 h-12 object-contain" />
                  </span>
                  <h3 className="mt-5 font-display font-bold text-lg text-avyra-ink">{t(ing.title)}</h3>
                  <p className="mt-2 text-sm text-avyra-ink/70 leading-relaxed">{t(ing.desc)}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-20 text-center max-w-xl mx-auto">
            <Reveal as="p" className="font-display font-semibold text-xl md:text-2xl text-avyra-ink leading-snug">
              {t("vp.ingClosing")}
            </Reveal>
            <Reveal delay={0.15} className="mt-8 flex justify-center">
              <BuyNow />
            </Reveal>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="relative overflow-hidden bg-avyra-teal-light py-20 md:py-28">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${A}/tree-vector.png`}
          alt=""
          aria-hidden
          className="pointer-events-none select-none absolute bottom-0 left-0 w-28 md:w-40 opacity-50"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${A}/tree-vector.png`}
          alt=""
          aria-hidden
          className="pointer-events-none select-none absolute bottom-0 right-0 w-28 md:w-40 opacity-50 -scale-x-100"
        />

        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10 text-center">
          <Reveal
            as="h2"
            className="font-display font-bold text-4xl md:text-4xl text-avyra-teal-deep leading-tight whitespace-pre-line"
          >
            {t("vp.trustHeading")}
          </Reveal>

          <Reveal delay={0.1} className="mt-10 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-white/30 blur-3xl scale-90 rounded-full" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={BOTTLE_URL} alt="Avyra Vital Plus jar" className="relative w-48 md:w-64" />
            </div>
          </Reveal>

          <Reveal
            delay={0.15}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm md:text-base text-avyra-teal-deep/80"
          >
            <span>{t("vp.usage1")}</span>
            <span className="hidden md:inline text-avyra-teal-deep/30">|</span>
            <span>{t("vp.usage2")}</span>
            <span className="hidden md:inline text-avyra-teal-deep/30">|</span>
            <span>{t("vp.usage3")}</span>
          </Reveal>

          <Reveal
            delay={0.2}
            as="p"
            className="mt-10 font-display font-semibold text-xl md:text-2xl text-avyra-teal-deep whitespace-pre-line"
          >
            {t("vp.routine")}
          </Reveal>

          <Reveal delay={0.25} className="mt-8 flex justify-center">
            <BuyNow />
          </Reveal>
        </div>
      </section>

      {/* CORAL CTA */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url('${PATTERN_URL}')`, backgroundRepeat: "repeat" }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${A}/tree-vector.png`}
          alt=""
          aria-hidden
          className="pointer-events-none select-none absolute top-8 left-0 w-28 md:w-40 opacity-40"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${A}/tree-vector.png`}
          alt=""
          aria-hidden
          className="pointer-events-none select-none absolute top-8 right-0 w-28 md:w-40 opacity-40 -scale-x-100"
        />

        <div className="relative max-w-[800px] mx-auto px-6 lg:px-10 text-center">
          <Reveal className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={WORDMARK_URL}
              alt="Vital Plus"
              className="h-16 md:h-24 w-auto object-contain"
              draggable={false}
            />
          </Reveal>

          <Reveal delay={0.1} as="h2" className="mt-8 text-black font-display font-bold leading-[1.1]">
            <span style={{ fontSize: "clamp(2rem, 4.5vw, 3.25rem)" }}>{t("vp.coralCta")}</span>
          </Reveal>

          <Reveal delay={0.2} className="mt-10 flex justify-center">
            <BuyNow light />
          </Reveal>
        </div>
      </section>

      <AvyraFaq className="bg-avyra-cream py-20 md:py-28" layout="narrow" />
    </>
  );
}
