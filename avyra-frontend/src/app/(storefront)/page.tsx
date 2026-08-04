"use client";

import {
  AvyraFaq,
  HomeFamilyBanner,
  HomeFromNature,
  HomeHero,
  HomeJustBegin,
  HomeProductShowcase,
  HomeReconnect,
  HomeValueProps,
} from "@/components/avyra/home-sections";
import { CustomerReviews } from "@/components/avyra/customer-reviews";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeValueProps />
      <HomeFamilyBanner />
      <HomeFromNature />
      <HomeProductShowcase />
      <HomeReconnect />
      <HomeJustBegin />
      <CustomerReviews />
      <AvyraFaq />
    </>
  );
}
