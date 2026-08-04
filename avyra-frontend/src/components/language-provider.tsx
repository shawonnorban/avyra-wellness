"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { translations, type Lang } from "@/lib/translations";
import { useStoredValue } from "@/lib/use-stored-value";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = "avyra_lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Read through useSyncExternalStore so SSR renders English and the stored
  // preference is applied during hydration without an extra render pass.
  const [stored, store] = useStoredValue(STORAGE_KEY, "en");
  const lang: Lang = stored === "bn" ? "bn" : "en";

  // `lang` on <html> is what switches the Bengali font stack in globals.css.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => store(next), [store]);
  const toggleLang = useCallback(() => store(lang === "en" ? "bn" : "en"), [store, lang]);

  const t = useCallback(
    (key: string): string => translations[key]?.[lang] ?? translations[key]?.en ?? key,
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Pins a subtree to one language whatever the site-wide toggle says.
 *
 * The campaign pages are written in Bengali only, so the brand sections they
 * reuse must not fall back to English for a visitor who has never touched the
 * toggle — the site-wide default is `en`, which is why a fresh browser showed
 * English there. Deliberately does not write `document.documentElement.lang`:
 * that attribute belongs to the outer provider, and both effects fighting over
 * it would come down to effect ordering. The Bengali font is applied by CSS
 * instead (`.lp-bn` in landing.css).
 */
export function LanguageLock({ lang, children }: { lang: Lang; children: ReactNode }) {
  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang: () => {},
      toggleLang: () => {},
      t: (key: string) => translations[key]?.[lang] ?? translations[key]?.en ?? key,
    }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);

  // Fallback so a component rendered outside the provider still shows English
  // rather than throwing.
  return (
    ctx ?? {
      lang: "en",
      setLang: () => {},
      toggleLang: () => {},
      t: (key: string) => translations[key]?.en ?? key,
    }
  );
}
