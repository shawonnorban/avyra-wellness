"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { ImageGalleryUpload, ImageUpload } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import type { LandingSection } from "@/lib/types";

/** Block types the builder can add, in the order they appear in the picker. */
export const SECTION_TYPES: { type: string; label: string; hint: string }[] = [
  { type: "hero", label: "Hero", hint: "Big image, heading and a CTA button" },
  { type: "features", label: "Feature list", hint: "Short benefit cards in a grid" },
  { type: "richtext", label: "Rich text", hint: "Free-form HTML paragraph block" },
  { type: "gallery", label: "Image gallery", hint: "Product or lifestyle photos" },
  { type: "reviews", label: "Customer reviews", hint: "Screenshots of customer feedback" },
  { type: "video", label: "Video", hint: "Embedded YouTube video" },
  { type: "countdown", label: "Countdown", hint: "Uses the page's countdown deadline" },
  { type: "faq", label: "FAQ", hint: "Expandable question and answer pairs" },
  { type: "order_form", label: "Order form", hint: "Inline checkout — add this last" },
];

export function newSection(type: string): LandingSection {
  switch (type) {
    case "hero":
      return { type, heading: "", sub: "", image: null, cta: "" };
    case "features":
      return { type, heading: "", items: [{ title: "", body: "" }] };
    case "richtext":
      return { type, html: "" };
    case "gallery":
    case "reviews":
      return { type, heading: "", images: [] };
    case "video":
      return { type, heading: "", url: "" };
    case "faq":
      return { type, heading: "", items: [{ q: "", a: "" }] };
    default:
      return { type, heading: "" };
  }
}

export function SectionEditor({
  section,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  section: LandingSection;
  index: number;
  total: number;
  onChange: (next: LandingSection) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const meta = SECTION_TYPES.find((s) => s.type === section.type);
  const set = (patch: Record<string, unknown>) => onChange({ ...section, ...patch } as LandingSection);


  return (
    <div className="rounded-xl border border-border bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {index + 1}. {meta?.label ?? section.type}
          </p>
          {meta && <p className="truncate text-xs text-muted-foreground">{meta.hint}</p>}
        </div>

        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label="Move section up"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label="Move section down"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onRemove}
            aria-label="Remove section"
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {section.type === "hero" && (
          <>
            <Field label="Heading">
              <Input
                value={String(section.heading ?? "")}
                onChange={(e) => set({ heading: e.target.value })}
                className="bn"
              />
            </Field>
            <Field label="Sub-heading">
              <Textarea
                value={String(section.sub ?? "")}
                onChange={(e) => set({ sub: e.target.value })}
                className="bn min-h-20"
              />
            </Field>
            <ImageUpload
              label="Image"
              value={typeof section.image === "string" && section.image ? section.image : null}
              onChange={(path) => set({ image: path })}
              folder="landing"
            />
            <Field label="Button text" hint="Leave blank to use the page's default CTA.">
              <Input value={String(section.cta ?? "")} onChange={(e) => set({ cta: e.target.value })} className="bn" />
            </Field>
          </>
        )}

        {section.type === "richtext" && (
          <Field label="HTML content" hint="Basic tags only — headings, paragraphs, lists, links.">
            <Textarea
              value={String(section.html ?? "")}
              onChange={(e) => set({ html: e.target.value })}
              className="min-h-40 font-mono text-xs"
            />
          </Field>
        )}

        {section.type === "video" && (
          <>
            <Field label="Heading">
              <Input
                value={String(section.heading ?? "")}
                onChange={(e) => set({ heading: e.target.value })}
                className="bn"
              />
            </Field>
            <Field label="YouTube URL">
              <Input
                value={String(section.url ?? "")}
                onChange={(e) => set({ url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </Field>
          </>
        )}

        {(section.type === "gallery" || section.type === "reviews") && (
          <>
            <Field label="Heading">
              <Input
                value={String(section.heading ?? "")}
                onChange={(e) => set({ heading: e.target.value })}
                className="bn"
              />
            </Field>
            <ImageGalleryUpload
              label={section.type === "reviews" ? "Review screenshots" : "Gallery images"}
              value={Array.isArray(section.images) ? (section.images as string[]) : []}
              onChange={(images) => set({ images })}
              folder={section.type === "reviews" ? "reviews" : "landing"}
              max={section.type === "reviews" ? 30 : 5}
              showPrimary={section.type === "gallery"}
              hint={
                section.type === "gallery"
                  ? "First image is the wide banner; the next four sit in a row beneath it."
                  : "Screenshots scroll in a carousel — add as many as you like."
              }
            />
          </>
        )}

        {section.type === "features" && (
          <RepeatableEditor
            heading={String(section.heading ?? "")}
            onHeadingChange={(heading) => set({ heading })}
            items={Array.isArray(section.items) ? (section.items as { title: string; body?: string }[]) : []}
            onItemsChange={(items) => set({ items })}
            fields={[
              { key: "title", label: "Title" },
              { key: "body", label: "Description", multiline: true },
            ]}
            emptyItem={{ title: "", body: "" }}
            addLabel="Add feature"
          />
        )}

        {section.type === "faq" && (
          <RepeatableEditor
            heading={String(section.heading ?? "")}
            onHeadingChange={(heading) => set({ heading })}
            items={Array.isArray(section.items) ? (section.items as { q: string; a: string }[]) : []}
            onItemsChange={(items) => set({ items })}
            fields={[
              { key: "q", label: "Question" },
              { key: "a", label: "Answer", multiline: true },
            ]}
            emptyItem={{ q: "", a: "" }}
            addLabel="Add question"
          />
        )}

        {(section.type === "countdown" || section.type === "order_form") && (
          <Field label="Heading">
            <Input
              value={String(section.heading ?? "")}
              onChange={(e) => set({ heading: e.target.value })}
              className="bn"
            />
          </Field>
        )}
      </div>
    </div>
  );
}

function RepeatableEditor<T extends Record<string, string | undefined>>({
  heading,
  onHeadingChange,
  items,
  onItemsChange,
  fields,
  emptyItem,
  addLabel,
}: {
  heading: string;
  onHeadingChange: (value: string) => void;
  items: T[];
  onItemsChange: (items: T[]) => void;
  fields: { key: keyof T & string; label: string; multiline?: boolean }[];
  emptyItem: T;
  addLabel: string;
}) {
  const update = (index: number, key: string, value: string) =>
    onItemsChange(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));

  return (
    <>
      <Field label="Heading">
        <Input value={heading} onChange={(e) => onHeadingChange(e.target.value)} className="bn" />
      </Field>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
              <button
                type="button"
                onClick={() => onItemsChange(items.filter((_, index) => index !== i))}
                className="text-xs text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>

            <div className="space-y-2">
              {fields.map((field) => (
                <Field key={field.key} label={field.label}>
                  {field.multiline ? (
                    <Textarea
                      value={item[field.key] ?? ""}
                      onChange={(e) => update(i, field.key, e.target.value)}
                      className="bn min-h-20"
                    />
                  ) : (
                    <Input
                      value={item[field.key] ?? ""}
                      onChange={(e) => update(i, field.key, e.target.value)}
                      className="bn"
                    />
                  )}
                </Field>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button type="button" size="sm" variant="outline" onClick={() => onItemsChange([...items, emptyItem])}>
        {addLabel}
      </Button>
    </>
  );
}
