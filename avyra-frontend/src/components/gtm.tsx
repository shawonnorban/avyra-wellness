"use client";

import Script from "next/script";
import { GTM_ID, pushEvent } from "@/lib/gtm";

/**
 * Google Tag Manager container.
 *
 * This replaced the hand-rolled Meta Pixel snippet: the Pixel now lives inside
 * the container, so the media buyer can change tags without a deploy. Both must
 * never be present at once — two `fbq('init')` calls double-count every event.
 *
 * Mounted in the root layout rather than per page, because a tag manager is
 * site-wide by definition; which pages a given tag fires on is decided in GTM.
 *
 * With `NEXT_PUBLIC_GTM_ID` unset nothing renders and `pushEvent` is a harmless
 * no-op, so development and preview builds carry no tracking at all.
 *
 * **No virtual page view is pushed on navigation**, by request. App Router
 * navigations do not reload the page, so the Pixel's own PageView fires once per
 * real page load and not again as the visitor moves around — in particular not
 * on reaching /order-success after ordering, which is what the shop objected to.
 * Nothing else depends on it: ViewContent, InitiateCheckout and Lead are each
 * pushed explicitly at the moment they happen. Restoring it means pushing
 * `page_view` from a pathname effect here, nowhere else.
 */
export function GoogleTagManager() {
  if (!GTM_ID) return null;

  return (
    <>
      <Script id="gtm-base" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>

      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}

/** Re-exported so callers import tracking from one place. */
export { pushEvent };
