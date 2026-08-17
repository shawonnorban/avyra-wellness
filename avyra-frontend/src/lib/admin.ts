"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  AdminOrder,
  AdminUser,
  Consignment,
  DashboardStats,
  LandingPage,
  Paginated,
  PermissionFlags,
} from "@/lib/types";

/* ---------- Auth ---------- */

export function useMe() {
  return useQuery({
    queryKey: ["admin", "me"],
    queryFn: async () => {
      const { data } = await api.get<{ user: AdminUser }>("/auth/me");
      return data.user;
    },
    retry: false,
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { email: string; password: string; remember?: boolean }) => {
      const { data } = await api.post<{ user: AdminUser }>("/auth/login", payload);
      return data.user;
    },
    onSuccess: (user) => queryClient.setQueryData(["admin", "me"], user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    // Everything in the cache is scoped to the user who just signed out.
    onSuccess: () => queryClient.clear(),
  });
}

/* ---------- Dashboard ---------- */

export function useDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const { data } = await api.get<{ data: DashboardStats }>("/admin/dashboard");
      return data.data;
    },
  });
}

export function useRevenueChart() {
  return useQuery({
    queryKey: ["admin", "dashboard", "revenue"],
    queryFn: async () => {
      const { data } = await api.get<{
        data: { date: string; revenue: number; orders: number }[];
      }>("/admin/dashboard/revenue-chart");
      return data.data;
    },
  });
}

export function useRecentOrders() {
  return useQuery({
    queryKey: ["admin", "dashboard", "recent-orders"],
    queryFn: async () => {
      const { data } = await api.get<{
        data: {
          id: string;
          order_number: string;
          customer_name: string;
          phone: string;
          total: number;
          status: string;
          order_date: string;
          /** Website, Landing Page, or POS for one a staff member took by phone. */
          order_source: string | null;
          created_at: string | null;
        }[];
      }>("/admin/dashboard/recent-orders");
      return data.data;
    },
  });
}

/* ---------- Orders ---------- */

export type OrderFilters = {
  status?: string;
  /**
   * Website · Landing Page · POS · Shop. Shop sales are hidden from this
   * endpoint unless named here — which is how the Shop Orders panel is served
   * without an endpoint of its own.
   */
  source?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
};

export function useAdminOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ["admin", "orders", filters],
    queryFn: async () => {
      const { data } = await api.get<Paginated<AdminOrder>>("/admin/orders", { params: filters });
      return data;
    },
    placeholderData: (previous) => previous, // keep the table visible while paging
  });
}

export function useOrderStatusCounts() {
  return useQuery({
    queryKey: ["admin", "orders", "status-counts"],
    queryFn: async () => {
      const { data } = await api.get<{ data: Record<string, number> }>(
        "/admin/orders/status-counts",
      );
      return data.data;
    },
  });
}

export function useAdminOrder(id: string | null) {
  return useQuery({
    queryKey: ["admin", "order", id],
    queryFn: async () => {
      const { data } = await api.get<{ data: AdminOrder }>(`/admin/orders/${id}`);
      return data.data;
    },
    enabled: Boolean(id),
  });
}

export type OrderInvoice = {
  company: {
    name: string;
    phone: string;
    email: string;
    address: string;
    logo_url: string | null;
    currency_symbol: string;
  };
  consignment: { courier: string; tracking_code: string | null; consignment_id: string | null } | null;
};

export type OrderRisk = {
  risk_score: number;
  risk_level: string;
  signals: { code: string; label: string; score: number }[] | null;
  action_taken: string;
  created_at: string | null;
};

export function useOrderDetail(id: string | null) {
  return useQuery({
    queryKey: ["admin", "order-detail", id],
    queryFn: async () => {
      const { data } = await api.get<{ data: AdminOrder; risk: OrderRisk[]; invoice: OrderInvoice }>(
        `/admin/orders/${id}`,
      );
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useOrderCustomerHistory(id: string | null) {
  return useQuery({
    queryKey: ["admin", "order-history", id],
    queryFn: async () => {
      const { data } = await api.get<{
        data: { id: string; order_number: string; status: string; total: number; order_date: string }[];
        risk_profile: {
          total_orders: number;
          delivered: number;
          failed: number;
          failure_rate: number;
          risk_flag: string;
          is_whitelisted: boolean;
        } | null;
      }>(`/admin/orders/${id}/customer-history`);
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post<{ data: AdminOrder }>("/admin/orders", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      const { data } = await api.put<{ data: AdminOrder }>(`/admin/orders/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "order-detail"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const { data } = await api.patch<{ data: AdminOrder }>(`/admin/orders/${id}/status`, {
        status,
        reason,
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/orders/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });
}

/* ---------- Courier ---------- */

export function useDispatchOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, note }: { orderId: string; note?: string }) => {
      const { data } = await api.post<{ data: Consignment }>(
        `/admin/courier/orders/${orderId}/dispatch`,
        { note },
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "consignments"] });
    },
  });
}

export function useBulkDispatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderIds: string[]) => {
      const { data } = await api.post<{
        dispatched: { order_number: string; tracking_code: string | null }[];
        failed: { order_number: string; reason: string }[];
      }>("/admin/courier/bulk-dispatch", { order_ids: orderIds });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "consignments"] });
    },
  });
}

export function useConsignments(filters: { status?: string; search?: string; page?: number } = {}) {
  return useQuery({
    queryKey: ["admin", "consignments", filters],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Consignment>>("/admin/courier/consignments", {
        params: filters,
      });
      return data;
    },
    placeholderData: (previous) => previous,
  });
}

export function useCourierStats() {
  return useQuery({
    queryKey: ["admin", "courier", "stats"],
    queryFn: async () => {
      const { data } = await api.get<{
        data: {
          total: number;
          by_status: Record<string, number>;
          in_transit_pct: number;
          delivered_pct: number;
          returned_pct: number;
        };
      }>("/admin/courier/stats");
      return data.data;
    },
  });
}

export function useSyncConsignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<{ data: Consignment }>(
        `/admin/courier/consignments/${id}/sync`,
      );
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "consignments"] }),
  });
}

/* ---------- Products ---------- */

export function useAdminProducts(filters: { search?: string; low_stock?: boolean; page?: number } = {}) {
  return useQuery({
    queryKey: ["admin", "products", filters],
    queryFn: async () => {
      // The admin endpoint returns raw models, so prices are `sell_price`/`cost_price`
      // rather than the storefront's flattened `price`.
      const { data } = await api.get<Paginated<AdminProduct>>("/admin/products", { params: filters });
      return data;
    },
    placeholderData: (previous) => previous,
  });
}

export type AdminProduct = {
  id: string;
  sku: string;
  slug: string | null;
  name: string;
  tagline: string | null;
  product_label: string | null;
  facility_label: string | null;
  category: string | null;
  short_description: string | null;
  description: string | null;
  long_description: string | null;
  images: string[] | null;
  gallery_images: string[] | null;
  ingredients: { name: string; benefit?: string }[] | null;
  faqs: { q: string; a: string }[] | null;
  delivery_info: string[] | null;
  terms_conditions: string | null;
  meta_title: string | null;
  meta_description: string | null;
  warehouse: string | null;
  quantity: number;
  min_stock: number;
  cost_price: number;
  sell_price: number;
  compare_at_price: number | null;
  is_active: boolean;
  /** Units sold, excluding cancelled/returned/lost orders. List endpoint only. */
  sold_count?: number | null;
  variants?: AdminVariant[];
};

export type AdminVariant = {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  sku_suffix: string;
  image_path: string | null;
  quantity: number;
  cost_price: number;
  sell_price: number;
  compare_at_price: number | null;
  is_active: boolean;
};

export function useAdminProduct(id: string | null) {
  return useQuery({
    queryKey: ["admin", "product", id],
    queryFn: async () => {
      const { data } = await api.get<{ data: AdminProduct }>(`/admin/products/${id}`);
      return data.data;
    },
    enabled: Boolean(id),
  });
}

export function useSaveProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: Record<string, unknown> }) => {
      const { data } = id
        ? await api.put<{ data: AdminProduct }>(`/admin/products/${id}`, payload)
        : await api.post<{ data: AdminProduct }>("/admin/products", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "product"] });
    },
  });
}

export function useSaveVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      variantId,
      payload,
    }: {
      productId: string;
      variantId?: string;
      payload: Record<string, unknown>;
    }) => {
      const { data } = variantId
        ? await api.put(`/admin/products/${productId}/variants/${variantId}`, payload)
        : await api.post(`/admin/products/${productId}/variants`, payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "product"] }),
  });
}

export function useDeleteVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, variantId }: { productId: string; variantId: string }) => {
      await api.delete(`/admin/products/${productId}/variants/${variantId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "product"] }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // `deleted` is false when the product was retired because it appears on orders.
      const { data } = await api.delete<{ message: string; deleted: boolean }>(`/admin/products/${id}`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

export type StockMovement = {
  id: string;
  product_name: string;
  change_qty: number;
  movement_type: string;
  reference_type: string | null;
  batch_number: string | null;
  notes: string | null;
  created_at: string;
};

export function useStockMovements(productId: string | null) {
  return useQuery({
    queryKey: ["admin", "stock-movements", productId],
    queryFn: async () => {
      const { data } = await api.get<Paginated<StockMovement>>(`/admin/products/${productId}/movements`);
      return data;
    },
    enabled: Boolean(productId),
  });
}

export type Warehouse = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  is_active: boolean;
  stock_movements_count: number;
};

export function useWarehouses() {
  return useQuery({
    queryKey: ["admin", "warehouses"],
    queryFn: async () => {
      const { data } = await api.get<{ data: Warehouse[] }>("/admin/warehouses");
      return data.data;
    },
  });
}

export function useSaveWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: Record<string, unknown> }) => {
      const { data } = id
        ? await api.put(`/admin/warehouses/${id}`, payload)
        : await api.post("/admin/warehouses", payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "warehouses"] }),
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/warehouses/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "warehouses"] }),
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      change_qty,
      notes,
    }: {
      productId: string;
      change_qty: number;
      notes?: string;
    }) => {
      const { data } = await api.post(`/admin/products/${productId}/adjust-stock`, {
        change_qty,
        notes,
      });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

/* ---------- Landing pages ---------- */

export type LandingPageRow = LandingPage & {
  views: number;
  orders: number;
  is_active: boolean;
  product_id: string | null;
  updated_at: string | null;
  // The admin API returns the raw upload path so the editor can round-trip it;
  // the storefront gets `hero_image` resolved to a URL instead.
  hero_image_path: string | null;
};

export function useAdminLandingPages(filters: { search?: string } = {}) {
  return useQuery({
    queryKey: ["admin", "landing-pages", filters],
    queryFn: async () => {
      const { data } = await api.get<Paginated<LandingPageRow>>("/admin/landing-pages", {
        params: filters,
      });
      return data;
    },
  });
}

export function useAdminLandingPage(id: string | null) {
  return useQuery({
    queryKey: ["admin", "landing-page", id],
    queryFn: async () => {
      const { data } = await api.get<{ data: LandingPageRow }>(`/admin/landing-pages/${id}`);
      return data.data;
    },
    enabled: Boolean(id),
  });
}

export function useSaveLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: Record<string, unknown> }) => {
      const { data } = id
        ? await api.put<{ data: LandingPageRow }>(`/admin/landing-pages/${id}`, payload)
        : await api.post<{ data: LandingPageRow }>("/admin/landing-pages", payload);
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "landing-page"] }),
  });
}

export function useDeleteLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/landing-pages/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "landing-pages"] }),
  });
}

/* ---------- Fraud ---------- */

export type FraudSettings = {
  enabled: boolean;
  phone_block_minutes: number;
  ip_block_minutes: number;
  device_fingerprinting: boolean;
  min_phone_digits: number;
  min_address_length: number;
  delivery_success_threshold: number;
  block_message: string;
};

export function useFraudSettings() {
  return useQuery({
    queryKey: ["admin", "fraud", "settings"],
    queryFn: async () => {
      const { data } = await api.get<{ data: FraudSettings }>("/admin/fraud/settings");
      return data.data;
    },
  });
}

export function useSaveFraudSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: FraudSettings) => {
      const { data } = await api.put<{ data: FraudSettings }>("/admin/fraud/settings", payload);
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "fraud"] }),
  });
}

export function useFraudStats() {
  return useQuery({
    queryKey: ["admin", "fraud", "stats"],
    queryFn: async () => {
      const { data } = await api.get<{
        data: {
          blocked_today: number;
          blocked_total: number;
          flagged_total: number;
          blocked_phones: number;
          blocked_ips: number;
          blocked_devices: number;
          high_risk_customers: number;
        };
      }>("/admin/fraud/stats");
      return data.data;
    },
  });
}

export type BlockedOrderRow = {
  id: string;
  phone: string | null;
  ip_address: string | null;
  risk_score: number;
  risk_level: string;
  signals: { code: string; label: string; score: number }[] | null;
  action_taken: string;
  created_at: string;
  order: { order_number: string } | null;
};

export function useBlockedOrders() {
  return useQuery({
    queryKey: ["admin", "fraud", "blocked-orders"],
    queryFn: async () => {
      const { data } = await api.get<Paginated<BlockedOrderRow>>("/admin/fraud/blocked-orders");
      return data;
    },
  });
}

export type BlocklistEntry = {
  id: string;
  phone?: string;
  ip_address?: string;
  device_fingerprint?: string;
  reason: string | null;
  is_active: boolean;
  created_at: string;
};

export function useBlocklist() {
  return useQuery({
    queryKey: ["admin", "fraud", "blocklist"],
    queryFn: async () => {
      const { data } = await api.get<{
        data: { phones: BlocklistEntry[]; ips: BlocklistEntry[]; devices: BlocklistEntry[] };
      }>("/admin/fraud/blocklist");
      return data.data;
    },
  });
}

export function useBlockItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { type: "phone" | "ip" | "device"; value: string; reason?: string }) => {
      const { data } = await api.post("/admin/fraud/blocklist", payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "fraud"] }),
  });
}

export function useUnblockItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { type: "phone" | "ip" | "device"; id: string }) => {
      await api.post("/admin/fraud/blocklist/remove", payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "fraud"] }),
  });
}

/* ---------- Settings ---------- */

export function useAdminSettings() {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const { data } = await api.get<{ data: Record<string, Record<string, unknown>> }>(
        "/admin/settings",
      );
      return data.data;
    },
  });
}

export function useSaveSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, unknown> }) => {
      const { data } = await api.put(`/admin/settings/${key}`, { value });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      // The storefront reads the same rows, so its copy is stale the moment a
      // setting is saved — otherwise the change only appears after staleTime.
      queryClient.invalidateQueries({ queryKey: ["storefront", "settings"] });
      queryClient.invalidateQueries({ queryKey: ["storefront", "banners"] });
    },
  });
}

/* ---------- Shop banners ---------- */

export type Banner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_path: string;
  link_url: string | null;
  button_text: string | null;
  sort_order: number;
  is_active: boolean;
};

export function useBanners() {
  return useQuery({
    queryKey: ["admin", "banners"],
    queryFn: async () => {
      const { data } = await api.get<{ data: Banner[] }>("/admin/banners");
      return data.data;
    },
  });
}

export function useSaveBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: Record<string, unknown> }) => {
      const { data } = id
        ? await api.put(`/admin/banners/${id}`, payload)
        : await api.post("/admin/banners", payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "banners"] }),
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/banners/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "banners"] }),
  });
}

/* ---------- Staff users & permission matrix ---------- */

export type StaffUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_path: string | null;
  avatar_url: string | null;
  is_active: boolean;
  role: "user" | "employee" | "manager" | "admin";
  created_at: string | null;
};

export function useStaffUsers(search?: string) {
  return useQuery({
    queryKey: ["admin", "users", search],
    queryFn: async () => {
      const { data } = await api.get<Paginated<StaffUser>>("/admin/users", {
        params: { search: search || undefined },
      });
      return data;
    },
  });
}

export function useSaveStaffUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: Record<string, unknown> }) => {
      const { data } = id
        ? await api.put(`/admin/users/${id}`, payload)
        : await api.post("/admin/users", payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useDeactivateStaffUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/users/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export type PermissionMatrix = Record<string, Record<string, PermissionFlags>>;

export function usePermissionMatrix() {
  return useQuery({
    queryKey: ["admin", "permissions"],
    queryFn: async () => {
      const { data } = await api.get<{
        data: { matrix: PermissionMatrix; roles: string[]; modules: string[] };
      }>("/admin/permissions");
      return data.data;
    },
  });
}

export function useSavePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      role: string;
      module: string;
      can_view: boolean;
      can_create: boolean;
      can_edit: boolean;
      can_delete: boolean;
      can_approve: boolean;
    }) => {
      const { data } = await api.put("/admin/permissions", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "permissions"] });
      // The signed-in user's own effective permissions may have changed.
      queryClient.invalidateQueries({ queryKey: ["admin", "me"] });
    },
  });
}

/* ---------- Notifications ---------- */

export type AdminNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export function useNotifications() {
  return useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: async () => {
      const { data } = await api.get<Paginated<AdminNotification> & { unread_count: number }>(
        "/admin/notifications",
      );
      return data;
    },
    // Half a minute: this is also what decides how soon a new order announces
    // itself, so it trades a little polling for the alert being worth having.
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/admin/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post("/admin/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
    },
  });
}

/* ---------- Site traffic ---------- */

export type SiteAnalytics = {
  range: { from: string; to: string; days: number };
  summary: { visits: number; today: number; total: number; unique_paths: number };
  daily: { day: string; visits: number }[];
  hourly: { hour: number; visits: number }[];
  breakdowns: Record<
    "source" | "medium" | "campaign" | "path" | "device" | "browser" | "os",
    { label: string; visits: number }[]
  >;
};

/**
 * Shared by the dashboard tile and the analytics page, so the two can never
 * disagree about how many visits there have been.
 */
export function useSiteVisits(days = 30) {
  return useQuery({
    queryKey: ["admin", "analytics", days],
    queryFn: async () => {
      const { data } = await api.get<SiteAnalytics>("/admin/analytics", { params: { days } });
      return data;
    },
  });
}
