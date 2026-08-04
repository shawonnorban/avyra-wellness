"use client";

import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { formatTaka } from "@/lib/format";
import { cartCount, cartSubtotal, useCart } from "@/store/cart";

export function CartDrawer() {
  const router = useRouter();
  const { lines, isOpen, close, setQuantity, remove, clear } = useCart();
  const subtotal = cartSubtotal(lines);
  const count = cartCount(lines);

  // Escape closes the sheet, and the page behind it must not scroll while open.
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Cart">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={close}
        aria-label="Close cart"
      />

      <aside className="relative flex h-full w-full sm:max-w-md flex-col bg-card p-6 shadow-xl">
        <header className="flex items-start justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-card-foreground">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Cart ({count})
          </h2>
          <button
            type="button"
            onClick={close}
            className="rounded-sm p-1 text-muted-foreground hover:text-foreground"
            aria-label="Close cart"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Cart is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 py-4">
              {lines.map((line) => (
                <div
                  key={`${line.productId}-${line.variantId ?? "base"}`}
                  className="flex gap-3 bg-secondary/30 rounded-lg p-3"
                >
                  {line.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.image} alt={line.name} className="w-16 h-16 rounded-md object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-md bg-accent flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-primary/30" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-card-foreground line-clamp-1">{line.name}</h4>
                    {line.variantLabel && (
                      <p className="text-xs text-muted-foreground">{line.variantLabel}</p>
                    )}
                    <p className="text-sm font-bold text-primary mt-1">{formatTaka(line.price)}</p>

                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.productId, line.variantId, line.quantity - 1)}
                        className="h-6 w-6 inline-flex items-center justify-center rounded-sm border border-input hover:bg-secondary"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <span className="text-sm font-medium w-6 text-center">{line.quantity}</span>

                      <button
                        type="button"
                        onClick={() => setQuantity(line.productId, line.variantId, line.quantity + 1)}
                        className="h-6 w-6 inline-flex items-center justify-center rounded-sm border border-input hover:bg-secondary"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => remove(line.productId, line.variantId)}
                        className="h-6 w-6 ml-auto inline-flex items-center justify-center rounded-sm text-destructive hover:bg-destructive/10"
                        aria-label={`Remove ${line.name}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatTaka(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className="text-xs text-muted-foreground">চেকআউটে নির্ধারিত হবে</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-xl font-bold text-primary">{formatTaka(subtotal)}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  close();
                  router.push("/checkout");
                }}
                className="w-full h-11 rounded-sm bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Checkout
              </button>

              <button
                type="button"
                onClick={clear}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Clear Cart
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
