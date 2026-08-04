"use client";

import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Plus } from "lucide-react";
import { use, useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Card, Spinner } from "@/components/ui/misc";
import { toApiError, type ApiErrorShape } from "@/lib/api";
import { useAdminLandingPage, useSaveLandingPage, type LandingPageRow } from "@/lib/admin";
import { useProducts } from "@/lib/queries";
import { SECTION_TYPES, SectionEditor, newSection } from "@/components/admin/section-editor";
import type { LandingSection } from "@/lib/types";

type Draft = {
  title: string;
  slug: string;
  product_id: string;
  headline: string;
  sub_headline: string;
  hero_image_path: string | null;
  cta_text: string;
  cta_type: "order_form" | "add_to_cart" | "phone" | "link";
  cta_value: string;
  countdown_end: string;
  delivery_charge_inside: string;
  delivery_charge_outside: string;
  meta_title: string;
  meta_description: string;
  show_header: boolean;
  show_footer: boolean;
  is_active: boolean;
  sections: LandingSection[];
};

const EMPTY: Draft = {
  title: "",
  slug: "",
  product_id: "",
  headline: "",
  sub_headline: "",
  hero_image_path: null,
  cta_text: "অর্ডার করুন",
  cta_type: "order_form",
  cta_value: "",
  countdown_end: "",
  delivery_charge_inside: "",
  delivery_charge_outside: "",
  meta_title: "",
  meta_description: "",
  show_header: false,
  show_footer: false,
  is_active: false,
  sections: [],
};

export default function LandingPageEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";

  const { data: page, isLoading } = useAdminLandingPage(isNew ? null : id);

  // Wait for the record before mounting the form, so the form can seed useState
  // from props rather than syncing itself in an effect.
  if (!isNew && (isLoading || !page)) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="text-primary" />
      </div>
    );
  }

  return <EditorForm id={id} isNew={isNew} initial={page ? toDraft(page) : EMPTY} />;
}

function toDraft(page: LandingPageRow): Draft {
  return {
    title: page.title ?? "",
    slug: page.slug ?? "",
    product_id: page.product_id ?? "",
    headline: page.headline ?? "",
    sub_headline: page.sub_headline ?? "",
    hero_image_path: page.hero_image_path ?? null,
    cta_text: page.cta_text ?? "অর্ডার করুন",
    cta_type: page.cta_type ?? "order_form",
    cta_value: page.cta_value ?? "",
    // <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm", not a full ISO string.
    countdown_end: page.countdown_end ? page.countdown_end.slice(0, 16) : "",
    delivery_charge_inside: page.delivery_charge_inside?.toString() ?? "",
    delivery_charge_outside: page.delivery_charge_outside?.toString() ?? "",
    meta_title: page.meta_title ?? "",
    meta_description: page.meta_description ?? "",
    show_header: page.show_header ?? false,
    show_footer: page.show_footer ?? false,
    is_active: page.is_active ?? false,
    sections: page.sections ?? [],
  };
}

function EditorForm({ id, isNew, initial }: { id: string; isNew: boolean; initial: Draft }) {
  const router = useRouter();
  const { data: productList } = useProducts();
  const save = useSaveLandingPage();

  const [draft, setDraft] = useState<Draft>(initial);
  const [error, setError] = useState<ApiErrorShape | null>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const addSection = (type: string) =>
    setDraft((prev) => ({ ...prev, sections: [...prev.sections, newSection(type)] }));

  const moveSection = (index: number, direction: -1 | 1) =>
    setDraft((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.sections.length) return prev;

      const sections = [...prev.sections];
      [sections[index], sections[target]] = [sections[target], sections[index]];

      return { ...prev, sections };
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Blank optional fields are sent as null so the API stores an absent value
    // rather than an empty string that would later render as "".
    const payload = {
      title: draft.title,
      slug: draft.slug || undefined,
      product_id: draft.product_id || null,
      headline: draft.headline || null,
      sub_headline: draft.sub_headline || null,
      hero_image_path: draft.hero_image_path,
      cta_text: draft.cta_text,
      cta_type: draft.cta_type,
      cta_value: draft.cta_value || null,
      countdown_end: draft.countdown_end || null,
      delivery_charge_inside: draft.delivery_charge_inside === "" ? null : Number(draft.delivery_charge_inside),
      delivery_charge_outside: draft.delivery_charge_outside === "" ? null : Number(draft.delivery_charge_outside),
      meta_title: draft.meta_title || null,
      meta_description: draft.meta_description || null,
      show_header: draft.show_header,
      show_footer: draft.show_footer,
      is_active: draft.is_active,
      sections: draft.sections,
    };

    try {
      const saved = await save.mutateAsync({ id: isNew ? undefined : id, payload });
      toast.success(isNew ? "Landing page created" : "Landing page saved");

      if (isNew) router.replace(`/admin/landing-pages/${saved.id}`);
    } catch (err) {
      const parsed = toApiError(err);
      setError(parsed);
      toast.error(parsed.message);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {isNew ? "New landing page" : draft.title || "Landing page"}
          </h1>
          {draft.slug && <p className="mt-1 text-sm text-muted-foreground">/lp/{draft.slug}</p>}
        </div>

        <div className="flex gap-2">
          {!isNew && draft.slug && (
            <a href={`/lp/${draft.slug}`} target="_blank" rel="noreferrer noopener">
              <Button type="button" variant="outline">
                <ExternalLink className="h-4 w-4" /> Preview
              </Button>
            </a>
          )}
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        {/* Sections */}
        <div className="space-y-4">
          <Card>
            <h2 className="text-base font-semibold text-foreground">Page header</h2>

            <div className="mt-4 space-y-3">
              <Field label="Headline">
                <Input
                  value={draft.headline}
                  onChange={(e) => set("headline", e.target.value)}
                  className="bn"
                />
              </Field>
              <Field label="Sub-headline">
                <Textarea
                  value={draft.sub_headline}
                  onChange={(e) => set("sub_headline", e.target.value)}
                  className="bn min-h-20"
                />
              </Field>
              <ImageUpload
                label="Hero image"
                value={draft.hero_image_path}
                onChange={(path) => set("hero_image_path", path)}
                folder="landing"
              />
            </div>
          </Card>

          {draft.sections.map((section, index) => (
            <SectionEditor
              key={index}
              section={section}
              index={index}
              total={draft.sections.length}
              // Functional updates: reading `draft` from the render closure lost
              // every change but the last when a block was edited twice quickly —
              // which is why only one gallery image ever stuck.
              onChange={(next) =>
                setDraft((prev) => ({
                  ...prev,
                  sections: prev.sections.map((s, i) => (i === index ? next : s)),
                }))
              }
              onMove={(direction) => moveSection(index, direction)}
              onRemove={() =>
                setDraft((prev) => ({
                  ...prev,
                  sections: prev.sections.filter((_, i) => i !== index),
                }))
              }
            />
          ))}

          <Card>
            <h2 className="text-sm font-semibold text-foreground">Add a section</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {SECTION_TYPES.map((item) => (
                <Button
                  key={item.type}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addSection(item.type)}
                  title={item.hint}
                >
                  <Plus className="h-3.5 w-3.5" /> {item.label}
                </Button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              If you do not add an order form, one is appended automatically at the bottom of the page.
            </p>
          </Card>
        </div>

        {/* Settings */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <h2 className="text-sm font-semibold text-foreground">Page settings</h2>

            <div className="mt-4 space-y-3">
              <Field label="Title" required error={error?.errors?.title?.[0]}>
                <Input
                  value={draft.title}
                  onChange={(e) => set("title", e.target.value)}
                  required
                  invalid={Boolean(error?.errors?.title)}
                />
              </Field>

              <Field
                label="Slug"
                hint="Lowercase letters, numbers and hyphens. Generated from the title if left blank."
                error={error?.errors?.slug?.[0]}
              >
                <Input
                  value={draft.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  placeholder="winter-offer"
                  invalid={Boolean(error?.errors?.slug)}
                />
              </Field>

              <Field label="Product" hint="Drives the price and variants in the order form.">
                <Select value={draft.product_id} onChange={(e) => set("product_id", e.target.value)}>
                  <option value="">— none —</option>
                  {(productList?.data ?? []).map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={(e) => set("is_active", e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                Published
              </label>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={draft.show_header}
                  onChange={(e) => set("show_header", e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                Show site header
              </label>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={draft.show_footer}
                  onChange={(e) => set("show_footer", e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                Show site footer
              </label>
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-foreground">Call to action</h2>

            <div className="mt-4 space-y-3">
              <Field label="Button text">
                <Input
                  value={draft.cta_text}
                  onChange={(e) => set("cta_text", e.target.value)}
                  className="bn"
                />
              </Field>

              <Field label="Button action">
                <Select
                  value={draft.cta_type}
                  onChange={(e) => set("cta_type", e.target.value as Draft["cta_type"])}
                >
                  <option value="order_form">Scroll to order form</option>
                  <option value="phone">Call a phone number</option>
                  <option value="link">Open a link</option>
                </Select>
              </Field>

              {draft.cta_type !== "order_form" && (
                <Field label={draft.cta_type === "phone" ? "Phone number" : "URL"} required>
                  <Input value={draft.cta_value} onChange={(e) => set("cta_value", e.target.value)} />
                </Field>
              )}

              <Field label="Countdown ends" hint="Leave blank to hide any countdown block.">
                <Input
                  type="datetime-local"
                  value={draft.countdown_end}
                  onChange={(e) => set("countdown_end", e.target.value)}
                />
              </Field>
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-foreground">Delivery override</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Leave blank to use the store-wide charges.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label="Inside Dhaka">
                <Input
                  type="number"
                  value={draft.delivery_charge_inside}
                  onChange={(e) => set("delivery_charge_inside", e.target.value)}
                  min={0}
                />
              </Field>
              <Field label="Outside Dhaka">
                <Input
                  type="number"
                  value={draft.delivery_charge_outside}
                  onChange={(e) => set("delivery_charge_outside", e.target.value)}
                  min={0}
                />
              </Field>
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-foreground">SEO</h2>

            <div className="mt-4 space-y-3">
              <Field label="Meta title">
                <Input value={draft.meta_title} onChange={(e) => set("meta_title", e.target.value)} />
              </Field>
              <Field label="Meta description">
                <Textarea
                  value={draft.meta_description}
                  onChange={(e) => set("meta_description", e.target.value)}
                  className="min-h-20"
                />
              </Field>
            </div>
          </Card>
        </aside>
      </div>
    </form>
  );
}
