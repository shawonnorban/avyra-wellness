"use client";

import Link from "next/link";
import { Filter, Leaf, Package, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatTaka } from "@/lib/format";
import { useBanners, useProducts, useStorefrontSettings } from "@/lib/queries";
import type { Product } from "@/lib/types";
import { useCart } from "@/store/cart";

function HeroBannerSlider() {
  const { data: banners } = useBanners();
  const [idx, setIdx] = useState(0);
  const slides = banners ?? [];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden">
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${idx * 100}%)` }}
      >
        {slides.map((banner) => {
          const content = (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={banner.image_url}
              alt={banner.title ?? ""}
              className="w-full h-auto object-cover"
            />
          );

          return (
            <div key={banner.id} className="w-full shrink-0">
              {banner.link_url ? <Link href={banner.link_url}>{content}</Link> : content}
            </div>
          );
        })}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((banner, i) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-6 bg-white" : "w-1.5 bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function priceRange(product: Product) {
  const prices = (product.variants ?? []).map((v) => v.price).filter((p) => p > 0);

  if (prices.length === 0) return { min: product.price, max: product.price, hasRange: false };

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return { min, max, hasRange: min !== max };
}

export default function ShopPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const { data: settings } = useStorefrontSettings();
  const { data, isLoading } = useProducts();
  const add = useCart((s) => s.add);

  const products = data?.data ?? [];
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[];

  const filtered = products.filter((p) => {
    const term = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term);
    const matchesCategory = category === "all" || p.category === category;
    return matchesSearch && matchesCategory;
  });

  const companyName = settings?.company?.name ?? "Avyra Wellness";
  const slogan = settings?.company?.slogan;

  const addToCart = (product: Product) => {
    add({
      productId: product.id,
      variantId: null,
      name: product.name,
      variantLabel: null,
      price: product.price,
      image: product.images[0] ?? null,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <>
      <HeroBannerSlider />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold tracking-wider uppercase">
            <Leaf className="w-3.5 h-3.5" /> Welcome
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-foreground">{companyName}</h1>
          {slogan && <p className="text-sm md:text-base text-muted-foreground italic">{slogan}</p>}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-lg md:text-xl font-bold text-foreground">পপুলার প্রোডাক্টস</h2>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search products"
                className="pl-9 h-9 w-56 rounded-sm border border-input bg-card text-sm px-3 focus:outline-2 focus:outline-ring/40"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Filter by category"
                className="h-9 w-36 appearance-none rounded-sm border border-input bg-card pl-8 pr-3 text-sm focus:outline-2 focus:outline-ring/40"
              >
                <option value="all">All</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-2 animate-pulse">
                <div className="aspect-square bg-muted rounded-lg mb-2" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No products found</h3>
            <p className="text-sm text-muted-foreground">Try a different keyword</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filtered.map((product) => {
              const href = `/shop/${product.slug ?? product.id}`;
              const range = priceRange(product);
              const hasVariants = (product.variants?.length ?? 0) > 0;

              return (
                <div
                  key={product.id}
                  className="bg-card rounded-xl border border-border hover:border-primary/40 hover:shadow-lg transition-all duration-300 overflow-hidden group flex flex-col"
                >
                  <Link href={href} className="aspect-square relative overflow-hidden block">
                    {product.images[0] ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
                        <Package className="w-8 h-8 text-primary/20" />
                      </div>
                    )}

                    {product.category && (
                      <div className="absolute top-1.5 left-1.5">
                        <span className="inline-flex items-center rounded-sm bg-card/80 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-medium text-secondary-foreground">
                          {product.category}
                        </span>
                      </div>
                    )}
                  </Link>

                  <div className="p-2.5 space-y-1.5 flex flex-col flex-1">
                    <h3 className="font-semibold text-xs text-card-foreground line-clamp-2 leading-tight">
                      <Link href={href} className="hover:text-primary transition-colors">
                        {product.name}
                      </Link>
                    </h3>

                    <div className="pt-0.5">
                      <span className="text-sm font-bold text-primary">
                        {range.hasRange
                          ? `${formatTaka(range.min)} – ${formatTaka(range.max)}`
                          : formatTaka(range.min)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-auto pt-1.5">
                      {hasVariants ? (
                        <Link
                          href={href}
                          className="w-full h-8 inline-flex items-center justify-center rounded-sm border text-xs font-medium"
                          style={{ borderColor: "#2ecc71", color: "#2ecc71" }}
                        >
                          Select Options
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          disabled={!product.in_stock}
                          className="w-full h-8 rounded-sm text-xs font-medium text-white disabled:opacity-50"
                          style={{ background: "#2ecc71" }}
                        >
                          {product.in_stock ? "Add to cart" : "Out of stock"}
                        </button>
                      )}

                      <Link
                        href={href}
                        className="w-full h-8 inline-flex items-center justify-center rounded-sm border text-xs font-medium"
                        style={{ borderColor: "#f39c12", color: "#f39c12" }}
                      >
                        এখনই কিনুন
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
