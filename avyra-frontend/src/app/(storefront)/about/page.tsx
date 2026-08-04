"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Reveal } from "@/components/avyra/reveal";
import { useLanguage } from "@/components/language-provider";

// Hosted on the brand's own CDN, as in the previous build.
const HERO_URL = "https://rpropertybd.com/public/about.png";

export default function OurStoryPage() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 140]);

  return (
    <>
      {/* HERO */}
      <section
        ref={heroRef}
        className="relative overflow-hidden pt-[72px] md:pt-0 bg-avyra-teal-deep md:bg-transparent md:h-[88svh] md:min-h-[780px]"
      >
        <motion.div style={{ y }} className="relative md:absolute md:inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_URL}
            alt="Dried herbs and ayurvedic ingredients arranged on a surface"
            className="w-full h-auto md:h-full object-contain md:object-cover"
          />
          <div className="absolute inset-0 bg-black/45" />
        </motion.div>

        <div className="absolute inset-0 md:relative md:h-full flex items-center justify-center pt-20">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-white font-bold text-5xl md:text-7xl"
          >
            {t("story.title")}
          </motion.h1>
        </div>
      </section>

      {/* INTRO */}
      <section className="bg-avyra-cream py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal
            as="h2"
            className="font-display font-bold text-2xl md:text-4xl text-avyra-ink leading-tight whitespace-pre-line"
          >
            {t("story.intro1")}
          </Reveal>
          <Reveal
            delay={0.1}
            className="mt-8 text-avyra-ink/75 text-sm md:text-base leading-relaxed max-w-2xl mx-auto whitespace-pre-line"
          >
            {t("story.intro2")}
          </Reveal>
        </div>
      </section>

      {/* HERITAGE CARD */}
      <section
        className="relative py-16 md:py-24 px-4 md:px-6"
        style={{
          // Stands in for the original patterned backdrop, which lived on the old host.
          background:
            "repeating-linear-gradient(135deg, hsl(40 55% 92%) 0 14px, hsl(40 45% 88%) 14px 28px)",
        }}
      >
        <Reveal className="relative w-full max-w-[1052px] mx-auto bg-white shadow-xl px-6 py-12 md:px-20 md:py-20">
          {/* Ornamental corner rules, mirroring the four rotated corner marks. */}
          {(
            [
              "top-3 left-3 md:top-5 md:left-5 border-t-2 border-l-2",
              "top-3 right-3 md:top-5 md:right-5 border-t-2 border-r-2",
              "bottom-3 left-3 md:bottom-5 md:left-5 border-b-2 border-l-2",
              "bottom-3 right-3 md:bottom-5 md:right-5 border-b-2 border-r-2",
            ] as const
          ).map((position) => (
            <span
              key={position}
              aria-hidden
              className={`pointer-events-none absolute w-10 h-10 md:w-16 md:h-16 border-avyra-coral/60 ${position}`}
            />
          ))}

          <div className="relative">
            <h2 className="font-display font-bold text-3xl md:text-5xl text-avyra-teal-deep text-center">
              {t("story.heritageTitle")}
            </h2>
            <div className="mt-6 space-y-4 text-sm md:text-base text-avyra-ink/80 leading-relaxed text-center max-w-2xl mx-auto">
              <p>{t("story.heritage1")}</p>
              <p>{t("story.heritage2")}</p>
              <p>{t("story.heritage3")}</p>
              <p>{t("story.heritage4")}</p>
            </div>

            <h2 className="mt-14 font-display font-bold text-3xl md:text-5xl text-avyra-teal-deep text-center">
              {t("story.disconnectTitle")}
            </h2>
            <div className="mt-6 space-y-4 text-sm md:text-base text-avyra-ink/80 leading-relaxed text-center max-w-2xl mx-auto">
              <p>{t("story.disconnect1")}</p>
              <p>{t("story.disconnect2")}</p>
              <p>{t("story.disconnect3")}</p>
              <p>{t("story.disconnect4")}</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* PROMISE */}
      <section className="bg-avyra-cream py-24 px-6 text-center">
        <Reveal as="h2" className="font-display font-bold text-4xl md:text-6xl text-avyra-teal-deep">
          {t("story.promiseTitle")}
        </Reveal>

        <div className="mt-8 max-w-2xl mx-auto space-y-4 text-sm md:text-base text-avyra-ink/80 leading-relaxed">
          <Reveal as="p">{t("story.promise1")}</Reveal>
          <Reveal as="p" delay={0.05}>{t("story.promise2")}</Reveal>
          <Reveal as="p" delay={0.1}>{t("story.promise3")}</Reveal>
          <Reveal as="p" delay={0.15}>{t("story.promise4")}</Reveal>
          <Reveal as="p" delay={0.2} className="italic text-avyra-teal-deep font-medium">
            {t("story.promise5")}
          </Reveal>
        </div>
      </section>
    </>
  );
}
