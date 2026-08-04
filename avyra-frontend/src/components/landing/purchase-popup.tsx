"use client";

import { useEffect, useMemo, useState } from "react";
import { useStorefrontSettings } from "@/lib/queries";

type Entry = { name: string; district: string };

/** Parses the admin textarea: one `নাম | জেলা` per line, blanks skipped. */
function parseEntries(raw: string | undefined): Entry[] {
  return (raw ?? "")
    .split("\n")
    .map((line) => {
      const [name, district] = line.split("|").map((part) => part.trim());
      return name ? { name, district: district ?? "" } : null;
    })
    .filter((entry): entry is Entry => entry !== null);
}

const FIRST_DELAY_MS = 6000;
const VISIBLE_MS = 6000;

/**
 * Ambient social proof: "মহিউদ্দিন, টাঙ্গাইল — একটু আগে অর্ডার করেছেন".
 *
 * The names are staff-written in Settings, never real customer records, so no
 * personal data is exposed. Deliberately not `sonner`: that Toaster is mounted
 * globally at top-center for action feedback, and a decorative marketing card
 * appearing there would collide with real success and error messages.
 */
export function PurchasePopup() {
  const { data: settings } = useStorefrontSettings();
  const config = settings?.purchase_popup;

  const entries = useMemo(() => parseEntries(config?.entries), [config?.entries]);

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const enabled = Boolean(config?.enabled) && entries.length > 0 && !dismissed;
  // Guard against a mistyped setting pinning the popup permanently on screen.
  const intervalMs = Math.max(8, config?.interval_seconds ?? 25) * 1000;

  useEffect(() => {
    if (!enabled) return;

    let hideTimer: ReturnType<typeof setTimeout>;

    // Advance only once the card has hidden, so the list starts at the first
    // entry the admin typed rather than the second.
    const show = () => {
      setVisible(true);

      hideTimer = setTimeout(() => {
        setVisible(false);
        setIndex((prev) => (prev + 1) % entries.length);
      }, VISIBLE_MS);
    };

    const firstTimer = setTimeout(show, FIRST_DELAY_MS);
    const cycle = setInterval(show, intervalMs);

    return () => {
      clearTimeout(firstTimer);
      clearTimeout(hideTimer);
      clearInterval(cycle);
    };
  }, [enabled, entries.length, intervalMs]);

  if (!enabled) return null;

  const entry = entries[index % entries.length];

  return (
    <div className={`lp-pop ${visible ? "on" : ""}`} aria-live="polite" aria-atomic="true">
      <span className="lp-pop-icon" aria-hidden>✓</span>

      <span className="lp-pop-body">
        {/* Names carry the weight, the connective words recede — the district is
            part of the claim, not an aside. */}
        <span className="lp-pop-line bn">
          <strong>{entry.name}</strong>
          {entry.district && (
            <>
              <span className="lp-pop-dim"> — </span>
              <strong>{entry.district}</strong>
            </>
          )}
          <span className="lp-pop-dim"> এইমাত্র অর্ডার করেছেন</span>
        </span>

        <span className="lp-pop-verified bn">
          <i aria-hidden />
          যাচাইকৃত অর্ডার • এইমাত্র
        </span>
      </span>

      <button
        type="button"
        className="lp-pop-close"
        onClick={() => setDismissed(true)}
        aria-label="বন্ধ করুন"
      >
        ✕
      </button>
    </div>
  );
}
