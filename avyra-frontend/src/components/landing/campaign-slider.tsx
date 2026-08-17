"use client";

import { useEffect, useState } from "react";

/**
 * The image panel beside the order form.
 *
 * Slides are authored in Settings → Campaign Slider and arrive already ordered.
 * A single image renders as a plain picture — no timer, no dots, nothing to
 * announce — so the common case costs nothing.
 *
 * Sizing is left to `.lp-split-media`: the slides are absolutely positioned and
 * so contribute no height of their own, which is what lets the panel match the
 * order form's height rather than the tallest photo's.
 */
export function CampaignSlider({
  images,
  intervalSeconds = 5,
  alt = "",
}: {
  images: string[];
  intervalSeconds?: number;
  alt?: string;
}) {
  const [index, setIndex] = useState(0);

  // A mistyped setting should not strobe the page.
  const delay = Math.max(2, intervalSeconds) * 1000;
  const count = images.length;

  useEffect(() => {
    if (count < 2) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const id = setInterval(() => setIndex((prev) => (prev + 1) % count), delay);

    return () => clearInterval(id);
  }, [count, delay]);

  if (count === 0) return null;

  // Wrapped at render rather than corrected in an effect: the admin can remove
  // slides while the page is open, and the stored index would then point past
  // the end for one frame.
  const current = index % count;

  /**
   * Only the slide showing and its two neighbours are in the DOM.
   *
   * Every slide sits at `inset: 0` with `opacity: 0`, which means it is inside
   * the viewport — and `loading="lazy"` does not defer an image that is in the
   * viewport. So mounting all of them downloaded all of them at once: harmless
   * at three slides, several megabytes at fifty, on the one page that takes the
   * order. Three keeps the crossfade working in both directions while the page
   * costs the same whatever the shop uploads. Coming back to a slide re-mounts
   * it, but the browser has it cached by then.
   */
  const isNear = (i: number) =>
    i === current || i === (current + 1) % count || i === (current - 1 + count) % count;

  return (
    <div className="lp-slider">
      <div className="lp-slider-frame">
        {images.map((src, i) =>
          isNear(i) ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={src}
              src={src}
              alt={i === current ? alt : ""}
              className={`lp-slide ${i === current ? "on" : ""}`}
              // Only the slide actually showing is worth blocking render for.
              loading={i === current ? "eager" : "lazy"}
              aria-hidden={i !== current}
            />
          ) : null,
        )}
      </div>

      {/* Outside the frame on purpose: over the artwork they would sit on top of
          whatever the designer put along the bottom edge. */}
      {count > 1 && (
        <div className="lp-slider-dots" role="tablist" aria-label="ছবি নির্বাচন">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={`ছবি ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`lp-slider-dot ${i === current ? "on" : ""}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
