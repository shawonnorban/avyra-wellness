import type { Metadata } from "next";
import type { ProductDetail, StorefrontSettings } from "@/lib/types";
import { PRODUCT_SLUG } from "../avyravitalplus/copy";
import { VitalPlusPage } from "./vitalplus-page";

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

export const metadata: Metadata = {
  title: "Vital Plus — প্রকৃতির সেরা শক্তি",
  description:
    "১৮+ প্রাকৃতিক ও ভেষজ উপাদানে তৈরি Vital Plus। সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।",
};

export default async function Page() {
  const [product, settings] = await Promise.all([
    getInitialData<ProductDetail>(`/storefront/products/${PRODUCT_SLUG}`),
    getInitialData<StorefrontSettings>("/storefront/settings"),
  ]);

  return <VitalPlusPage initialProduct={product} initialSettings={settings} />;
}
