"use client";

import { useMutation } from "@tanstack/react-query";
import { ImagePlus, Loader2, Star, Trash2, Upload } from "lucide-react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import api, { toApiError } from "@/lib/api";
import { productImageUrl } from "@/lib/format";
import { shrinkImage } from "@/lib/image-resize";

export type UploadFolder = "products" | "banners" | "landing" | "reviews" | "logos" | "avatars";

type StoredUpload = {
  id: string;
  path: string;
  url: string;
  thumbnail_url: string | null;
  original_name: string;
};

/**
 * Validation errors come back keyed `files.0`, `files.1`, … which reads badly in a
 * toast. This turns them into a message naming the file the admin actually picked.
 */
function uploadErrorMessage(error: unknown, files: File[]): string {
  const parsed = toApiError(error);
  const perFile = Object.entries(parsed.errors ?? {}).filter(([key]) => key.startsWith("files."));

  if (perFile.length === 0) return parsed.message;

  return perFile
    .map(([key, messages]) => {
      const name = files[Number(key.split(".")[1])]?.name ?? "That file";
      const reason = messages[0]?.replace(/^The files\.\d+\s*/i, "").trim();

      // PHP rejects anything over upload_max_filesize before Laravel sees it, and
      // the only clue is a bare "failed to upload".
      return /failed to upload/i.test(reason)
        ? `${name} could not be uploaded — the server refused a file this large.`
        : `${name}: ${reason}`;
    })
    .join(" ");
}

function useUpload(folder: UploadFolder) {
  return useMutation({
    mutationFn: async (files: File[]) => {
      // Shrunk client-side so a phone photo cannot trip the PHP upload limit.
      const prepared = await Promise.all(files.map(shrinkImage));

      const body = new FormData();
      body.append("folder", folder);
      prepared.forEach((file) => body.append("files[]", file));

      try {
        const { data } = await api.post<{ data: StoredUpload[] }>("/admin/uploads", body);
        return data.data;
      } catch (error) {
        throw new Error(uploadErrorMessage(error, prepared));
      }
    },
  });
}

/**
 * Single-image field. Stores the upload *path*, never a URL — the API rejects
 * anything that was not uploaded through this endpoint.
 */
export function ImageUpload({
  label,
  value,
  onChange,
  folder,
  hint,
  className,
}: {
  label: string;
  value: string | null;
  onChange: (path: string | null) => void;
  folder: UploadFolder;
  hint?: string;
  className?: string;
}) {
  const inputId = useId();
  const upload = useUpload(folder);

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;

    try {
      const [stored] = await upload.mutateAsync([files[0]]);
      onChange(stored.path);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : toApiError(error).message);
    }
  };

  return (
    <div className={className}>
      <span className="mb-1.5 block text-xs font-medium text-foreground">{label}</span>

      <div className="flex items-start gap-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-sm border border-input bg-secondary">
          {value ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={productImageUrl(value)} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(null)}
                aria-label={`Remove ${label}`}
                className="absolute right-1 top-1 rounded-sm bg-black/60 p-1 text-white hover:bg-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          ) : (
            <label
              htmlFor={inputId}
              className="flex h-full cursor-pointer flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground"
            >
              {upload.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ImagePlus className="h-5 w-5" />
              )}
            </label>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <label
            htmlFor={inputId}
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-sm border border-input bg-background px-3 text-sm hover:bg-secondary"
          >
            <Upload className="h-3.5 w-3.5" />
            {value ? "Replace" : "Upload image"}
          </label>

          <p className="mt-1.5 text-xs text-muted-foreground">
            {hint ?? "JPG, PNG, WEBP or GIF · up to 5 MB"}
          </p>
        </div>
      </div>

      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/**
 * Multi-image field with drag-and-drop. The first image is the primary one, so
 * ordering matters — hence the "make primary" control rather than free sorting.
 */
export function ImageGalleryUpload({
  label,
  value,
  onChange,
  folder,
  max = 10,
  hint,
  showPrimary = false,
}: {
  label: string;
  value: string[];
  onChange: (paths: string[]) => void;
  folder: UploadFolder;
  max?: number;
  hint?: string;
  showPrimary?: boolean;
}) {
  const inputId = useId();
  const upload = useUpload(folder);
  const [dragging, setDragging] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const addFiles = async (files: File[]) => {
    const room = max - value.length;

    if (room <= 0) {
      toast.error(`You can upload at most ${max} images here.`);
      return;
    }

    try {
      const stored = await upload.mutateAsync(files.slice(0, room));
      onChange([...value, ...stored.map((s) => s.path)]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : toApiError(error).message);
    }
  };

  const makePrimary = (index: number) => {
    const next = [...value];
    const [picked] = next.splice(index, 1);
    onChange([picked, ...next]);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">
          {value.length}/{max}
        </span>
      </div>

      <div
        ref={dropRef}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          // Ignore drags moving between children of the drop zone.
          if (!dropRef.current?.contains(e.relatedTarget as Node)) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/")));
        }}
        className={twMerge(
          "rounded-sm border border-dashed p-3 transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-input",
        )}
      >
        {value.length > 0 && (
          <ul className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {value.map((path, i) => (
              <li
                key={`${path}-${i}`}
                className="group relative aspect-square overflow-hidden rounded-sm border border-border bg-secondary"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={productImageUrl(path)} alt="" className="h-full w-full object-cover" />

                {showPrimary && i === 0 && (
                  <span className="absolute left-1 top-1 rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                    Primary
                  </span>
                )}

                <div className="absolute inset-x-1 bottom-1 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {showPrimary && i > 0 && (
                    <button
                      type="button"
                      onClick={() => makePrimary(i)}
                      aria-label="Make primary image"
                      title="Make primary"
                      className="rounded-sm bg-black/60 p-1 text-white hover:bg-primary"
                    >
                      <Star className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((_, index) => index !== i))}
                    aria-label="Remove image"
                    className="rounded-sm bg-black/60 p-1 text-white hover:bg-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor={inputId}
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-sm border border-input bg-background px-3 text-sm hover:bg-secondary"
          >
            {upload.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Add images
          </label>

          <p className="text-xs text-muted-foreground">
            {hint ?? "Drag files here · JPG, PNG, WEBP or GIF · up to 5 MB each"}
          </p>
        </div>
      </div>

      <input
        id={inputId}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          addFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
    </div>
  );
}
