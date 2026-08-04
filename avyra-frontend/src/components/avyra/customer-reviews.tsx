"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Reveal } from "@/components/avyra/reveal";
import { useLanguage } from "@/components/language-provider";
import api from "@/lib/api";

/**
 * Review screenshots are configured on published landing pages, so the home page
 * shows whatever the current campaign is using — same behaviour as the old build.
 */
function useReviewImages() {
  return useQuery({
    queryKey: ["storefront", "review-images"],
    queryFn: async () => {
      const { data } = await api.get<{ data: string[] }>("/storefront/reviews");
      return data.data;
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Customer review"
        className="max-w-full max-h-[90vh] rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

export function CustomerReviews() {
  const { t } = useLanguage();
  const { data } = useReviewImages();
  const images = useMemo(() => data ?? [], [data]);

  const [idx, setIdx] = useState(0);
  const [perPage, setPerPage] = useState(1);
  const [paused, setPaused] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setPerPage(window.innerWidth >= 768 ? 4 : 1);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxIdx = Math.max(0, images.length - perPage);

  useEffect(() => {
    if (images.length <= perPage || paused) return;

    const timer = setInterval(() => setIdx((i) => (i + 1 > maxIdx ? 0 : i + 1)), 4000);
    return () => clearInterval(timer);
  }, [images.length, perPage, paused, maxIdx]);

  if (images.length === 0) return null;

  const clamped = Math.min(idx, maxIdx);

  return (
    <section className="bg-avyra-cream py-16 md:py-24">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <Reveal as="h2" className="text-center font-display font-bold text-3xl md:text-4xl text-avyra-teal-deep">
          {t("about.testimonial")}
        </Reveal>

        <div
          className="relative mt-10"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${clamped * (100 / perPage)}%)` }}
            >
              {images.map((src, i) => (
                <div key={`${src}-${i}`} className="shrink-0 px-2" style={{ width: `${100 / perPage}%` }}>
                  <button
                    type="button"
                    onClick={() => setLightbox(src)}
                    className="block w-full overflow-hidden rounded-xl bg-white shadow-sm"
                    aria-label={`Open review ${i + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" loading="lazy" className="w-full h-auto object-cover" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {images.length > perPage && (
            <>
              <button
                type="button"
                onClick={() => setIdx((i) => (i <= 0 ? maxIdx : i - 1))}
                aria-label="Previous reviews"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-avyra-teal-deep"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIdx((i) => (i >= maxIdx ? 0 : i + 1))}
                aria-label="Next reviews"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-avyra-teal-deep"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </section>
  );
}
