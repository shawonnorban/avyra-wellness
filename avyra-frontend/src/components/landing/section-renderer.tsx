"use client";

import { useState } from "react";
import { Countdown, Reveal, ReviewCarousel } from "@/components/landing/landing-chrome";
import { LandingOrderForm } from "@/components/landing/landing-order-form";
import type { LandingPage, LandingSection } from "@/lib/types";
import { youtubeEmbed } from "@/lib/youtube";

/**
 * Renders one block from the admin landing-page builder. Unknown block types are
 * skipped silently so an older published page never breaks after the builder
 * gains a new section type.
 */
export function SectionRenderer({
  section,
  page,
  onCtaClick,
  onOpenImage,
}: {
  section: LandingSection;
  page: LandingPage;
  onCtaClick: () => void;
  onOpenImage: (src: string) => void;
}) {
  // `richtext` has no heading, so the union needs an `in` check before the switch.
  const heading = "heading" in section && typeof section.heading === "string" ? section.heading : "";

  switch (section.type) {
    case "hero": {
      const image = typeof section.image === "string" ? section.image : null;

      return (
        <section className="hero">
          {image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={image} alt="" className="hero-img" />
          )}

          <div className="hero-content">
            {heading && <h2 className="hero-title bn">{heading}</h2>}

            {typeof section.sub === "string" && section.sub && (
              <p
                className="bn"
                style={{ color: "rgba(255,255,255,0.82)", fontSize: 15, marginBottom: 18, lineHeight: 1.75 }}
              >
                {section.sub}
              </p>
            )}

            <button type="button" className="hero-cta bn" onClick={onCtaClick}>
              🛒 {typeof section.cta === "string" && section.cta ? section.cta : page.cta_text}
            </button>
          </div>
        </section>
      );
    }

    case "features": {
      const items = Array.isArray(section.items)
        ? (section.items as { title?: string; body?: string }[])
        : [];

      if (items.length === 0) return null;

      return (
        <SectionShell>
          <Reveal>
            <div className="sec-hd">
              <div className="sec-badge sec-badge-green">✨ কেন নেবেন</div>
              {heading && <h2 className="sec-title bn">{heading}</h2>}
            </div>

            <div className="prod-grid">
              {items.map((item, i) => (
                <div key={i} className="card" style={{ padding: 24 }}>
                  <h3 className="bn" style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                    {item.title}
                  </h3>
                  {item.body && (
                    <p className="bn" style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.8 }}>
                      {item.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </SectionShell>
      );
    }

    case "richtext": {
      const html = typeof section.html === "string" ? section.html : "";
      if (!html) return null;

      return (
        <SectionShell>
          <Reveal>
            <div className="card vc-text" style={{ padding: "36px 40px" }}>
              {heading && <h2 className="bn">{heading}</h2>}
              {/* Authored by staff in the admin editor, never by visitors. */}
              <div className="body bn" dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          </Reveal>
        </SectionShell>
      );
    }

    case "video": {
      const url = typeof section.url === "string" ? section.url : "";
      if (!url) return null;

      return (
        <SectionShell>
          <Reveal>
            {heading && (
              <div className="sec-hd">
                <h2 className="sec-title bn">{heading}</h2>
              </div>
            )}

            <div className="card vc-video" style={{ maxWidth: 1000, margin: "0 auto" }}>
              <iframe
                src={youtubeEmbed(url)}
                style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                allowFullScreen
                allow="autoplay; encrypted-media"
                title={heading || "Video"}
              />
            </div>
          </Reveal>
        </SectionShell>
      );
    }

    case "gallery": {
      const images = Array.isArray(section.images) ? (section.images as string[]) : [];
      if (images.length === 0) return null;

      // First image is the wide banner; the next four sit in a row beneath it.
      const [hero, ...rest] = images;
      const row = rest.slice(0, 4);

      return (
        <section className="sec" style={{ paddingTop: 28, paddingBottom: 28 }}>
          <Reveal>
            {heading && (
              <div className="sec-hd">
                <div className="sec-badge sec-badge-blue">📸 গ্যালারি</div>
                <h2 className="sec-title bn">{heading}</h2>
              </div>
            )}

            <button
              type="button"
              className="lp-gallery-hero"
              onClick={() => onOpenImage(hero)}
              aria-label="ব্যানার ছবি দেখুন"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={hero} alt="" loading="lazy" />
            </button>

            {row.length > 0 && (
              <div className="lp-gallery-row">
                {row.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    className="gal-item"
                    onClick={() => onOpenImage(src)}
                    aria-label={`ছবি ${i + 2} দেখুন`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" loading="lazy" />
                    <div className="gal-ov" aria-hidden>🔍</div>
                  </button>
                ))}
              </div>
            )}
          </Reveal>
        </section>
      );
    }

    case "reviews": {
      const images = Array.isArray(section.images) ? (section.images as string[]) : [];
      if (images.length === 0) return null;

      return (
        <SectionShell>
          <Reveal>
            <div className="sec-hd">
              <div className="sec-badge sec-badge-amber">⭐ কাস্টমার রিভিউ</div>
              {heading && <h2 className="sec-title bn">{heading}</h2>}
            </div>

            <div className="card" style={{ padding: 20 }}>
              <ReviewCarousel images={images} onOpen={onOpenImage} />
            </div>
          </Reveal>
        </SectionShell>
      );
    }

    case "countdown": {
      if (!page.countdown_end) return null;

      return (
        <SectionShell>
          <Reveal>
            <Countdown endDate={page.countdown_end} />
          </Reveal>
        </SectionShell>
      );
    }

    case "faq": {
      const items = Array.isArray(section.items) ? (section.items as { q?: string; a?: string }[]) : [];
      const answered = items.filter((item) => item.q?.trim());

      if (answered.length === 0) return null;

      return (
        <SectionShell>
          <Reveal>
            <div className="sec-hd">
              <h2 className="sec-title bn">{heading || "সাধারণ জিজ্ঞাসা"}</h2>
            </div>
            <FaqList items={answered} />
          </Reveal>
        </SectionShell>
      );
    }

    case "order_form":
      return (
        <section id="order-form" className="sec" style={{ scrollMarginTop: 16, paddingBottom: 36 }}>
          <Reveal>
            <LandingOrderForm page={page} />
          </Reveal>
        </section>
      );

    default:
      return null;
  }
}

function SectionShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="sec" style={{ paddingTop: 36, paddingBottom: 36 }}>
      {children}
    </section>
  );
}

function FaqList({ items }: { items: { q?: string; a?: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="faq-list">
      {items.map((item, i) => {
        const isOpen = open === i;

        return (
          <div key={i} className={`faq-item ${isOpen ? "open" : ""}`}>
            <button
              type="button"
              className="faq-btn"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className="faq-q">
                <span className="faq-num">{String(i + 1).padStart(2, "0")}</span>
                {item.q}
              </span>
              <span className={`faq-icon ${isOpen ? "open" : ""}`} aria-hidden>+</span>
            </button>

            <div className={`faq-body ${isOpen ? "open" : ""}`}>
              <div className="faq-ans">{item.a}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
