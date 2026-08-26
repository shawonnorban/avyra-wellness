import type { Metadata } from "next";
import { Anek_Bangla, Rethink_Sans, Sora } from "next/font/google";
import { GoogleTagManager } from "@/components/gtm";
import { Providers } from "@/components/providers";
import "./globals.css";

/**
 * Just the scheme and host of the API, for the connection hints below.
 *
 * Derived rather than written out, so a change of API host cannot leave a
 * preconnect pointing at the old one — which would be worse than none, since the
 * browser would open a connection it never uses.
 */
const API_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? "").origin;
  } catch {
    return null;
  }
})();

const rethinkSans = Rethink_Sans({
  variable: "--font-rethink",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// The whole type stack switches to Anek Bangla when the language toggle sets lang="bn".
const anekBangla = Anek_Bangla({
  variable: "--font-anek-bangla",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Campaign landing pages set Latin copy in Sora; their Bengali copy uses the same
// Anek Bangla as the brand site. See src/app/lp/landing.css.
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Avyra Wellness — Guided by Nature | A Return to Origin",
    template: "%s | Avyra Wellness",
  },
  description: "Avyra Wellness — Guided by Nature | Bringing nature back to everyday life.",
  keywords: ["Avyra Wellness", "natural products", "organic", "wellness", "Bangladesh", "nature"],
  authors: [{ name: "Avyra Wellness" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  // No `icons` override: it emitted a second <link> to a 57px PNG that competed
  // with app/favicon.ico. The file convention alone serves the multi-size icon.
  openGraph: {
    type: "website",
    siteName: "Avyra Wellness",
    title: "Avyra Wellness — Guided by Nature | A Return to Origin",
    description: "Avyra Wellness — Guided by Nature | Bringing nature back to everyday life.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Avyra Wellness — Guided by Nature | A Return to Origin",
    description: "Avyra Wellness — Guided by Nature | Bringing nature back to everyday life.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${rethinkSans.variable} ${anekBangla.variable} ${sora.variable} h-full antialiased`}
    >
      <head>
        {/* The API host serves every product photo and campaign slide, including
            the campaign page's LCP image. Those URLs are only known after the
            settings request resolves, so the browser cannot preload them — but
            it can at least have the DNS, TCP and TLS done by the time it learns
            of them, which is most of the LCP "resource load delay". */}
        {API_ORIGIN && (
          <>
            <link rel="preconnect" href={API_ORIGIN} crossOrigin="" />
            <link rel="dns-prefetch" href={API_ORIGIN} />
          </>
        )}
      </head>

      <body className="min-h-full flex flex-col">
        {/* Tag manager first, so the noscript iframe sits immediately after
            <body> as Google's install instructions require. */}
        <GoogleTagManager />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
