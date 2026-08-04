import axios, { AxiosError } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

/**
 * Sanctum SPA auth: the session lives in a cookie, so every request must send
 * credentials and echo the XSRF token Laravel set. Axios handles the echo once
 * xsrfCookieName/xsrfHeaderName are configured.
 */
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  headers: { Accept: "application/json" },
});

/** Laravel serves the CSRF cookie outside /api. */
const CSRF_URL = API_URL.replace(/\/api\/?$/, "") + "/sanctum/csrf-cookie";

let csrfReady: Promise<void> | null = null;

/**
 * Fetches the CSRF cookie once per page load. Concurrent callers share the same
 * in-flight promise, so a burst of mutations does not fire N identical requests.
 */
export function ensureCsrfCookie(): Promise<void> {
  csrfReady ??= axios
    .get(CSRF_URL, { withCredentials: true })
    .then(() => undefined)
    .catch((error) => {
      csrfReady = null; // let the next attempt retry
      throw error;
    });

  return csrfReady;
}

api.interceptors.request.use(async (config) => {
  const method = (config.method ?? "get").toLowerCase();

  if (["post", "put", "patch", "delete"].includes(method)) {
    await ensureCsrfCookie();
  }

  return config;
});

export type ApiErrorShape = {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
  status?: number;
};

/**
 * Normalises an axios failure into something a form can render directly.
 */
export function toApiError(error: unknown): ApiErrorShape {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<{
      message?: string;
      code?: string;
      errors?: Record<string, string[]>;
    }>;

    return {
      message: err.response?.data?.message ?? err.message ?? "Something went wrong.",
      code: err.response?.data?.code,
      errors: err.response?.data?.errors,
      status: err.response?.status,
    };
  }

  return { message: "Something went wrong." };
}

/** First validation message for a field, if the server rejected it. */
export function fieldError(error: ApiErrorShape | null, field: string): string | undefined {
  return error?.errors?.[field]?.[0];
}

export default api;
