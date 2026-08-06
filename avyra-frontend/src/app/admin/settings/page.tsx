"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import {
  ImageGalleryUpload,
  ImageUpload,
  type UploadFolder,
} from "@/components/admin/image-uploader";
import { BannersTab, PermissionsTab, StaffTab } from "@/components/admin/settings-tabs";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Card, Spinner } from "@/components/ui/misc";
import { toApiError } from "@/lib/api";
import { useAdminSettings, useSaveSetting } from "@/lib/admin";

type SettingField = {
  /** Dot-notation reaches into a nested object, e.g. `social.facebook`. */
  name: string;
  label: string;
  type?: "text" | "number" | "checkbox" | "textarea" | "image" | "gallery";
  hint?: string;
  folder?: UploadFolder;
  /** `gallery` only: how many images the field accepts. */
  max?: number;
};

/** Reads a possibly-nested value by dot path. */
function readField(values: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>(
    (acc, part) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[part] : undefined),
    values,
  );
}

/** Returns a copy of `values` with the dot path set, creating objects as needed. */
function writeField(
  values: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const [head, ...rest] = path.split(".");

  if (rest.length === 0) return { ...values, [head]: value };

  const branch = values[head];
  const nested = branch && typeof branch === "object" ? (branch as Record<string, unknown>) : {};

  return { ...values, [head]: writeField(nested, rest.join("."), value) };
}

/** Which keys appear as tabs, and how each field is labelled and typed. */
const GROUPS: {
  /** Tab identity. */
  key: string;
  label: string;
  description?: string;
  /** The settings row this tab writes to; defaults to `key`. */
  settingKey?: string;
  fields: SettingField[];
}[] = [
  {
    key: "company",
    label: "Company",
    fields: [
      { name: "name", label: "Company name" },
      { name: "tagline", label: "Tagline" },
      { name: "slogan", label: "Slogan" },
      {
        name: "scroll_text",
        label: "Promotional ticker",
        hint: "Scrolls above the storefront header. Leave blank to hide the bar.",
      },
      { name: "email", label: "Support email" },
      { name: "phone", label: "Phone" },
      { name: "whatsapp", label: "WhatsApp number", hint: "Shown to customers whose order is blocked." },
      { name: "address", label: "Address", type: "textarea" },
      { name: "logo_path", label: "Logo", type: "image", folder: "logos" },
      { name: "currency_symbol", label: "Currency symbol" },
    ],
  },
  {
    key: "company_social",
    label: "Social",
    description: "Full profile URLs. A blank field hides that icon in the storefront footer.",
    // Stored inside the `company` group under a nested `social` object.
    settingKey: "company",
    fields: [
      { name: "social.facebook", label: "Facebook", hint: "https://facebook.com/…" },
      { name: "social.instagram", label: "Instagram", hint: "https://instagram.com/…" },
      { name: "social.youtube", label: "YouTube", hint: "https://youtube.com/@…" },
      { name: "social.tiktok", label: "TikTok", hint: "https://tiktok.com/@…" },
      { name: "messenger", label: "Messenger", hint: "https://m.me/…" },
    ],
  },
  {
    key: "delivery",
    label: "Delivery",
    fields: [
      { name: "inside_dhaka_charge", label: "Inside Dhaka charge", type: "number" },
      { name: "outside_dhaka_charge", label: "Outside Dhaka charge", type: "number" },
      { name: "free_delivery_above", label: "Free delivery above", type: "number", hint: "Leave blank to always charge." },
      { name: "delivery_discount_enabled", label: "Discount the delivery charge", type: "checkbox" },
      {
        name: "delivery_discount",
        label: "Delivery discount",
        type: "number",
        hint: "Flat amount off delivery, shown as its own line. Set it to the charge itself for free delivery.",
      },
    ],
  },
  {
    key: "policies",
    label: "Policies",
    description: "Shown on the storefront policy pages linked from the footer. Blank lines start a new paragraph.",
    fields: [
      { name: "returns", label: "Returns policy", type: "textarea" },
      { name: "shipping", label: "Shipping policy", type: "textarea" },
      { name: "terms", label: "Terms of service", type: "textarea" },
      { name: "privacy", label: "Privacy policy", type: "textarea" },
    ],
  },
  {
    key: "campaign_slider",
    label: "Campaign Slider",
    description:
      "The images beside the order form on /avyravitalplus. They play in the order shown — use the arrows to reorder. With no images set, the product's own photo is used instead.",
    fields: [
      {
        name: "images",
        label: "Slides",
        type: "gallery",
        folder: "landing",
        max: 12,
        hint: "Drop images here or click Add. Portrait or square works best — each one is cropped to the height of the order form.",
      },
      {
        name: "interval_seconds",
        label: "Seconds per slide",
        type: "number",
        hint: "Minimum 2. Defaults to 5.",
      },
    ],
  },
  {
    key: "purchase_popup",
    label: "Social proof",
    description:
      "The small “just ordered” card on the campaign pages. These are staff-written examples, not real customer records.",
    fields: [
      { name: "enabled", label: "Show the popup", type: "checkbox" },
      {
        name: "interval_seconds",
        label: "Seconds between popups",
        type: "number",
        hint: "Minimum 8. The first one appears a few seconds after the page loads.",
      },
      {
        name: "entries",
        label: "Names",
        type: "textarea",
        hint: "One per line, as “নাম | জেলা”. A random one is shown each time.",
      },
    ],
  },
  {
    key: "payment",
    label: "Payment",
    fields: [
      { name: "cod_enabled", label: "Cash on delivery enabled", type: "checkbox" },
      { name: "bkash_number", label: "bKash number" },
      { name: "nagad_number", label: "Nagad number" },
      { name: "rocket_number", label: "Rocket number" },
    ],
  },
  {
    key: "courier_steadfast",
    label: "Courier",
    description: "Steadfast (Packzy) merchant credentials. Saved keys show as ******** and stay unchanged unless you retype them.",
    fields: [
      { name: "enabled", label: "Enabled", type: "checkbox" },
      { name: "base_url", label: "API base URL" },
      { name: "api_key", label: "API key" },
      { name: "secret_key", label: "Secret key" },
      { name: "webhook_token", label: "Webhook bearer token", hint: "Give Steadfast: POST /api/webhooks/courier/steadfast" },
      { name: "auto_sync", label: "Poll for status every 5 minutes", type: "checkbox" },
    ],
  },
  {
    key: "sms",
    label: "SMS / OTP",
    fields: [
      { name: "provider", label: "Provider", hint: "bulksmsbd, or leave blank to log codes instead of sending." },
      { name: "api_key", label: "API key" },
      { name: "sender_id", label: "Sender ID" },
      { name: "otp_template", label: "OTP message", hint: "Use {otp} where the code should appear." },
      { name: "otp_expiry_minutes", label: "Code expiry (minutes)", type: "number" },
      { name: "otp_max_attempts", label: "Max attempts", type: "number" },
    ],
  },
  {
    key: "order",
    label: "Orders",
    fields: [
      { name: "require_otp", label: "Require phone verification at checkout", type: "checkbox" },
      { name: "auto_confirm", label: "Auto-confirm new website orders", type: "checkbox" },
    ],
  },
  {
    key: "pixels",
    label: "Tracking",
    fields: [
      { name: "facebook_pixel_id", label: "Facebook Pixel ID" },
      { name: "tiktok_pixel_id", label: "TikTok Pixel ID" },
      { name: "gtag_id", label: "Google gtag ID" },
    ],
  },
  {
    key: "meta_capi",
    label: "Meta CAPI",
    description: "Server-side Conversions API. The access token is never sent to the browser.",
    fields: [
      { name: "enabled", label: "Enabled", type: "checkbox" },
      { name: "pixel_id", label: "Pixel ID" },
      { name: "access_token", label: "Access token" },
      { name: "test_event_code", label: "Test event code" },
    ],
  },
];

/** Tabs backed by their own screen rather than the generic key/value form. */
const CUSTOM_TABS = [
  { key: "__banners", label: "Shop Banners" },
  { key: "__staff", label: "Staff" },
  { key: "__permissions", label: "Permissions" },
] as const;

export default function AdminSettingsPage() {
  const { data, isLoading } = useAdminSettings();
  const [active, setActive] = useState<string>(GROUPS[0].key);

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="text-primary" />
      </div>
    );
  }

  const group = GROUPS.find((g) => g.key === active);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Admin only.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[...GROUPS, ...CUSTOM_TABS].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActive(item.key)}
            aria-pressed={active === item.key}
            className={twMerge(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              active === item.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-card text-foreground hover:bg-secondary",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {active === "__banners" && <BannersTab />}
      {active === "__staff" && <StaffTab />}
      {active === "__permissions" && <PermissionsTab />}

      {group && (
        <SettingGroupForm
          key={group.key}
          groupKey={group.settingKey ?? group.key}
          description={group.description}
          fields={group.fields}
          initial={data[group.settingKey ?? group.key] ?? {}}
        />
      )}
    </div>
  );
}

function SettingGroupForm({
  groupKey,
  description,
  fields,
  initial,
}: {
  groupKey: string;
  description?: string;
  fields: SettingField[];
  initial: Record<string, unknown>;
}) {
  const save = useSaveSetting();
  // Seeded once. The parent remounts this via `key` when the tab changes, and a
  // background refetch deliberately does not clobber edits in progress.
  const [values, setValues] = useState<Record<string, unknown>>(initial);

  // Field names may be dot paths, so writes go through writeField.
  const set = (name: string, value: unknown) => setValues((prev) => writeField(prev, name, value));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // The API merges into the stored row, so sending only this tab's keys is safe.
      await save.mutateAsync({ key: groupKey, value: values });
      toast.success("Settings saved");
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  return (
    <form onSubmit={submit}>
      <Card>
        {description && <p className="mb-5 text-sm text-muted-foreground">{description}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => {
            const value = readField(values, field.name);

            if (field.type === "image") {
              return (
                <div key={field.name} className="sm:col-span-2">
                  <ImageUpload
                    label={field.label}
                    value={typeof value === "string" && value ? value : null}
                    onChange={(path) => set(field.name, path)}
                    folder={field.folder ?? "logos"}
                    hint={field.hint}
                  />
                </div>
              );
            }

            if (field.type === "gallery") {
              return (
                <div key={field.name} className="sm:col-span-2">
                  <ImageGalleryUpload
                    label={field.label}
                    value={Array.isArray(value) ? (value as string[]) : []}
                    onChange={(paths) => set(field.name, paths)}
                    folder={field.folder ?? "landing"}
                    max={field.max ?? 10}
                    hint={field.hint}
                    showReorder
                  />
                </div>
              );
            }

            if (field.type === "checkbox") {
              return (
                <label key={field.name} className="flex items-center gap-2 self-end pb-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) => set(field.name, e.target.checked)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  {field.label}
                </label>
              );
            }

            return (
              <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : undefined}>
                <Field label={field.label} hint={field.hint}>
                  {field.type === "textarea" ? (
                    <Textarea
                      value={String(value ?? "")}
                      onChange={(e) => set(field.name, e.target.value)}
                      className="min-h-20"
                    />
                  ) : (
                    <Input
                      type={field.type === "number" ? "number" : "text"}
                      value={value === null || value === undefined ? "" : String(value)}
                      onChange={(e) =>
                        set(
                          field.name,
                          field.type === "number"
                            ? e.target.value === ""
                              ? null
                              : Number(e.target.value)
                            : e.target.value,
                        )
                      }
                    />
                  )}
                </Field>
              </div>
            );
          })}
        </div>

        <Button type="submit" className="mt-6" disabled={save.isPending}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </Card>
    </form>
  );
}
