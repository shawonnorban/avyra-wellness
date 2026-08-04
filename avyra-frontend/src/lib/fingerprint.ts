/**
 * Best-effort browser fingerprint used by the fraud check to spot repeat orders
 * from the same device even when the IP changes (VPN). Deliberately coarse:
 * it is one signal among several, not an identity, and a changed browser or
 * incognito session legitimately produces a different value.
 */
export function getDeviceFingerprint(): string | undefined {
  if (typeof window === "undefined") return undefined;

  const cached = sessionStorage.getItem("avyra_fp");
  if (cached) return cached;

  const parts = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(navigator.hardwareConcurrency ?? 0),
    canvasSignature(),
  ];

  const fingerprint = `fp_${hash(parts.join("|"))}`;
  sessionStorage.setItem("avyra_fp", fingerprint);

  return fingerprint;
}

/** Rendering differences between GPU/font stacks add entropy. */
function canvasSignature(): string {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "no-canvas";

    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#2e684c";
    ctx.fillRect(0, 0, 100, 20);
    ctx.fillStyle = "#d98c22";
    ctx.fillText("avyra", 2, 2);

    return canvas.toDataURL().slice(-64);
  } catch {
    return "no-canvas";
  }
}

/** FNV-1a — short, stable, and not security-sensitive. */
function hash(input: string): string {
  let h = 0x811c9dc5;

  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }

  return (h >>> 0).toString(36);
}
