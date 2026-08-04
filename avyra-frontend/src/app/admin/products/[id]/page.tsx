"use client";

import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { use, useState } from "react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { ImageGalleryUpload, ImageUpload } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge, Card, Spinner } from "@/components/ui/misc";
import { toApiError, type ApiErrorShape } from "@/lib/api";
import {
  useAdminProduct,
  useDeleteProduct,
  useDeleteVariant,
  useMe,
  useSaveProduct,
  useSaveVariant,
  useStockMovements,
  useWarehouses,
  type AdminProduct,
  type AdminVariant,
} from "@/lib/admin";
import { formatDateTime, formatTaka } from "@/lib/format";

type Draft = {
  sku: string;
  slug: string;
  name: string;
  tagline: string;
  product_label: string;
  facility_label: string;
  category: string;
  short_description: string;
  description: string;
  long_description: string;
  terms_conditions: string;
  meta_title: string;
  meta_description: string;
  warehouse: string;
  quantity: string;
  min_stock: string;
  cost_price: string;
  sell_price: string;
  is_active: boolean;
  images: string[];
  gallery_images: string[];
  ingredients: { name: string; benefit?: string }[];
  faqs: { q: string; a: string }[];
  delivery_info: string[];
};

const EMPTY: Draft = {
  sku: "",
  slug: "",
  name: "",
  tagline: "",
  product_label: "",
  facility_label: "",
  category: "",
  short_description: "",
  description: "",
  long_description: "",
  terms_conditions: "",
  meta_title: "",
  meta_description: "",
  warehouse: "",
  quantity: "0",
  min_stock: "20",
  cost_price: "0",
  sell_price: "0",
  is_active: true,
  images: [],
  gallery_images: [],
  ingredients: [],
  faqs: [],
  delivery_info: [],
};

const TABS = ["Basics", "Content", "Variants", "Stock"] as const;

export default function ProductEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";

  const { data: product, isLoading } = useAdminProduct(isNew ? null : id);

  // Wait for the record before mounting the form so it can seed useState from props.
  if (!isNew && (isLoading || !product)) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="text-primary" />
      </div>
    );
  }

  return <EditorForm id={id} isNew={isNew} initial={product ? toDraft(product) : EMPTY} product={product} />;
}

function toDraft(p: AdminProduct): Draft {
  return {
    sku: p.sku ?? "",
    slug: p.slug ?? "",
    name: p.name ?? "",
    tagline: p.tagline ?? "",
    product_label: p.product_label ?? "",
    facility_label: p.facility_label ?? "",
    category: p.category ?? "",
    short_description: p.short_description ?? "",
    description: p.description ?? "",
    long_description: p.long_description ?? "",
    terms_conditions: p.terms_conditions ?? "",
    meta_title: p.meta_title ?? "",
    meta_description: p.meta_description ?? "",
    warehouse: p.warehouse ?? "",
    quantity: String(p.quantity ?? 0),
    min_stock: String(p.min_stock ?? 20),
    cost_price: String(p.cost_price ?? 0),
    sell_price: String(p.sell_price ?? 0),
    is_active: p.is_active ?? true,
    images: p.images ?? [],
    gallery_images: p.gallery_images ?? [],
    ingredients: p.ingredients ?? [],
    faqs: p.faqs ?? [],
    delivery_info: p.delivery_info ?? [],
  };
}

function EditorForm({
  id,
  isNew,
  initial,
  product,
}: {
  id: string;
  isNew: boolean;
  initial: Draft;
  product?: AdminProduct;
}) {
  const router = useRouter();
  const save = useSaveProduct();
  const remove = useDeleteProduct();
  const { data: me } = useMe();
  const { data: warehouses } = useWarehouses();

  const canDelete = me?.permissions.inventory?.delete ?? false;

  const confirmDelete = async () => {
    if (!window.confirm(`Delete “${draft.name}”? Products already on an order are deactivated instead.`)) {
      return;
    }

    try {
      const result = await remove.mutateAsync(id);
      toast.success(result.message);
      router.replace("/admin/products");
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  const [tab, setTab] = useState<(typeof TABS)[number]>("Basics");
  const [draft, setDraft] = useState<Draft>(initial);
  const [error, setError] = useState<ApiErrorShape | null>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: Record<string, unknown> = {
      sku: draft.sku,
      slug: draft.slug || null,
      name: draft.name,
      tagline: draft.tagline || null,
      product_label: draft.product_label || null,
      facility_label: draft.facility_label || null,
      category: draft.category || null,
      short_description: draft.short_description || null,
      description: draft.description || null,
      long_description: draft.long_description || null,
      terms_conditions: draft.terms_conditions || null,
      meta_title: draft.meta_title || null,
      meta_description: draft.meta_description || null,
      warehouse: draft.warehouse || null,
      min_stock: Number(draft.min_stock),
      cost_price: Number(draft.cost_price),
      sell_price: Number(draft.sell_price),
      is_active: draft.is_active,
      images: draft.images,
      gallery_images: draft.gallery_images,
      ingredients: draft.ingredients,
      faqs: draft.faqs,
      delivery_info: draft.delivery_info,
    };

    // Quantity is an opening balance on create only; afterwards stock moves
    // exclusively through the ledger.
    if (isNew) payload.quantity = Number(draft.quantity);

    try {
      const saved = await save.mutateAsync({ id: isNew ? undefined : id, payload });
      toast.success(isNew ? "Product created" : "Product saved");

      if (isNew) router.replace(`/admin/products/${saved.id}`);
    } catch (err) {
      const parsed = toApiError(err);
      setError(parsed);
      toast.error(parsed.message);
    }
  };

  const err = (field: string) => error?.errors?.[field]?.[0];

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {isNew ? "New product" : draft.name || "Product"}
          </h1>
          {draft.sku && <p className="mt-1 text-sm text-muted-foreground">SKU {draft.sku}</p>}
        </div>

        <div className="flex gap-2">
          {!isNew && draft.slug && (
            <a href={`/shop/${draft.slug}`} target="_blank" rel="noreferrer noopener">
              <Button type="button" variant="outline">
                <ExternalLink className="h-4 w-4" /> View
              </Button>
            </a>
          )}
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>

          {!isNew && canDelete && (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10"
              onClick={confirmDelete}
              disabled={remove.isPending}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => {
          // Variants and the ledger only exist once the product has been saved.
          const disabled = isNew && (item === "Variants" || item === "Stock");

          return (
            <button
              key={item}
              type="button"
              disabled={disabled}
              onClick={() => setTab(item)}
              aria-pressed={tab === item}
              className={twMerge(
                "rounded-full border px-4 py-1.5 text-sm transition-colors disabled:opacity-40",
                tab === item
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-card text-foreground hover:bg-secondary",
              )}
            >
              {item}
            </button>
          );
        })}
      </div>

      {tab === "Basics" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
          <Card className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">Details</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required error={err("name")}>
                <Input value={draft.name} onChange={(e) => set("name", e.target.value)} required invalid={Boolean(err("name"))} />
              </Field>
              <Field label="SKU" required error={err("sku")}>
                <Input value={draft.sku} onChange={(e) => set("sku", e.target.value)} required invalid={Boolean(err("sku"))} />
              </Field>
              <Field label="Slug" hint="Used in the shop URL. Generated from the name if blank." error={err("slug")}>
                <Input value={draft.slug} onChange={(e) => set("slug", e.target.value)} />
              </Field>
              <Field label="Category">
                <Input value={draft.category} onChange={(e) => set("category", e.target.value)} />
              </Field>
              <Field label="Tagline">
                <Input value={draft.tagline} onChange={(e) => set("tagline", e.target.value)} />
              </Field>
              <Field label="Badge" hint='e.g. "Best Seller"'>
                <Input value={draft.product_label} onChange={(e) => set("product_label", e.target.value)} />
              </Field>
            </div>

            <Field label="Short description">
              <Textarea
                value={draft.short_description}
                onChange={(e) => set("short_description", e.target.value)}
                className="min-h-16"
              />
            </Field>

            <ImageGalleryUpload
              label="Product images"
              value={draft.images}
              onChange={(v) => set("images", v)}
              folder="products"
              max={10}
              showPrimary
            />

            <ImageGalleryUpload
              label="Gallery"
              value={draft.gallery_images}
              onChange={(v) => set("gallery_images", v)}
              folder="products"
              max={20}
            />
          </Card>

          <div className="space-y-4">
            <Card className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Pricing</h2>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Cost price" error={err("cost_price")}>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={draft.cost_price}
                    onChange={(e) => set("cost_price", e.target.value)}
                  />
                </Field>
                <Field label="Sell price" error={err("sell_price")}>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={draft.sell_price}
                    onChange={(e) => set("sell_price", e.target.value)}
                  />
                </Field>
              </div>
            </Card>

            <Card className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Stock</h2>

              {isNew ? (
                <Field label="Opening stock" hint="Recorded as an opening-balance movement.">
                  <Input
                    type="number"
                    min={0}
                    value={draft.quantity}
                    onChange={(e) => set("quantity", e.target.value)}
                  />
                </Field>
              ) : (
                <p className="text-sm text-muted-foreground">
                  On hand: <span className="font-semibold text-foreground">{product?.quantity ?? 0}</span>
                  <br />
                  Change it from the Stock tab so the ledger stays accurate.
                </p>
              )}

              <Field label="Low-stock threshold">
                <Input
                  type="number"
                  min={0}
                  value={draft.min_stock}
                  onChange={(e) => set("min_stock", e.target.value)}
                />
              </Field>

              <Field label="Default warehouse">
                <Select value={draft.warehouse} onChange={(e) => set("warehouse", e.target.value)}>
                  <option value="">— none —</option>
                  {(warehouses ?? []).map((w) => (
                    <option key={w.id} value={w.name}>{w.name}</option>
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
                Visible in the shop
              </label>
            </Card>
          </div>
        </div>
      )}

      {tab === "Content" && (
        <div className="space-y-5">
          <Card className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">Descriptions</h2>

            <Field label="Description">
              <Textarea value={draft.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <Field label="Long description">
              <Textarea
                value={draft.long_description}
                onChange={(e) => set("long_description", e.target.value)}
                className="min-h-40"
              />
            </Field>
            <Field label="Facility label" hint="Small print under the buy box.">
              <Input value={draft.facility_label} onChange={(e) => set("facility_label", e.target.value)} />
            </Field>
            <Field label="Terms & conditions">
              <Textarea value={draft.terms_conditions} onChange={(e) => set("terms_conditions", e.target.value)} />
            </Field>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">Ingredients</h2>

            <RepeatableRows
              rows={draft.ingredients}
              onChange={(rows) => set("ingredients", rows)}
              empty={{ name: "", benefit: "" }}
              addLabel="Add ingredient"
              fields={[
                { key: "name", label: "Name" },
                { key: "benefit", label: "Benefit", multiline: true },
              ]}
            />
          </Card>

          <Card className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">FAQs</h2>

            <RepeatableRows
              rows={draft.faqs}
              onChange={(rows) => set("faqs", rows)}
              empty={{ q: "", a: "" }}
              addLabel="Add question"
              fields={[
                { key: "q", label: "Question" },
                { key: "a", label: "Answer", multiline: true },
              ]}
            />
          </Card>

          <Card className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">Delivery bullets</h2>
            <Field label="One line per bullet">
              <Textarea
                value={draft.delivery_info.join("\n")}
                onChange={(e) =>
                  set(
                    "delivery_info",
                    e.target.value.split("\n").map((l) => l.trim()).filter(Boolean),
                  )
                }
                className="min-h-24"
              />
            </Field>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">SEO</h2>
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
          </Card>
        </div>
      )}

      {tab === "Variants" && !isNew && <VariantsTab productId={id} variants={product?.variants ?? []} />}
      {tab === "Stock" && !isNew && <StockTab productId={id} />}
    </form>
  );
}

/* ---------- Variants ---------- */

type VariantDraft = {
  size: string;
  color: string;
  sku_suffix: string;
  image_path: string | null;
  quantity: string;
  cost_price: string;
  sell_price: string;
  compare_at_price: string;
};

const BLANK_VARIANT: VariantDraft = {
  size: "",
  color: "",
  sku_suffix: "",
  image_path: null,
  quantity: "0",
  cost_price: "0",
  sell_price: "0",
  compare_at_price: "",
};

function toVariantDraft(variant: AdminVariant): VariantDraft {
  return {
    size: variant.size ?? "",
    color: variant.color ?? "",
    sku_suffix: variant.sku_suffix ?? "",
    image_path: variant.image_path ?? null,
    quantity: String(variant.quantity ?? 0),
    cost_price: String(variant.cost_price ?? 0),
    sell_price: String(variant.sell_price ?? 0),
    compare_at_price: variant.compare_at_price != null ? String(variant.compare_at_price) : "",
  };
}

function VariantsTab({ productId, variants }: { productId: string; variants: AdminVariant[] }) {
  const save = useSaveVariant();
  const remove = useDeleteVariant();

  // null = closed, "new" = the create form, otherwise the variant being edited.
  const [editing, setEditing] = useState<AdminVariant | "new" | null>(null);

  const submit = async (draft: VariantDraft) => {
    const isNew = editing === "new";

    const payload: Record<string, unknown> = {
      size: draft.size || null,
      color: draft.color || null,
      sku_suffix: draft.sku_suffix,
      image_path: draft.image_path,
      cost_price: Number(draft.cost_price),
      sell_price: Number(draft.sell_price),
      compare_at_price: draft.compare_at_price === "" ? null : Number(draft.compare_at_price),
    };

    // Quantity is an opening balance on create only; afterwards stock moves
    // exclusively through the ledger.
    if (isNew) {
      payload.quantity = Number(draft.quantity);
      payload.is_active = true;
    }

    try {
      await save.mutateAsync({
        productId,
        variantId: isNew ? undefined : (editing as AdminVariant).id,
        payload,
      });
      setEditing(null);
      toast.success(isNew ? "Variant added" : "Variant saved");
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  const toggleActive = async (variant: AdminVariant) => {
    try {
      await save.mutateAsync({
        productId,
        variantId: variant.id,
        payload: { is_active: !variant.is_active },
      });
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  const confirmRemoveVariant = async (variant: AdminVariant) => {
    const label = [variant.size, variant.color].filter(Boolean).join(" / ") || variant.sku_suffix;

    if (!window.confirm(`Delete the “${label}” variant?`)) return;

    try {
      await remove.mutateAsync({ productId, variantId: variant.id });
      toast.success("Variant deleted");
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-0">
        {variants.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No variants. The product sells at its own price.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-3 pl-4 pr-4 font-medium">Variant</th>
                <th className="py-3 pr-4 font-medium">SKU suffix</th>
                <th className="py-3 pr-4 text-right font-medium">Stock</th>
                <th className="py-3 pr-4 text-right font-medium">Price</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 pr-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {variants.map((variant) => (
                <tr key={variant.id}>
                  <td className="py-3 pl-4 pr-4 font-medium text-foreground">
                    {[variant.size, variant.color].filter(Boolean).join(" / ") || "—"}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{variant.sku_suffix}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{variant.quantity}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">
                    {variant.compare_at_price != null && variant.compare_at_price > variant.sell_price && (
                      <s className="mr-1.5 text-xs text-muted-foreground">
                        {formatTaka(variant.compare_at_price)}
                      </s>
                    )}
                    {formatTaka(variant.sell_price)}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={variant.is_active ? "success" : "neutral"}>
                      {variant.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(variant)}
                        aria-label={`Edit ${variant.sku_suffix}`}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => toggleActive(variant)}>
                        {variant.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => confirmRemoveVariant(variant)}
                        disabled={remove.isPending}
                        aria-label="Delete variant"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {editing ? (
        <VariantForm
          // Remounts when a different variant is picked, so the form reseeds.
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? BLANK_VARIANT : toVariantDraft(editing)}
          isNew={editing === "new"}
          saving={save.isPending}
          onSubmit={submit}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <Button type="button" variant="outline" onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> Add variant
        </Button>
      )}

      {variants.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Deactivating hides a variant from the shop while keeping it on past orders. Deleting
          removes it outright, so prefer deactivating for anything that has sold.
        </p>
      )}
    </div>
  );
}

function VariantForm({
  initial,
  isNew,
  saving,
  onSubmit,
  onCancel,
}: {
  initial: VariantDraft;
  isNew: boolean;
  saving: boolean;
  onSubmit: (draft: VariantDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<VariantDraft>(initial);
  const set = (patch: Partial<VariantDraft>) => setDraft((prev) => ({ ...prev, ...patch }));

  return (
    <Card className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">{isNew ? "New variant" : "Edit variant"}</h3>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Size">
          <Input value={draft.size} onChange={(e) => set({ size: e.target.value })} />
        </Field>
        <Field label="Colour">
          <Input value={draft.color} onChange={(e) => set({ color: e.target.value })} />
        </Field>
        <Field label="SKU suffix" required>
          <Input value={draft.sku_suffix} onChange={(e) => set({ sku_suffix: e.target.value })} />
        </Field>

        {isNew ? (
          <Field label="Opening stock">
            <Input type="number" min={0} value={draft.quantity} onChange={(e) => set({ quantity: e.target.value })} />
          </Field>
        ) : (
          <Field label="Stock" hint="Change it from the Stock tab so the ledger stays accurate.">
            <Input value={draft.quantity} disabled />
          </Field>
        )}

        <Field label="Cost price">
          <Input type="number" step="0.01" min={0} value={draft.cost_price} onChange={(e) => set({ cost_price: e.target.value })} />
        </Field>
        <Field label="Sell price">
          <Input type="number" step="0.01" min={0} value={draft.sell_price} onChange={(e) => set({ sell_price: e.target.value })} />
        </Field>
        <Field label="Compare-at price" hint="Struck through on campaign pages to show the saving.">
          <Input
            type="number"
            step="0.01"
            min={0}
            value={draft.compare_at_price}
            onChange={(e) => set({ compare_at_price: e.target.value })}
          />
        </Field>
      </div>

      <ImageUpload
        label="Variant image"
        value={draft.image_path}
        onChange={(path) => set({ image_path: path })}
        folder="products"
      />

      <div className="flex gap-2">
        <Button type="button" onClick={() => onSubmit(draft)} disabled={saving || !draft.sku_suffix}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : isNew ? "Add variant" : "Save variant"}
        </Button>
        <Button type="button" variant="subtle" onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
}

/* ---------- Stock ledger ---------- */

function StockTab({ productId }: { productId: string }) {
  const { data, isLoading } = useStockMovements(productId);
  const movements = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="text-primary" />
      </div>
    );
  }

  return (
    <Card className="p-0">
      {movements.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">No stock movements yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-3 pl-4 pr-4 font-medium">When</th>
              <th className="py-3 pr-4 font-medium">Type</th>
              <th className="py-3 pr-4 font-medium">Reference</th>
              <th className="py-3 pr-4 text-right font-medium">Change</th>
              <th className="py-3 pr-4 font-medium">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {movements.map((m) => (
              <tr key={m.id}>
                <td className="py-3 pl-4 pr-4 text-xs text-muted-foreground">{formatDateTime(m.created_at)}</td>
                <td className="py-3 pr-4">
                  <Badge tone={Number(m.change_qty) >= 0 ? "success" : "danger"}>{m.movement_type}</Badge>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">{m.reference_type ?? "—"}</td>
                <td
                  className={twMerge(
                    "py-3 pr-4 text-right font-medium tabular-nums",
                    Number(m.change_qty) >= 0 ? "text-success" : "text-destructive",
                  )}
                >
                  {Number(m.change_qty) > 0 ? "+" : ""}
                  {m.change_qty}
                </td>
                <td className="py-3 pr-4 text-muted-foreground">{m.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

/* ---------- Shared repeatable editor ---------- */

function RepeatableRows<T extends Record<string, string | undefined>>({
  rows,
  onChange,
  fields,
  empty,
  addLabel,
}: {
  rows: T[];
  onChange: (rows: T[]) => void;
  fields: { key: keyof T & string; label: string; multiline?: boolean }[];
  empty: T;
  addLabel: string;
}) {
  return (
    <>
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="rounded-sm border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
              <button
                type="button"
                onClick={() => onChange(rows.filter((_, index) => index !== i))}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove item"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {fields.map((field) => (
                <Field key={field.key} label={field.label}>
                  {field.multiline ? (
                    <Textarea
                      value={row[field.key] ?? ""}
                      onChange={(e) =>
                        onChange(rows.map((r, idx) => (idx === i ? { ...r, [field.key]: e.target.value } : r)))
                      }
                      className="min-h-16"
                    />
                  ) : (
                    <Input
                      value={row[field.key] ?? ""}
                      onChange={(e) =>
                        onChange(rows.map((r, idx) => (idx === i ? { ...r, [field.key]: e.target.value } : r)))
                      }
                    />
                  )}
                </Field>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button type="button" size="sm" variant="outline" onClick={() => onChange([...rows, empty])}>
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </Button>
    </>
  );
}
