"use client";

import { AvyraFooter } from "@/components/avyra/avyra-footer";
import { AvyraHeader } from "@/components/avyra/avyra-header";
import { CartDrawer } from "@/components/avyra/cart-drawer";
import { useStorefrontSettings } from "@/lib/queries";

/**
 * Storefront chrome: promotional ticker, teal header, content, gradient footer
 * and the cart sheet. Landing pages under /lp opt out of this entirely.
 */
export function AvyraLayout({ children }: { children: React.ReactNode }) {
  const { data: settings } = useStorefrontSettings();
  const scrollText = settings?.company?.scroll_text?.trim();

  return (
    <div className="min-h-screen bg-avyra-cream text-avyra-ink font-body flex flex-col">
      {scrollText && (
        <div className="relative z-50 bg-avyra-teal text-white text-sm md:text-base py-2 overflow-hidden whitespace-nowrap">
          {/* Duplicated so the -50% translate loops seamlessly. */}
          <div className="animate-marquee inline-block">
            <span className="mx-8">{scrollText}</span>
            <span className="mx-8">{scrollText}</span>
          </div>
        </div>
      )}

      <div className="relative flex-1 flex flex-col">
        <AvyraHeader />
        <main className="flex-1">{children}</main>
        <AvyraFooter />
      </div>

      <CartDrawer />
    </div>
  );
}
