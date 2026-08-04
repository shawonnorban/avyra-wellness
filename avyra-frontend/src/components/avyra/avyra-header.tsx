"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard, ShoppingBag, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { useMe } from "@/lib/admin";
import { useStorefrontSettings } from "@/lib/queries";
import { cartCount, useCart } from "@/store/cart";

/**
 * Deep-teal storefront header: logo, three brand links, language switch, cart and
 * an account button that becomes "Dashboard" once staff are signed in.
 */
export function AvyraHeader() {
  const pathname = usePathname();
  const { t, lang, setLang } = useLanguage();
  const { data: settings } = useStorefrontSettings();
  const { data: user } = useMe();
  const count = useCart((s) => cartCount(s.lines));
  const openCart = useCart((s) => s.open);

  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // Close the language menu on an outside click or Escape.
  useEffect(() => {
    if (!langOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!langRef.current?.contains(e.target as Node)) setLangOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLangOpen(false);

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [langOpen]);

  const logoUrl = settings?.company?.logo_url;
  const companyName = settings?.company?.name ?? "Avyra Wellness";

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/vital-plus", label: t("nav.vitalPlus") },
    { href: "/about", label: t("nav.ourStory") },
  ];

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 left-0 right-0 z-40 bg-avyra-teal-deep text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 py-3 md:py-5 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={companyName} className="h-9 md:h-10 w-auto object-contain" />
          ) : (
            <span className="font-display text-lg md:text-xl font-bold tracking-[0.2em]">AVYRA</span>
          )}
        </Link>

        <nav className="flex items-center gap-4 md:gap-10 font-body text-[13px] md:text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-white/90 hover:text-white whitespace-nowrap transition-colors ${
                isActive(link.href) ? "font-semibold border-b-2 border-white" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              aria-expanded={langOpen}
              aria-haspopup="menu"
              className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition backdrop-blur-md border border-white/10 text-xs"
            >
              {lang === "en" ? "EN" : "বাংলা"}
              <ChevronDown className="w-3 h-3" />
            </button>

            {langOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-[110px] p-1 rounded-xl bg-avyra-teal-deep/95 backdrop-blur-xl border border-white/10 shadow-xl text-white"
              >
                {(
                  [
                    ["en", "English"],
                    ["bn", "বাংলা"],
                  ] as const
                ).map(([code, label]) => (
                  <button
                    key={code}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setLang(code);
                      setLangOpen(false);
                    }}
                    className={`w-full text-left cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-white/10 transition ${
                      lang === code ? "bg-white/15 font-semibold" : ""
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label="Cart"
            onClick={openCart}
            className="relative w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-white/15 text-white hover:bg-white/25 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-avyra-coral text-white text-[10px] font-bold flex items-center justify-center">
                {count}
              </span>
            )}
          </button>

          <Link
            href={user ? "/admin" : "/admin/login"}
            aria-label={user ? "Dashboard" : "Login"}
            className="flex items-center gap-1.5 px-2.5 md:px-3 h-9 md:h-10 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors text-xs"
          >
            {user ? <LayoutDashboard className="w-4 h-4" /> : <User className="w-4 h-4" />}
            <span className="hidden sm:inline whitespace-nowrap">{user ? "Dashboard" : "Login"}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
