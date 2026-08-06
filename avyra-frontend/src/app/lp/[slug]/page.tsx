"use client";

import { use, useEffect, useRef, useState } from "react";
import { AvyraFooter } from "@/components/avyra/avyra-footer";
import { Lightbox, LpTopHeader, Reveal, TrustStrip } from "@/components/landing/landing-chrome";
import { LandingOrderForm } from "@/components/landing/landing-order-form";
import { SectionRenderer } from "@/components/landing/section-renderer";
import { ViewContentTracker } from "@/components/view-content-tracker";
import { getAttribution } from "@/lib/attribution";
import { trackLandingEvent, useLandingPage, useStorefrontSettings } from "@/lib/queries";
import "../landing.css";

const PREFOOTER_FEATURES = [
  { icon: "🚚", title: "দ্রুত ডেলিভারি", sub: "২-৩ কার্যদিবসে পৌঁছে যাবে" },
  { icon: "✅", title: "১০০% অরিজিনাল", sub: "প্রাকৃতিক পণ্য" },
  { icon: "🔄", title: "সহজ রিটার্ন", sub: "৭ দিনের মধ্যে রিটার্ন" },
  { icon: "🔒", title: "নিরাপদ পেমেন্ট", sub: "সম্পূর্ণ সুরক্ষিত" },
];

export default function LandingPageView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: page, isLoading, isError } = useLandingPage(slug);
  const { data: settings } = useStorefrontSettings();

  const orderRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  // Record the view once the page resolves, with whatever campaign parameters
  // brought the visitor here.
  useEffect(() => {
    if (!page) return;

    const { utm_source, utm_medium, utm_campaign } = getAttribution();
    trackLandingEvent(page.slug, "view", { utm_source, utm_medium, utm_campaign });
  }, [page]);

  // Landing pages are authored by staff and fully dynamic, so the title is set
  // client-side rather than through a static metadata export.
  useEffect(() => {
    if (page) document.title = `${page.meta_title ?? page.title} | Avyra Wellness`;
  }, [page]);

  const scrollToForm = () => {
    if (!page) return;

    trackLandingEvent(page.slug, "cta_click");

    if (page.cta_type === "phone" && page.cta_value) {
      window.location.href = `tel:${page.cta_value}`;
      return;
    }

    if (page.cta_type === "link" && page.cta_value) {
      window.location.href = page.cta_value;
      return;
    }

    (document.getElementById("order-form") ?? orderRef.current)?.scrollIntoView({ behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="lp" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 44,
              height: 44,
              border: "3px solid rgba(232,37,58,0.12)",
              borderTopColor: "#E8253A",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p className="bn" style={{ color: "#94A3B8", fontSize: 14 }}>লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="lp" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }} aria-hidden>🔍</div>
          <p className="bn" style={{ color: "#94A3B8", fontSize: 15 }}>পেজটি খুঁজে পাওয়া যাচ্ছে না</p>
        </div>
      </div>
    );
  }

  const sections = page.sections ?? [];
  // Every campaign page must be able to take an order, even if the editor never
  // placed an explicit order_form block.
  const hasOrderForm = sections.some((section) => section.type === "order_form");

  const company = settings?.company;
  const scrollText = company?.scroll_text ?? "";

  return (
    <div className="lp">
      <ViewContentTracker
        productId={page.product?.id}
        productName={page.product?.name}
        value={page.product?.price}
      />

      <LpTopHeader
        logo="/avyra/lp-logo.png"
        wordmark="/avyra/lp-banner.png"
        title="এর এনার্জেটিক দুনিয়ায় স্বাগতম"
        patternUrl="/avyra/lp-topbg.png"
      />

      {scrollText && <div className="ann bn">{scrollText}</div>}

      {/* The trust strip is opt-in per campaign; the flagship page omits it. */}
      {page.show_header && <TrustStrip />}

      {/* Page-level hero, above the authored blocks. */}
      {(page.headline || page.hero_image) && (
        <section className="hero">
          {page.hero_image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={page.hero_image} alt="" className="hero-img" />
          )}

          <div className="hero-content">
            {page.headline && <h1 className="hero-title bn">{page.headline}</h1>}

            {page.sub_headline && (
              <p
                className="bn"
                style={{ color: "rgba(255,255,255,0.82)", fontSize: 15, marginBottom: 18, lineHeight: 1.75 }}
              >
                {page.sub_headline}
              </p>
            )}

            <button type="button" className="hero-cta bn" onClick={scrollToForm}>
              🛒 {page.cta_text}
            </button>
          </div>
        </section>
      )}

      {/* The order form leads unless the editor placed it somewhere specific. */}
      {!hasOrderForm && (
        <section
          id="order-form"
          ref={orderRef}
          className="sec"
          style={{ scrollMarginTop: 16, paddingTop: 24, paddingBottom: 32 }}
        >
          <Reveal>
            <LandingOrderForm page={page} />
          </Reveal>
        </section>
      )}

      {sections.map((section, i) => (
        <SectionRenderer
          key={`${section.type}-${i}`}
          section={section}
          page={page}
          onCtaClick={scrollToForm}
          onOpenImage={setLightbox}
        />
      ))}

      <Reveal>
        <div className="prefooter">
          <p className="prefooter-heading bn">
            দেরি না করে,
            <br />
            <em>এখনই অর্ডার দিন!</em>
          </p>

          <button type="button" className="prefooter-pill bn" onClick={scrollToForm}>
            <span className="prefooter-pill-icon" aria-hidden>🛒</span>
            অর্ডার করুন
          </button>

          <div className="prefooter-features">
            {PREFOOTER_FEATURES.map((feature) => (
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

      {/* Campaign pages close with the brand footer, not a landing-specific one. */}
      <AvyraFooter />

      {/* Sticky CTA keeps the form one tap away on mobile. */}
      <div className="lp-sticky-cta">
        <button type="button" className="cta bn" onClick={scrollToForm}>
          🛒 এখনই অর্ডার করুন
        </button>
      </div>

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

