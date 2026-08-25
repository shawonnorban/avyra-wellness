import type { Metadata } from "next";
import type { ProductDetail, StorefrontSettings } from "@/lib/types";
import { CampaignPage } from "./campaign-page";
import { copy, PRODUCT_SLUG } from "./copy";

export const dynamic = "force-dynamic";

async function getInitialData<T>(path: string): Promise<T | undefined> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

  try {
    const response = await fetch(`${apiUrl}${path}`, { next: { revalidate: 300 } });
    if (!response.ok) return undefined;

    const body = (await response.json()) as { data: T };
    return body.data;
  } catch {
    return undefined;
  }
}

// A static route, unlike /lp/[slug], so it can export real metadata instead of
// setting document.title after hydration.
export const metadata: Metadata = {
  title: copy.meta.title,
  description: copy.meta.description,
};

export default async function Page() {
  const [product, settings] = await Promise.all([
    getInitialData<ProductDetail>(`/storefront/products/${PRODUCT_SLUG}`),
    getInitialData<StorefrontSettings>("/storefront/settings"),
  ]);

  return <CampaignPage initialProduct={product} initialSettings={settings} />;
}
