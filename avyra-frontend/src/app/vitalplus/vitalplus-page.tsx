"use client";

import { Banknote, ChevronLeft, ChevronRight, Leaf, MessageCircle, Plus, Truck, X } from "lucide-react";
import { Hind_Siliguri } from "next/font/google";
import { useRef, useState } from "react";
import { useReviewImages } from "@/components/avyra/customer-reviews";
import { LanguageLock, useLanguage } from "@/components/language-provider";
import { ViewContentTracker } from "@/components/view-content-tracker";
import { CampaignSlider } from "@/components/landing/campaign-slider";
import { CampaignOrderForm } from "@/components/landing/landing-order-form";
import { PurchasePopup } from "@/components/landing/purchase-popup";
import { pushInitiateCheckout } from "@/lib/gtm";
import { formatTaka } from "@/lib/format";
import { useProduct, useStorefrontSettings } from "@/lib/queries";
import type { ProductDetail, StorefrontSettings } from "@/lib/types";
import { youtubeEmbed } from "@/lib/youtube";
import { PRODUCT_SLUG, VIDEO_URL, copy as shared } from "../avyravitalplus/copy";
import { copy } from "./copy";
import { VpFooter } from "./vp-footer";
import "../lp/landing.css";
import "./vp.css";

const hind = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--vp-font",
});

/** Matches the seven `faq.q*` / `faq.a*` pairs in translations.ts. */
const FAQ_COUNT = 7;

function youtubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([^&\n?#]+)/);
  return match?.[1] ?? null;
}

/** Click-to-play: nothing from YouTube loads until the visitor asks for it. */
function VideoCard({ url, title }: { url: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const id = youtubeId(url);

  if (playing) {
    return (
      <iframe
        className="vp-video"
        src={`${youtubeEmbed(url)}&autoplay=1`}
        title={title}
        allow="autoplay; encrypted-media"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      className="vp-video vp-video-poster"
      aria-label={title}
      onClick={() => setPlaying(true)}
      style={id ? { backgroundImage: `url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)` } : undefined}
    >
      <span aria-hidden>▶</span>
    </button>
  );
}

/** Snap-scrolling row of review screenshots with arrows; tapping one opens it full size. */
function ReviewSlider({ images }: { images: readonly string[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<string | null>(null);
  const scrollBy = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="vp-car">
      <button type="button" className="vp-car-btn vp-car-prev" aria-label="Previous" onClick={() => scrollBy(-1)}>
        <ChevronLeft aria-hidden />
      </button>
      <div ref={track} className="vp-car-track">
        {images.map((src) => (
          <button key={src} type="button" className="vp-car-item vp-car-img" onClick={() => setOpen(src)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" />
          </button>
        ))}
      </div>
      <button type="button" className="vp-car-btn vp-car-next" aria-label="Next" onClick={() => scrollBy(1)}>
        <ChevronRight aria-hidden />
      </button>

      {open && (
        <div className="vp-lightbox" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={open} alt="" onClick={(e) => e.stopPropagation()} />
          <button type="button" aria-label="Close" onClick={() => setOpen(null)}>
            <X aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

function Faq() {
  const { t } = useLanguage();

  return (
    <div className="vp-faq">
      {Array.from({ length: FAQ_COUNT }, (_, i) => (
        <details key={i}>
          <summary>
            {t(`faq.q${i + 1}`)}
            <Plus aria-hidden />
          </summary>
          <p>{t(`faq.a${i + 1}`)}</p>
        </details>
      ))}
    </div>
  );
}

/**
 * /vitalplus — a single narrow column, even on desktop: announcement bar, hero card,
 * trust strip, video, benefit grid, rows, offer card, FAQ, a plain billing form, a
 * dark footer and a sticky price-and-order bar. Palette is Vital Plus's (see vp.css).
 * Reality-check and plan text is shared with /avyravitalplus; prices are the catalogue's.
 */
export function VitalPlusPage({
  initialProduct,
  initialSettings,
}: {
  initialProduct?: ProductDetail;
  initialSettings?: StorefrontSettings;
}) {
  const { data: productData, isError, refetch } = useProduct(PRODUCT_SLUG);
  const { data: settingsData } = useStorefrontSettings();
  const product = productData ?? initialProduct;
  const settings = settingsData ?? initialSettings;
  const { data: reviewData } = useReviewImages();
  const reviewImages = reviewData ?? [];
  const orderRef = useRef<HTMLElement>(null);

  // Every order button lands on the form; pressing one is intent, not submission.
  const scrollToForm = () => {
    pushInitiateCheckout(product);
    orderRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const currency = settings?.company?.currency_symbol ?? "৳";
  const slider = settings?.campaign_slider;
  const slides = slider?.image_urls?.length
    ? slider.image_urls
    : [product?.images?.[0] ?? "/avyra/vital-plus-hero.webp"];
  const offerImage = product?.images?.[1] ?? "/avyra/vital-plus-jar.webp";
  const variants = product?.variants ?? [];
  const packs = product?.pack_options ?? [];
  const price = product?.price ?? null;
  const was = variants[0]?.compare_at_price ?? null;
  const whatsapp = settings?.company?.whatsapp?.replace(/\D/g, "");
  const announcement = settings?.company?.scroll_text?.trim() || copy.announcement;

  return (
    <LanguageLock lang="bn">
      <div className={`vp ${hind.variable}`}>
        <ViewContentTracker
          productId={product?.id}
          productName={product?.name}
          value={product?.price}
        />

        <div className="vp-col">
          {/* ── Announcement ── */}
          <div className="vp-announce">{announcement}</div>

          {/* ── Hero card ── */}
          <section className="vp-hero">
            {/* Staff-set slides (Settings → Campaign Slider); the product photo stands in until there are any. */}
            <div className="lp vp-slider">
              <CampaignSlider
                images={slides}
                intervalSeconds={settings?.campaign_slider?.interval_seconds ?? 5}
                alt={product?.name ?? "Vital Plus"}
              />
            </div>
            <div className="vp-hero-body">
              <h1>{copy.hero.title}</h1>
              <p>{copy.hero.sub}</p>
              <button type="button" className="vp-btn vp-btn-amber" onClick={scrollToForm}>
                {copy.cta}
              </button>
            </div>
          </section>

          {/* ── Trust strip ── */}
          <section className="vp-strip">
            <div>
              <span><Leaf aria-hidden /></span>
              {copy.trust[0]}
            </div>
            <div>
              <span><Banknote aria-hidden /></span>
              {copy.trust[1]}
            </div>
            <div>
              <span><Truck aria-hidden /></span>
              {copy.trust[2]}
            </div>
            <p>{copy.trustLine}</p>
          </section>

          {/* ── Video ── */}
          {VIDEO_URL && (
            <section className="vp-sec">
              <h2 className="vp-title vp-title-red">{copy.videoTitle}</h2>
              <VideoCard url={VIDEO_URL} title={copy.videoTitle} />
            </section>
          )}

          {/* ── Benefits: two-column card grid ── */}
          <section className="vp-sec vp-tint">
            <h2 className="vp-title">{copy.benefits.title}</h2>
            <div className="vp-grid">
              {copy.benefits.items.map((item) => (
                <div key={item.text} className="vp-gcard">
                  <span aria-hidden>{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </section>

          {/* ── Problem statement ── */}
          <section className="vp-sec">
            <h2 className="vp-title">{copy.problem.title}</h2>
            <p className="vp-sub">{copy.problem.sub}</p>
            <div className="vp-list">
              {copy.problem.items.map((item) => (
                <div key={item.title} className="vp-item">
                  <span className="vp-dot" aria-hidden>{item.icon}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.body}</small>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Customer reviews: the screenshots set on the landing pages ── */}
          {reviewImages.length > 0 && (
            <section className="vp-sec vp-tint vp-center">
              <span className="vp-badge">★ {copy.reviews.badge}</span>
              <h2 className="vp-title">{copy.reviews.title}</h2>
              <p className="vp-sub">{copy.reviews.sub}</p>
              <ReviewSlider images={reviewImages} />
            </section>
          )}

          {/* ── Ingredients ── */}
          <section className="vp-sec vp-tint">
            <h2 className="vp-title">{copy.ingredients.title}</h2>
            <div className="vp-ing">
              {copy.ingredients.items.map((item, i) => (
                <div key={i} className="vp-ing-item">
                  {item.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.img} alt={item.name} loading="lazy" />
                  ) : (
                    <span className="vp-ing-emoji" aria-hidden>{item.emoji}</span>
                  )}
                  <strong>{item.name}</strong>
                </div>
              ))}
            </div>
            <div className="vp-more">
              <p>{copy.ingredients.moreTitle}</p>
              <div className="vp-chips">
                {copy.ingredients.more.map((name, i) => (
                  <span key={i}>{name}</span>
                ))}
              </div>
            </div>
          </section>

          {/* ── Reality check: titles only ── */}
          <section className="vp-sec">
            <h2 className="vp-title">{copy.reality.title}</h2>
            <div className="vp-list">
              {shared.reality.cards.map((card) => (
                <div key={card.title} className="vp-item vp-item-slim">
                  <span className="vp-dot vp-dot-warm" aria-hidden>{card.icon}</span>
                  <div>
                    <strong>{card.title} {card.titleAccent}</strong>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── 4-week plan ── */}
          <section className="vp-sec vp-tint">
            <h2 className="vp-title">{copy.plan.title}</h2>
            <div className="vp-list">
              {shared.plan.steps.map((step, i) => (
                <div key={step.title} className="vp-item">
                  <span className="vp-dot" aria-hidden>{i + 1}</span>
                  <div>
                    <strong>{step.title} — {step.titleAccent}</strong>
                    <small>{step.body}</small>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Special offer card ── */}
          <section className="vp-sec">
            <div className="vp-offer">
              <span className="vp-offer-label">★ {copy.offer.label}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={offerImage} alt={product?.name ?? "Vital Plus"} loading="lazy" />

              <ul>
                {variants.map((v) => (
                  <li key={v.id}>
                    <span className="vp-li-ico" aria-hidden>●</span>
                    <div>
                      <strong>
                        {product?.name}
                        {[v.size, v.color].filter(Boolean).length > 0 &&
                          ` ${[v.size, v.color].filter(Boolean).join(" · ")}`}
                      </strong>
                      {v.compare_at_price != null && v.compare_at_price > v.price && (
                        <small><s>{formatTaka(v.compare_at_price, currency)}</s></small>
                      )}
                    </div>
                    <b>{formatTaka(v.price, currency)}</b>
                  </li>
                ))}
                {packs.map((p) => (
                  <li key={p.label}>
                    <span className="vp-li-ico" aria-hidden>●</span>
                    <div><strong>{p.label}</strong></div>
                    {p.price != null && <b>{formatTaka(p.price, currency)}</b>}
                  </li>
                ))}
                <li>
                  <span className="vp-li-ico" aria-hidden>৳</span>
                  <div>
                    <strong>{copy.offer.cod.title}</strong>
                    <small>{copy.offer.cod.sub}</small>
                  </div>
                  <em>{copy.offer.cod.tag}</em>
                </li>
              </ul>

              {price != null && (
                <div className="vp-total">
                  {was != null && was > price && <s>{formatTaka(was, currency)}</s>}
                  <span>{copy.offer.total}</span>
                  <b>{formatTaka(price, currency)}</b>
                </div>
              )}

              <button type="button" className="vp-btn vp-btn-dark" onClick={scrollToForm}>
                {copy.offer.cta}
              </button>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section className="vp-sec">
            <h2 className="vp-title vp-title-line">{copy.faq.title}</h2>
            <Faq />
          </section>

          {/* ── Order form ── */}
          <section ref={orderRef} id="order-form" className="vp-sec" style={{ scrollMarginTop: 16 }}>
            <div className="lp vp-form">
              {product ? (
                <CampaignOrderForm product={product} />
              ) : (
                <div className="vp-state" role="status">
                  {isError ? (
                    <>
                      <p>{copy.form.unavailable}</p>
                      <button type="button" className="vp-btn vp-btn-dark" onClick={() => refetch()}>
                        {copy.form.retry}
                      </button>
                    </>
                  ) : (
                    <p>…</p>
                  )}
                </div>
              )}
            </div>
          </section>

          <VpFooter settings={settings} />

          <p className="vp-disclaimer">{copy.disclaimer}</p>
        </div>

        {/* ── Floating WhatsApp button; shown only when a number is set in Settings → Company ── */}
        {whatsapp && (
          <a
            className="vp-wa"
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="WhatsApp"
          >
            <MessageCircle aria-hidden />
          </a>
        )}

        {/* ── Sticky price + order bar ── */}
        <div className="vp-sticky">
          <div className="vp-sticky-in">
            <button type="button" className="vp-btn vp-btn-dark" onClick={scrollToForm}>
              {copy.cta}
            </button>
          </div>
        </div>

        <PurchasePopup />
      </div>
    </LanguageLock>
  );
}
