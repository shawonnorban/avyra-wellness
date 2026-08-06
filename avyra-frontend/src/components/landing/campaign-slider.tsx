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

  return (
    <div className="lp-slider">
      {images.map((src, i) => (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={src}
          src={src}
          alt={i === current ? alt : ""}
          className={`lp-slide ${i === current ? "on" : ""}`}
          // Only the first slide is worth blocking render for.
          loading={i === 0 ? "eager" : "lazy"}
          aria-hidden={i !== current}
        />
      ))}

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
