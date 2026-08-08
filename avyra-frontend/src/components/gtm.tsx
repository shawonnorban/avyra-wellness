"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
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
 */
export function GoogleTagManager() {
  const pathname = usePathname();

  // App Router navigations do not reload the page, so GTM's own History Change
  // trigger is the only thing that would see them. Pushing a virtual page view
  // gives the container something explicit to hang a Pixel PageView on.
  // Goes through pushEvent so that arriving on a new page also clears the
  // product and order keys the previous page left in the data layer; pushing
  // straight to window.dataLayer here would carry them across the navigation.
  useEffect(() => {
    if (!GTM_ID) return;

    pushEvent("page_view", { page_path: pathname });
  }, [pathname]);

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
