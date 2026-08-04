import type { Metadata } from "next";
import { CampaignPage } from "./campaign-page";
import { copy } from "./copy";

// A static route, unlike /lp/[slug], so it can export real metadata instead of
// setting document.title after hydration.
export const metadata: Metadata = {
  title: copy.meta.title,
  description: copy.meta.description,
};

export default function Page() {
  return <CampaignPage />;
}
