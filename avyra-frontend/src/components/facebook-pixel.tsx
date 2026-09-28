"use client";

import Script from "next/script";
import { DIRECT_PIXEL_ID } from "@/lib/gtm";

/**
 * The Meta Pixel, installed straight into the page.
 *
 * This is the alternative to a GTM container, not an addition to one:
 * `DIRECT_PIXEL_ID` is undefined whenever `NEXT_PUBLIC_GTM_ID` is set, so this
 * renders nothing and the container stays the only owner of the browser half.
 * Two `fbq('init')` calls would count every event twice.
 *
 * `PageView` fires once, here, on a real page load. It is not repeated on App
 * Router navigations — reaching /order-success after an order is a client-side
 * transition, so it does not send a second one, which is what the shop asked
 * for. ViewContent, InitiateCheckout and Lead come from `pushEvent`.
 *
 * The tail of the snippet is what makes early events safe: it marks the Pixel
 * ready and then replays anything `pushEvent` queued while the script was still
 * loading, in the order it was queued and after `PageView`.
 */
export function FacebookPixel() {
  if (!DIRECT_PIXEL_ID) return null;

  return (
    <>
      <Script id="fb-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${DIRECT_PIXEL_ID}');
fbq('track','PageView');
window.__fbReady=true;
(window.__fbPending||[]).splice(0).forEach(function(a){fbq.apply(null,a)});`}
      </Script>

      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${DIRECT_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
