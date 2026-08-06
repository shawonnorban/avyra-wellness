"use client";

import { useRef } from "react";
import { AvyraFooter } from "@/components/avyra/avyra-footer";
import { CustomerReviews } from "@/components/avyra/customer-reviews";
import {
  AvyraFaq,
  BuyHrefProvider,
  HomeFromNature,
  HomeJustBegin,
  HomeProductShowcase,
  HomeReconnect,
} from "@/components/avyra/home-sections";
import { FacebookPixel } from "@/components/facebook-pixel";
import { LanguageLock } from "@/components/language-provider";
import { CampaignSlider } from "@/components/landing/campaign-slider";
import { LpTopHeader, Reveal, ScrollTopButton } from "@/components/landing/landing-chrome";
import { CampaignOrderForm } from "@/components/landing/landing-order-form";
import { PurchasePopup } from "@/components/landing/purchase-popup";
import { useProduct, useStorefrontSettings } from "@/lib/queries";
import { youtubeEmbed } from "@/lib/youtube";
import { PRODUCT_SLUG, VIDEO_URL, copy } from "./copy";
import "../lp/landing.css";

/**
 * Standalone Vital Plus campaign page. It borrows the `.lp` design system from
 * the landing pages but has a fixed layout of its own and no `landing_pages`
 * row — the copy lives in ./copy.ts.
 *
 * It sits outside the (storefront) route group on purpose, so none of the brand
 * header or navigation is applied; only the footer is shared.
 */
export function CampaignPage() {
  const { data: product } = useProduct(PRODUCT_SLUG);
  const { data: settings } = useStorefrontSettings();

  const orderRef = useRef<HTMLElement>(null);

  const scrollToForm = () => orderRef.current?.scrollIntoView({ behavior: "smooth" });

  const scrollText = settings?.company?.scroll_text ?? "";

  // Admin-authored slides win; with none set the product's own photo stands in,
  // so the panel is never empty on a fresh install.
  const slider = settings?.campaign_slider;
  const slides = slider?.image_urls?.length
    ? slider.image_urls
    : [product?.images?.[0]].filter((src): src is string => Boolean(src));

  return (
    /* Bengali regardless of the site-wide toggle — the campaign copy only exists
       in Bengali, and the default for a first-time visitor is English.
       `lp-bn` applies the Bengali face without touching html[lang]. */
    <LanguageLock lang="bn">
    <div className="lp lp-wide lp-bn">
      {/* Ad traffic lands here, so this is one of the two pages that carry the
          pixel. The storefront and admin deliberately do not. */}
      <FacebookPixel />

      <LpTopHeader
        logo="/avyra/lp-logo.png"
        wordmark="/avyra/lp-banner.png"
        title={copy.header.slogan}
        patternUrl="/avyra/lp-topbg.png"
      />

      {scrollText && <div className="ann bn">{scrollText}</div>}

      {/* ── Copy beside the order form ── */}
      <section
        ref={orderRef}
        id="order-form"
        className="sec"
        style={{ scrollMarginTop: 16, paddingTop: 10, paddingBottom: 32 }}
      >
        <Reveal>
          <div className="lp-split">
            {/* A direct grid child, so it stretches to the order form's height. */}
            {slides.length > 0 && (
              <div className="lp-split-media">
                <CampaignSlider
                  images={slides}
                  intervalSeconds={slider?.interval_seconds ?? 5}
                  alt={product?.name ?? ""}
                />
              </div>
            )}

            {/* Mounted only once the product exists: the form seeds its selected
                variant from props, so mounting it empty would leave nothing
                selected and fall back to the product's base price. */}
            {product ? (
              <CampaignOrderForm product={product} />
            ) : (
              <div className="card" style={{ display: "grid", placeItems: "center", minHeight: 320 }}>
                <span
                  role="status"
                  aria-label="লোড হচ্ছে"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "3px solid rgba(232,37,58,0.15)",
                    borderTopColor: "var(--red)",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
              </div>
            )}
          </div>
        </Reveal>
      </section>

      {/* ── Who it is not for ── */}
      <CardSection
        badge={copy.reality.badge}
        badgeTone="red"
        tone="coral"
        title={copy.reality.title}
        titleAccent={copy.reality.titleAccent}
        description={copy.reality.description}
        cards={copy.reality.cards}
        onOrder={scrollToForm}
      />

      {/* ── What it actually is ── */}
      <CardSection
        badge={copy.benefits.badge}
        badgeTone="green"
        tone="teal"
        title={copy.benefits.title}
        titleAccent={copy.benefits.titleAccent}
        description={copy.benefits.description}
        cards={copy.benefits.cards}
        onOrder={scrollToForm}
      />

      {/* ── The routine, step by step ── */}
      <section className="sec" style={{ paddingTop: 36, paddingBottom: 36 }}>
        <Reveal className="lp-stagger">
          <div className="lp-panel lp-panel-cream">
            <div className="sec-hd">
              <div className="sec-badge sec-badge-blue">🗓️ {copy.plan.badge}</div>
              <h2 className="sec-title bn">
                <span>{copy.plan.title}</span>
                <span className="lp-t-accent">{copy.plan.titleAccent}</span>
              </h2>
              <p className="sec-sub bn">{copy.plan.description}</p>
            </div>

            <div className="lp-plan">
              {copy.plan.steps.map((step, i) => (
                <div key={step.title} className="lp-plan-item">
                  <div className="lp-plan-card">
                    <h3 className="bn">
                      <span>{step.title}</span>
                      <span className="lp-t-accent">{step.titleAccent}</span>
                    </h3>
                    <p className="bn">{step.body}</p>
                  </div>
                  <span className="lp-plan-num" aria-hidden>{i + 1}</span>
                </div>
              ))}
            </div>

            <SectionCta onOrder={scrollToForm} />
          </div>
        </Reveal>
      </section>

      {/* ── Video ── */}
      {VIDEO_URL && (
        <section className="sec" style={{ paddingTop: 36, paddingBottom: 36 }}>
          <Reveal>
            <div className="sec-hd">
              <h2 className="sec-title bn">{copy.video.title}</h2>
            </div>

            <div className="card vc-video" style={{ maxWidth: 1120, margin: "0 auto" }}>
              <iframe
                src={youtubeEmbed(VIDEO_URL)}
                style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                allowFullScreen
                allow="autoplay; encrypted-media"
                title={copy.video.title}
              />
            </div>
          </Reveal>
        </section>
      )}

      {/* ── Brand storefront sections, reused verbatim from the home page ──
          `font-sans` restores the brand typeface: `.lp` sets Sora for the campaign
          layout, which would otherwise cascade into these.
          Their buy buttons point at this page's own form rather than
          /shop/vital-plus, so a click never leaves the campaign. */}
      <BuyHrefProvider href="#order-form">
        <div className="font-sans">
          <HomeFromNature />
          <HomeProductShowcase />
          <HomeReconnect />
          <HomeJustBegin />
          <CustomerReviews />
          <AvyraFaq />
        </div>
      </BuyHrefProvider>

      <Reveal>
        <div className="prefooter">
          <p className="prefooter-heading bn">
            {copy.prefooter.headingTop}
            <br />
            <em>{copy.prefooter.headingAccent}</em>
          </p>

          <button type="button" className="prefooter-pill bn" onClick={scrollToForm}>
            <span className="prefooter-pill-icon" aria-hidden>🛒</span>
            {copy.prefooter.cta}
          </button>

          <div className="prefooter-features">
            {copy.prefooter.features.map((feature) => (
              <div key={feature.title} className="prefooter-feat">
                <div className="prefooter-feat-icon" aria-hidden>{feature.icon}</div>
                <div className="prefooter-feat-text">
                  <strong
                    className="bn"
                    style={{ display: "block", color: "var(--ink)", fontSize: 13, marginBottom: 3 }}
                  >
                    {feature.title}
                  </strong>
                  <span className="bn" style={{ fontSize: 12, color: "var(--muted)" }}>
                    {feature.sub}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <AvyraFooter />

      <div className="lp-sticky-cta">
        <button type="button" className="cta bn" onClick={scrollToForm}>
          {copy.stickyCta}
        </button>
      </div>

      <ScrollTopButton />
      <PurchasePopup />
    </div>
    </LanguageLock>
  );
}

/** Repeated below each of the three panels, so the form is never far away. */
function SectionCta({ onOrder }: { onOrder: () => void }) {
  return (
    <div className="lp-sec-cta">
      <button type="button" className="lp-order-btn bn" onClick={onOrder}>
        <span aria-hidden>🛒</span>
        {copy.prefooter.cta}
      </button>
    </div>
  );
}

/** The 3-card and 6-card sections differ only in their content. */
function CardSection({
  badge,
  badgeTone,
  tone,
  title,
  titleAccent,
  description,
  cards,
  onOrder,
}: {
  badge: string;
  badgeTone: "red" | "green";
  tone: "coral" | "teal" | "cream";
  title: string;
  titleAccent: string;
  description: string;
  cards: readonly { icon: string; title: string; titleAccent: string; body: string }[];
  onOrder: () => void;
}) {
  return (
    <section className="sec" style={{ paddingTop: 36, paddingBottom: 36 }}>
      <Reveal className="lp-stagger">
        <div className={`lp-panel lp-panel-${tone}`}>
          <div className="sec-hd">
            <div className={`sec-badge sec-badge-${badgeTone}`}>{badge}</div>
            <h2 className="sec-title bn">
              <span>{title}</span>
              <span className="lp-t-accent">{titleAccent}</span>
            </h2>
            <p className="sec-sub bn">{description}</p>
          </div>

          <div className="lp-card-grid">
            {cards.map((card) => (
              <div key={card.title} className="lp-info-card">
                <div className="lp-info-icon" aria-hidden>{card.icon}</div>
                {/* Two lines, two colours — the accent half carries the point. */}
                <h3 className="bn">
                  <span>{card.title}</span>
                  <span className="lp-t-accent">{card.titleAccent}</span>
                </h3>
                <p className="bn">{card.body}</p>
              </div>
            ))}
          </div>

          <SectionCta onOrder={onOrder} />
        </div>
      </Reveal>
    </section>
  );
}
