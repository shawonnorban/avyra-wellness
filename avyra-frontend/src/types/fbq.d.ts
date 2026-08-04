/**
 * The Facebook Pixel's global, injected by the base code in
 * `components/facebook-pixel.tsx`. It is absent whenever the pixel is not
 * configured or a blocker has removed it, so every call site guards first.
 */
declare global {
  interface Window {
    fbq?: (
      method: "init" | "track" | "trackCustom",
      eventOrId: string,
      data?: Record<string, unknown>,
      options?: { eventID?: string },
    ) => void;
  }
}

export {};
