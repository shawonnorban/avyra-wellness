"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import api from "@/lib/api";
import { getAttribution } from "@/lib/attribution";

/** Admin traffic is not site traffic; the API rejects these too. */
const PRIVATE_PREFIXES = ["/admin", "/login", "/auth"];

/** Paths already recorded this session, so a refresh does not count twice. */
const SEEN_KEY = "avyra_visited_paths";

function alreadySeen(path: string): boolean {
  try {
    const seen: string[] = JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "[]");

    if (seen.includes(path)) return true;

    seen.push(path);
    sessionStorage.setItem(SEEN_KEY, JSON.stringify(seen));

    return false;
  } catch {
    // Private browsing can refuse sessionStorage. Losing the guard is better
    // than losing the visit, so fall through and record it.
    return false;
  }
}

/**
 * Records a page view on every route change.
 *
 * Mounted once in the root layout rather than per page: App Router navigations
 * do not reload the document, so nothing else would notice them.
 *
 * The UTM parameters come from `getAttribution()`, which keeps the *first* touch
 * for the session — a visitor who arrives from an ad and then clicks around
 * stays credited to that ad instead of turning into direct traffic on page two.
 */
export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (PRIVATE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;
    if (alreadySeen(pathname)) return;

    const attribution = getAttribution();

    api
      .post("/storefront/visits", {
        path: pathname,
        referrer: document.referrer || undefined,
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign,
        utm_term: attribution.utm_term,
        utm_content: attribution.utm_content,
      })
      // Tracking must never surface to a customer, and never block the page.
      .catch(() => undefined);
  }, [pathname]);

  return null;
}
