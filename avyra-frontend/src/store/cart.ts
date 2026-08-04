"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  productId: string;
  variantId: string | null;
  name: string;
  variantLabel: string | null;
  price: number;
  image: string | null;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  remove: (productId: string, variantId: string | null) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
};

/** A product+variant pair is one line; the same product in two sizes is two lines. */
const sameLine = (a: CartLine, productId: string, variantId: string | null) =>
  a.productId === productId && a.variantId === variantId;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,

      add: (line, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => sameLine(l, line.productId, line.variantId));

          return {
            isOpen: true,
            lines: existing
              ? state.lines.map((l) =>
                  sameLine(l, line.productId, line.variantId)
                    ? { ...l, quantity: l.quantity + quantity }
                    : l,
                )
              : [...state.lines, { ...line, quantity }],
          };
        }),

      setQuantity: (productId, variantId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => !sameLine(l, productId, variantId))
              : state.lines.map((l) =>
                  sameLine(l, productId, variantId) ? { ...l, quantity } : l,
                ),
        })),

      remove: (productId, variantId) =>
        set((state) => ({
          lines: state.lines.filter((l) => !sameLine(l, productId, variantId)),
        })),

      clear: () => set({ lines: [], isOpen: false }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: "avyra-cart",
      // isOpen is UI state; only the lines should survive a reload.
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);

export const cartSubtotal = (lines: CartLine[]): number =>
  lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

export const cartCount = (lines: CartLine[]): number =>
  lines.reduce((sum, line) => sum + line.quantity, 0);
