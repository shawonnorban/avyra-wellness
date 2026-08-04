"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import { use, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import { formatTaka } from "@/lib/format";
import { useProduct } from "@/lib/queries";
import type { ProductVariant } from "@/lib/types";
import { useCart } from "@/store/cart";

// Next 16: route params arrive as a Promise and are unwrapped with React's `use`.
export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { t } = useLanguage();
  const { data: product, isLoading, isError } = useProduct(slug);

  const [variantId, setVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [imageIdx, setImageIdx] = useState(0);

  const add = useCart((s) => s.add);

  const variants = useMemo(() => product?.variants ?? [], [product]);
  const images = useMemo(
    () => (product ? [...(product.images ?? []), ...(product.gallery_images ?? [])].filter(Boolean) : []),
    [product],
  );

  const selected: ProductVariant | null = useMemo(
    () => variants.find((v) => v.id === variantId) ?? variants[0] ?? null,
    [variants, variantId],
  );

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center py-32">
        <p className="text-sm text-gray-500">{t("product.loading")}</p>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center gap-4 py-32">
        <Package className="w-12 h-12 text-gray-200" />
        <p className="text-sm text-gray-600">{t("product.notFound")}</p>
        <Link href="/shop" className="text-sm font-medium text-teal-700 hover:underline">
          {t("product.backToShop")}
        </Link>
      </div>
    );
  }

  const price = selected?.price ?? product.price;
  const inStock = selected ? selected.in_stock : product.in_stock;
  const variantLabel = selected
    ? [selected.size, selected.color].filter(Boolean).join(" / ") || null
    : null;

  const deliveryLines =
    product.delivery_info && product.delivery_info.length > 0
      ? product.delivery_info
      : [t("product.deliveryDefault")];

  const addToCart = () => {
    add(
      {
        productId: product.id,
        variantId: selected?.id ?? null,
        name: product.name,
        variantLabel,
        price,
        image: images[0] ?? null,
      },
      quantity,
    );
    toast.success(`${product.name} added to cart`);
  };

  const buyNow = () => {
    addToCart();
    router.push("/checkout");
  };

  return (
    <main className="bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* Left: images */}
          <div>
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
              {images[imageIdx] ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={images[imageIdx]} alt={product.name} className="h-full w-full object-contain p-6" />
              ) : (
                <Package className="h-20 w-20 text-gray-200" />
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {images.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    onClick={() => setImageIdx(i)}
                    aria-label={`View image ${i + 1}`}
                    className={`w-16 h-16 rounded border-2 overflow-hidden bg-gray-50 flex-shrink-0 transition-colors ${
                      i === imageIdx ? "border-teal-600" : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}

            {product.faqs?.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-teal-700 mb-3">FAQs</h2>
                <div className="space-y-2">
                  {product.faqs.map((faq, i) => (
                    <details key={i} className="rounded border border-gray-100 bg-gray-50 px-3 py-2 group/faq">
                      <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 select-none list-none">
                        {faq.q}
                        <span className="text-gray-400 group-open/faq:hidden">+</span>
                        <span className="text-gray-400 hidden group-open/faq:inline">−</span>
                      </summary>
                      <p className="mt-2 text-sm text-gray-600 leading-6 whitespace-pre-line">{faq.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: buy box */}
          <div className="space-y-5">
            {product.tagline && (
              <p className="text-xs font-bold uppercase tracking-widest text-teal-600">{product.tagline}</p>
            )}

            <h1 className="text-2xl font-bold text-gray-900 leading-snug">{product.name}</h1>

            {product.short_description && (
              <p className="text-sm text-gray-500">{product.short_description}</p>
            )}

            <p className="text-sm text-gray-500">
              {t("product.sku")}: <span className="font-medium text-gray-700">{product.sku}</span>
            </p>

            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900">{formatTaka(price)}</span>
              {!inStock && (
                <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                  Out of stock
                </span>
              )}
            </div>

            {variants.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">{t("product.size")}</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => {
                    const label =
                      [variant.size, variant.color].filter(Boolean).join(" / ") || variant.sku_suffix;

                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setVariantId(variant.id)}
                        disabled={!variant.in_stock}
                        aria-pressed={selected?.id === variant.id}
                        className={`px-4 py-1.5 rounded border text-sm font-medium transition-colors disabled:opacity-40 ${
                          selected?.id === variant.id
                            ? "border-teal-600 bg-teal-600 text-white"
                            : "border-gray-300 text-gray-700 hover:border-teal-600"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">{t("product.quantity")}</p>
              <div className="flex items-center border border-gray-300 rounded w-fit">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-9 h-9 text-gray-600 hover:bg-gray-50 text-lg"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-semibold text-gray-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                  className="w-9 h-9 text-gray-600 hover:bg-gray-50 text-lg"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-1">
              <button
                type="button"
                onClick={addToCart}
                disabled={!inStock}
                className="w-full h-11 rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 font-semibold text-sm disabled:opacity-50"
              >
                {t("product.addToCart")}
              </button>
              <button
                type="button"
                onClick={buyNow}
                disabled={!inStock}
                className="w-full h-11 rounded bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm disabled:opacity-50"
              >
                {t("product.buyNow")}
              </button>
            </div>

            <details className="border-t border-gray-200 pt-4 group" open>
              <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold text-teal-700 select-none list-none">
                {t("product.description")}
                <span className="text-gray-400 group-open:hidden">+</span>
                <span className="text-gray-400 hidden group-open:inline">−</span>
              </summary>
              {(product.long_description || product.description) && (
                <div className="mt-3 text-sm text-gray-600 leading-7 whitespace-pre-line">
                  {product.long_description || product.description}
                </div>
              )}
            </details>

            <details className="border-t border-gray-200 pt-4 group">
              <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold text-gray-800 select-none list-none">
                {t("product.deliveryPolicy")}
                <span className="text-gray-400 group-open:hidden">+</span>
                <span className="text-gray-400 hidden group-open:inline">−</span>
              </summary>
              <ul className="mt-3 space-y-1">
                {deliveryLines.map((line, i) => (
                  <li key={i} className="text-sm text-gray-600">• {line}</li>
                ))}
              </ul>
            </details>

            <div className="border-t border-gray-200" />
          </div>
        </div>

        {product.gallery_images?.length > 0 && (
          <div className="mt-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.gallery_images.map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  className="group aspect-square overflow-hidden rounded-lg bg-gray-50 border border-gray-100 transition-shadow duration-300 hover:shadow-xl"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${product.name} gallery ${i + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
