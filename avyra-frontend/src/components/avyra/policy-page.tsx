"use client";

import { useLanguage } from "@/components/language-provider";
import { Spinner } from "@/components/ui/misc";
import { useStorefrontSettings } from "@/lib/queries";

export type PolicyKey = "returns" | "shipping" | "terms" | "privacy";

const TITLE_KEYS: Record<PolicyKey, string> = {
  returns: "footer.returnsPolicy",
  shipping: "footer.shippingPolicy",
  terms: "footer.terms",
  privacy: "footer.privacy",
};

/**
 * Renders one of the four policy pages. The body is plain text held in the
 * `policies` setting so staff can edit it from the admin without a deploy;
 * blank lines separate paragraphs.
 */
export function PolicyPage({ policy }: { policy: PolicyKey }) {
  const { data: settings, isLoading } = useStorefrontSettings();
  const { t } = useLanguage();

  const title = t(TITLE_KEYS[policy]);
  const body = settings?.policies?.[policy] ?? "";
  const company = settings?.company;

  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <main className="flex-1 bg-avyra-cream">
      <div className="mx-auto max-w-3xl px-6 py-16 lg:px-10 md:py-24">
        <h1 className="font-display text-3xl font-bold text-avyra-teal-deep md:text-4xl">{title}</h1>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="text-avyra-teal-deep" />
          </div>
        ) : paragraphs.length === 0 ? (
          <p className="mt-8 text-avyra-ink/70">
            {t("policy.empty")}
          </p>
        ) : (
          <div className="mt-8 space-y-5">
            {paragraphs.map((paragraph, i) => (
              <p key={i} className="whitespace-pre-line leading-relaxed text-avyra-ink/80">
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {(company?.email || company?.phone) && (
          <div className="mt-12 border-t border-avyra-teal-deep/15 pt-6 text-sm text-avyra-ink/70">
            <p>{t("policy.questions")}</p>
            <p className="mt-1">
              {company.email && (
                <a href={`mailto:${company.email}`} className="text-avyra-teal-deep hover:underline">
                  {company.email}
                </a>
              )}
              {company.email && company.phone && " · "}
              {company.phone && (
                <a href={`tel:${company.phone}`} className="text-avyra-teal-deep hover:underline">
                  {company.phone}
                </a>
              )}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
