/** Shapes returned by the Laravel API. Kept in one place so pages stay untyped-free. */

export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type ProductVariant = {
  id: string;
  size: string | null;
  color: string | null;
  sku_suffix: string;
  image: string | null;
  price: number;
  /** Display-only "was" price; drives the struck-through price and saving badge. */
  compare_at_price: number | null;
  in_stock: boolean;
};

export type Product = {
  id: string;
  sku: string;
  slug: string | null;
  name: string;
  tagline: string | null;
  product_label: string | null;
  category: string | null;
  short_description: string | null;
  images: string[];
  price: number;
  in_stock: boolean;
  variants?: ProductVariant[];
};

export type ProductDetail = Product & {
  facility_label: string | null;
  description: string | null;
  long_description: string | null;
  gallery_images: string[];
  pack_options: PackOption[];
  ingredients: Ingredient[];
  nutrition: NutritionRow[];
  certificates: string[];
  faqs: Faq[];
  /** Delivery bullet points shown in the product accordion. */
  delivery_info: string[] | null;
  terms_conditions: string | null;
  meta_title: string | null;
  meta_description: string | null;
};

export type PackOption = { label: string; price?: number; quantity?: number };
export type Ingredient = { name: string; benefit?: string; image?: string };
export type NutritionRow = { label: string; value: string };
export type Faq = { q: string; a: string };

export type Banner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  button_text: string | null;
};

export type StorefrontSettings = {
  company?: {
    name: string;
    tagline: string;
    slogan?: string;
    /** Promotional ticker shown above the header; blank hides the bar. */
    scroll_text?: string;
    email: string;
    phone: string;
    whatsapp: string;
    messenger: string;
    address: string;
    logo_url: string | null;
    currency: string;
    currency_symbol: string;
    social: { facebook: string; instagram: string; youtube: string; tiktok: string };
  };
  /** Plain-text bodies for the footer policy pages. */
  policies?: Partial<Record<"returns" | "shipping" | "terms" | "privacy", string>>;
  /** Slider beside the order form on the campaign pages. */
  campaign_slider?: {
    /** Ready-to-use URLs in play order; the API resolves them from stored paths. */
    image_urls?: string[];
    interval_seconds?: number;
  };
  /** Staff-written social-proof popup shown on campaign pages. */
  purchase_popup?: {
    enabled?: boolean;
    interval_seconds?: number;
    /** One `নাম | জেলা` per line. */
    entries?: string;
  };
  delivery?: {
    inside_dhaka_charge: number;
    outside_dhaka_charge: number;
    /** Flat amount off delivery, rendered as its own summary line. */
    delivery_discount_enabled?: boolean;
    delivery_discount?: number;
    free_delivery_above: number | null;
  };
  payment?: {
    cod_enabled: boolean;
    bkash_number: string;
    nagad_number: string;
    rocket_number: string;
  };
  pixels?: {
    facebook_pixel_id: string;
    tiktok_pixel_id: string;
    gtag_id: string;
  };
};

/** One block emitted by the admin landing-page builder. */
export type LandingSection =
  | { type: "hero"; heading?: string; sub?: string; image?: string; cta?: string }
  | { type: "richtext"; html?: string }
  | { type: "video"; url?: string; heading?: string }
  | { type: "gallery"; images?: string[]; heading?: string }
  | { type: "reviews"; images?: string[]; heading?: string }
  | { type: "faq"; heading?: string; items?: Faq[] }
  | { type: "features"; heading?: string; items?: { title: string; body?: string }[] }
  | { type: "countdown"; heading?: string }
  | { type: "order_form"; heading?: string }
  | { type: string; [key: string]: unknown };

export type LandingPage = {
  id: string;
  slug: string;
  title: string;
  headline: string | null;
  sub_headline: string | null;
  hero_image: string | null;
  sections: LandingSection[];
  show_header: boolean;
  show_footer: boolean;
  cta_text: string;
  cta_type: "order_form" | "add_to_cart" | "phone" | "link";
  cta_value: string | null;
  countdown_end: string | null;
  delivery_charge_inside: number | null;
  delivery_charge_outside: number | null;
  meta_title: string | null;
  meta_description: string | null;
  product: ProductDetail | null;
};

export type DeliveryZone = "inside_dhaka" | "outside_dhaka";

export type CheckoutPayload = {
  customer_name: string;
  phone: string;
  email?: string;
  address: string;
  delivery_zone: DeliveryZone;
  notes?: string;
  payment_method: string;
  payment_sender_number?: string;
  payment_txn_ref?: string;
  coupon_code?: string;
  items: { product_id: string; variant_id?: string | null; quantity: number }[];
  device_fingerprint?: string;
  landing_page_slug?: string;
  landing_url?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  utm_id?: string;
  fbclid?: string;
};

export type PlacedOrder = {
  order_number: string;
  total: number;
  subtotal: number;
  discount: number;
  delivery_charge: number;
  items: {
    product_name: string;
    variant_label: string | null;
    quantity: number;
    unit_price: number;
  }[];
  /**
   * Ready to push onto the GTM dataLayer as the browser half of the Lead.
   * `event_id` is generated and stored server-side; the CAPI call sends the same
   * one, which is what lets Meta deduplicate the pair.
   */
  tracking?: {
    event_name: string;
    event_id: string;
    order_id: string;
    currency: string;
    content_type: string;
    content_ids: string[];
    content_name: string;
    num_items: number;
  };
};

export type TrackedOrder = {
  order_number: string;
  status: string;
  timeline: { cancelled: boolean; steps: { label: string; done: boolean }[] };
  order_date: string | null;
  total: number;
  delivery_charge: number;
  items: {
    product_name: string;
    variant_label: string | null;
    quantity: number;
    unit_price: number;
  }[];
};

/* ---------- Admin ---------- */

export type PermissionFlags = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: "user" | "employee" | "manager" | "admin";
  permissions: Record<string, PermissionFlags>;
};

export type AdminOrder = {
  id: string;
  order_number: string;
  status: string;
  status_reason: string | null;
  order_date: string | null;
  order_source: string | null;
  /** First product image, for the row thumbnail in the orders list. */
  thumbnail: string | null;
  customer: { id: string | null; name: string; phone: string | null; address: string | null };
  items_count: number;
  subtotal: number;
  discount: number;
  delivery_charge: number;
  delivery_zone: string | null;
  coupon_code: string | null;
  total: number;
  payment: { method: string | null; sender_number: string | null; txn_ref: string | null };
  notes: string | null;
  items?: OrderItem[];
  consignments?: Consignment[];
  /** Only returned to managers and above — see OrderResource. */
  attribution?: {
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    landing_url: string | null;
    referrer: string | null;
    ip_address: string | null;
    device_fingerprint: string | null;
  } | null;
  created_at: string | null;
};

export type OrderItem = {
  id: string;
  product_id?: string | null;
  variant_id?: string | null;
  product_name: string;
  variant_label: string | null;
  image?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
};

export type Consignment = {
  id: string;
  order_id: string | null;
  courier: string;
  consignment_id: string | null;
  tracking_code: string | null;
  invoice: string | null;
  status: string;
  cod_amount: number;
  courier_charge: number;
  recipient: { name: string | null; phone: string | null; address: string | null };
  delivered_at: string | null;
  returned_at: string | null;
  last_synced_at: string | null;
  created_at: string | null;
};

export type DashboardStats = {
  orders: {
    total: number;
    today: number;
    confirmed: number;
    delivered: number;
    cancelled: number;
    hold: number;
    fake: number;
    pending: number;
  };
  customers: number;
  revenue: { today: number; this_month: number };
  inventory: { low_stock: number; out_of_stock: number; stock_value: number };
};
