"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Round scroll control, pinned top-right.
 *
 * The bottom of the screen already belongs to the sticky order bar, so this sits
 * opposite it. It only appears once there is somewhere to go back to; while at
 * the top it stays hidden rather than offering a no-op.
 */
export function ScrollTopButton() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 400);

    onScroll(); // in case the page is restored mid-scroll
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      className={`lp-scroll-top ${shown ? "on" : ""}`}
      onClick={toTop}
      aria-label="উপরে ফিরে যান"
      aria-hidden={!shown}
      tabIndex={shown ? 0 : -1}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    </button>
  );
}

/**
 * Fades content in the first time it scrolls into view.
 *
 * `className` rides along on the same element that gets `.vis`, so a caller can
 * opt into a different treatment — `.lp-stagger` drives the children in one at a
 * time instead of fading the block as a whole.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        el.classList.add("vis");
        observer.unobserve(el);
      },
      { threshold: 0.07 },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`.trim()} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/**
 * Header strip: brand mark, product wordmark and a line of Bengali copy over the
 * tiled pattern. The pattern is supplied as a CSS variable so a missing asset
 * degrades to a plain bar rather than a broken image.
 */
export function LpTopHeader({
  logo,
  wordmark,
  title,
  patternUrl,
}: {
  logo: string | null;
  wordmark: string | null;
  title: string;
  patternUrl: string | null;
}) {
  return (
    <div className="lp-top-header-wrap">
      <div
        className="lp-top-header"
        style={
          {
            "--lp-top-bg": patternUrl ? `url(${patternUrl})` : "none",
            background: patternUrl ? undefined : "linear-gradient(90deg, #a8d5dd 0%, #d96449 100%)",
          } as React.CSSProperties
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {logo && <img src={logo} alt="Avyra" className="lp-th-logo" />}

        {/* Wordmark and slogan are one group so they can claim every pixel to the
            right of the brand mark, rather than leaving a gap at the far end. */}
        <div className="lp-th-main">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {wordmark && <img src={wordmark} alt="" className="lp-th-banner" />}
          <span className="lp-th-title">{title}</span>
        </div>
      </div>
    </div>
  );
}

const COUNTDOWN_LABELS = [
  ["d", "দিন"],
  ["h", "ঘণ্টা"],
  ["m", "মিনিট"],
  ["s", "সেকেন্ড"],
] as const;

export function Countdown({ endDate }: { endDate: string }) {
  const [remaining, setRemaining] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endDate).getTime() - Date.now();

      if (diff <= 0) {
        setExpired(true);
        return;
      }

      setRemaining({
        d: Math.floor(diff / 86_400_000),
        h: Math.floor((diff / 3_600_000) % 24),
        m: Math.floor((diff / 60_000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };

    tick();
    const id = setInterval(tick, 1000);

    return () => clearInterval(id);
  }, [endDate]);

  // A finished countdown disappears rather than sitting at zero.
  if (expired) return null;

  return (
    <div className="cdown-wrap">
      <div className="cdown-label">🔥 অফার শেষ হওয়ার আগেই অর্ডার করুন!</div>

      <div className="cdown-blocks">
        {COUNTDOWN_LABELS.map(([key, label], i) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="cdown-block">
              <span className="cdown-num">{String(remaining[key]).padStart(2, "0")}</span>
              <span className="cdown-lbl bn">{label}</span>
            </div>
            {i < COUNTDOWN_LABELS.length - 1 && <span className="cdown-sep">:</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

const TRUST_ITEMS = [
  { icon: "🚚", color: "#EFF6FF", title: "দ্রুত ডেলিভারি", sub: "২-৩ কার্যদিবসে" },
  { icon: "✅", color: "#ECFDF5", title: "১০০% অরিজিনাল", sub: "গ্যারান্টিযুক্ত পণ্য" },
  { icon: "🔄", color: "#FFF7ED", title: "সহজ রিটার্ন", sub: "৭ দিনের মধ্যে" },
  { icon: "🔒", color: "#FEF2F2", title: "নিরাপদ পেমেন্ট", sub: "এনক্রিপ্টেড সুরক্ষা" },
];

export function TrustStrip() {
  return (
    <div className="trust">
      <div className="trust-inner">
        {TRUST_ITEMS.map((item) => (
          <div key={item.title} className="trust-item">
            <div className="trust-icon" style={{ background: item.color }} aria-hidden>
              {item.icon}
            </div>
            <div className="trust-text">
              <strong className="bn">{item.title}</strong>
              <span className="bn">{item.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  // Escape closes, matching the click-outside behaviour.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="lp-lb" onClick={onClose} role="dialog" aria-modal="true" aria-label="ছবি প্রিভিউ">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" onClick={(e) => e.stopPropagation()} />
      <button type="button" className="lp-lb-x" onClick={onClose} aria-label="বন্ধ করুন">
        ✕
      </button>
    </div>
  );
}

/**
 * Review screenshots: one per view on mobile, four on desktop, auto-advancing
 * until the pointer rests on it. Prev/next arrows sit over the edges and a dot
 * per page sits underneath, as in the previous build.
 */
export function ReviewCarousel({
  images,
  onOpen,
}: {
  images: string[];
  onOpen: (src: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [perPage, setPerPage] = useState(1);

  useEffect(() => {
    const update = () => setPerPage(window.innerWidth >= 768 ? 4 : 1);

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxIndex = Math.max(0, images.length - perPage);

  useEffect(() => {
    if (paused || maxIndex === 0) return;

    const id = setInterval(() => setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1)), 3500);
    return () => clearInterval(id);
  }, [paused, maxIndex]);

  // Clamped during render rather than in an effect, so a viewport change that
  // shrinks the page count cannot momentarily scroll past the last slide.
  const safeIndex = Math.min(index, maxIndex);
  const pages = maxIndex + 1;

  const step = (direction: -1 | 1) =>
    setIndex((prev) => {
      const next = Math.min(maxIndex, Math.max(0, prev + direction));
      // Wrap at both ends so the arrows never feel dead.
      return direction === 1 && prev >= maxIndex ? 0 : direction === -1 && prev <= 0 ? maxIndex : next;
    });

  return (
    <div
      className="lp-rev"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="lp-rev-window">
        <div
          className="lp-rev-track"
          style={{ transform: `translateX(calc(-${safeIndex} * (100% + 12px) / ${perPage}))` }}
        >
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              className="gal-item"
              onClick={() => onOpen(src)}
              style={{ flex: `0 0 calc((100% - ${(perPage - 1) * 12}px) / ${perPage})` }}
              aria-label={`রিভিউ ${i + 1} দেখুন`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" />
              <div className="gal-ov" aria-hidden>🔍</div>
            </button>
          ))}
        </div>
      </div>

      {maxIndex > 0 && (
        <>
          <button
            type="button"
            className="lp-rev-arrow lp-rev-prev"
            onClick={() => step(-1)}
            aria-label="আগের রিভিউ"
          >
            ‹
          </button>
          <button
            type="button"
            className="lp-rev-arrow lp-rev-next"
            onClick={() => step(1)}
            aria-label="পরের রিভিউ"
          >
            ›
          </button>

          <div className="lp-rev-dots">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`lp-rev-dot ${i === safeIndex ? "on" : ""}`}
                onClick={() => setIndex(i)}
                aria-label={`পেজ ${i + 1}`}
                aria-current={i === safeIndex}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
