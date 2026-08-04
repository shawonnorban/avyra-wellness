/**
 * Downscales an image in the browser before it is uploaded.
 *
 * The server re-encodes and caps the longest edge anyway, so sending the original
 * bytes buys nothing — and a phone photo easily exceeds PHP's `upload_max_filesize`
 * (2 MB on a default WAMP install), which rejects the request before Laravel can
 * report anything useful. Shrinking here keeps uploads working regardless of how
 * the PHP host is configured.
 */

/** Longest edge sent to the server. Generous: the server caps it again per folder. */
const MAX_EDGE = 2400;

/** WebP quality for the re-encode. */
const QUALITY = 0.85;

/** Files at or below this are sent untouched — re-encoding them would be wasteful. */
const SKIP_BELOW_BYTES = 400 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };

    img.src = url;
  });
}

/**
 * Returns a smaller WebP copy, or the original file when shrinking is unnecessary
 * or not possible (animated GIFs, SVGs, or a browser that cannot encode WebP).
 */
export async function shrinkImage(file: File): Promise<File> {
  // An animated GIF would lose its frames, and an SVG has no pixel size to cap.
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;
  if (file.size <= SKIP_BELOW_BYTES) return file;

  try {
    const img = await loadImage(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", QUALITY),
    );

    // Keep the original if the browser refused, or if it somehow came out larger.
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch {
    // A failure here is not fatal — let the server decide.
    return file;
  }
}
