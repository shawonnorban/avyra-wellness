"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

/**
 * Facebook Pixel base code.
 *
 * Mounted only on the campaign and landing pages — the storefront and admin do
 * not carry it. Because it is scoped that way, `init` runs once per page and
 * the usual double-counting from a second init elsewhere cannot happen.
 *
 * The server sends the same conversions through the Conversions API using an
 * `event_id` of `{orderId}-{EventName}`; passing the identical id here lets
 * Facebook collapse the browser and server copies into one event instead of two.
 */
export function FacebookPixel() {
  const pathname = usePathname();

  // A route change inside the app does not reload the page, so PageView has to
  // be fired again by hand. The base code covers only the first view.
  useEffect(() => {
    if (!PIXEL_ID || typeof window.fbq !== "function") return;

    window.fbq("track", "PageView");
  }, [pathname]);

  if (!PIXEL_ID) return null;

  return (
    <>
      <Script id="fb-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>

      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}

/**
 * Fires the browser half of a conversion. Safe to call when the pixel is absent
 * or blocked — the server copy is what the reporting actually relies on.
 */
export function trackPixelEvent(
  event: "InitiateCheckout" | "Lead" | "Purchase",
  eventId: string,
  data?: Record<string, unknown>,
): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;

  window.fbq("track", event, data ?? {}, { eventID: eventId });
}
