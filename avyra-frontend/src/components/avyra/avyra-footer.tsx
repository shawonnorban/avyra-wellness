"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { useRef } from "react";
import { useLanguage } from "@/components/language-provider";
import { useStorefrontSettings } from "@/lib/queries";

const SOCIAL_PATHS = {
  facebook:
    "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  instagram:
    "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  youtube:
    "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  tiktok:
    "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.37-.01-.74-.01-1.11h4.03c.01 1.54.88 2.99 2.26 3.7.66.35 1.43.48 2.18.43.78-.07 1.53-.41 2.09-.98.54-.55.84-1.31.88-2.09.06-1.17-.01-2.34.03-3.51.01-.31-.07-.62-.21-.89-.31-.56-.88-.94-1.52-1.06-.35-.06-.71-.05-1.06-.02-.59.06-1.15.26-1.64.58-.68.44-1.18 1.11-1.4 1.89-.08.29-.1.59-.09.89H4.65c.02-1.66.63-3.28 1.7-4.55 1.39-1.66 3.57-2.66 5.78-2.63.68.01 1.36.1 2.01.29.05-1.64-.01-3.28.03-4.92z",
} as const;

type SocialKey = keyof typeof SOCIAL_PATHS;

export function AvyraFooter() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1.04]);
  const y = useTransform(scrollYProgress, [0, 1], [40, 0]);

  const { data: settings } = useStorefrontSettings();
  const { t } = useLanguage();

  const company = settings?.company;
  const social = company?.social;
  const email = company?.email || "info@avyrabd.com";
  const phone = company?.phone || "+01717-000000";
  const whatsapp = company?.whatsapp?.replace(/\D/g, "");

  // Built from whichever company fields the admin has filled in.
  const brandBlurb =
    [company?.name, company?.tagline, company?.slogan].filter(Boolean).join("\n") || null;

  return (
    <footer ref={ref} className="relative mt-24 avyra-footer-gradient text-white overflow-hidden">
      {/* Subtle dotted texture over the radial gradient. */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-8 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1 flex flex-row md:flex-col items-start gap-4 md:gap-3">
          {company?.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logo_url}
              alt={company.name}
              className="w-16 h-16 md:w-12 md:h-12 shrink-0 object-contain brightness-0 invert"
            />
          )}
          {/* Company name / tagline / slogan come from settings; the translated
              block is the fallback when an admin has not filled them in. */}
          <p className="text-sm leading-relaxed text-white/90 whitespace-pre-line">
            {brandBlurb ?? t("footer.tagline")}
          </p>
        </div>

        <div className="space-y-3 md:space-y-2 text-sm">
          <Link href="/" className="block text-white/90 hover:text-white">{t("nav.home")}</Link>
          <Link href="/vital-plus" className="block text-white/90 hover:text-white">{t("nav.vitalPlus")}</Link>
          <Link href="/about" className="block text-white/90 hover:text-white">{t("nav.ourStory")}</Link>
        </div>

        <div className="col-span-2 md:col-span-1 flex flex-col gap-2 text-sm self-start">
          <a href={`mailto:${email}`} className="flex items-start gap-2 text-white/90 hover:text-white">
            <Mail className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="break-all">{email}</span>
          </a>

          <a href={`tel:${phone}`} className="flex items-center gap-2 text-white/90 hover:text-white">
            <Phone className="w-4 h-4 shrink-0" />
            {phone}
          </a>

          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-2 text-white/90 hover:text-white"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              WhatsApp
            </a>
          )}

          {company?.address && (
            <p className="text-white/90">
              {t("footer.corporateOffice")}: {company.address}
            </p>
          )}
        </div>

        <div className="col-span-2 md:col-span-1 grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-2 text-sm">
          {(Object.keys(SOCIAL_PATHS) as SocialKey[]).map((key) => {
            const href = social?.[key];
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            const icon = (
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d={SOCIAL_PATHS[key]} />
              </svg>
            );

            return href ? (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-2 text-white/90 hover:text-white"
              >
                {icon}
                {label}
              </a>
            ) : (
              <span key={key} className="flex items-center gap-2 text-white/90">
                {icon}
                {label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Giant wordmark that grows as the footer scrolls into view. */}
      <motion.div style={{ scale, y }} className="relative px-2 select-none pointer-events-none flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/avyra/avyra-wordmark.png"
          alt="AVYRA"
          className="w-[90%] md:w-[85%] max-w-[1000px] h-auto"
          draggable={false}
        />
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pb-8 pt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-sm md:text-xs text-white/80 md:text-white/60">
        <span>
          © {new Date().getFullYear()} {company?.name ?? "Avyra"}. {t("footer.allRights")}
        </span>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          <Link href="/returns-policy" className="hover:text-white">{t("footer.returnsPolicy")}</Link>
          <Link href="/shipping-policy" className="hover:text-white">{t("footer.shippingPolicy")}</Link>
          <Link href="/terms" className="hover:text-white">{t("footer.terms")}</Link>
          <Link href="/privacy" className="hover:text-white">{t("footer.privacy")}</Link>
        </div>
      </div>
    </footer>
  );
}
