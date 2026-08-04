"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  Banner,
  CheckoutPayload,
  LandingPage,
  Paginated,
  PlacedOrder,
  Product,
  ProductDetail,
  StorefrontSettings,
  TrackedOrder,
} from "@/lib/types";

/* ---------- Storefront ---------- */

export function useStorefrontSettings() {
  return useQuery({
    queryKey: ["storefront", "settings"],
    queryFn: async () => {
      const { data } = await api.get<{ data: StorefrontSettings }>("/storefront/settings");
      return data.data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useBanners() {
  return useQuery({
    queryKey: ["storefront", "banners"],
    queryFn: async () => {
      const { data } = await api.get<{ data: Banner[] }>("/storefront/banners");
      return data.data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useProducts(params: { search?: string; category?: string } = {}) {
  return useQuery({
    queryKey: ["storefront", "products", params],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Product>>("/storefront/products", { params });
      return data;
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["storefront", "product", slug],
    queryFn: async () => {
      const { data } = await api.get<{ data: ProductDetail }>(`/storefront/products/${slug}`);
      return data.data;
    },
    enabled: Boolean(slug),
  });
}

export function useLandingPage(slug: string) {
  return useQuery({
    queryKey: ["storefront", "landing-page", slug],
    queryFn: async () => {
      const { data } = await api.get<{ data: LandingPage }>(`/storefront/landing-pages/${slug}`);
      return data.data;
    },
    enabled: Boolean(slug),
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: async (payload: { code: string; subtotal: number }) => {
      const { data } = await api.post<{ valid: boolean; code: string; discount: number }>(
        "/storefront/coupons/validate",
        payload,
      );
      return data;
    },
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CheckoutPayload) => {
      const { data } = await api.post<{ data: PlacedOrder }>("/storefront/checkout", payload);
      return data.data;
    },
    onSuccess: () => {
      // Stock may have changed; let the catalogue refetch on next view.
      queryClient.invalidateQueries({ queryKey: ["storefront", "products"] });
    },
  });
}

export function useTrackOrder() {
  return useMutation({
    mutationFn: async (payload: { order_number: string; phone: string }) => {
      const { data } = await api.post<{ data: TrackedOrder }>("/storefront/track-order", payload);
      return data.data;
    },
  });
}

export function useSendOtp() {
  return useMutation({
    mutationFn: async (phone: string) => {
      const { data } = await api.post<{ sent: boolean; message: string }>("/storefront/otp/send", {
        phone,
      });
      return data;
    },
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: async (payload: { phone: string; code: string }) => {
      const { data } = await api.post<{ verified: boolean; message: string }>(
        "/storefront/otp/verify",
        payload,
      );
      return data;
    },
  });
}

/** Fire-and-forget campaign tracking; failures are intentionally swallowed. */
export function trackLandingEvent(
  slug: string,
  eventType: "view" | "cta_click" | "order",
  utm: Record<string, string | undefined> = {},
): void {
  api
    .post(`/storefront/landing-pages/${slug}/visit`, { event_type: eventType, ...utm })
    .catch(() => undefined);
}
