import {
  ApiError,
  buildQueryString,
  parseApiResponse,
} from "@/lib/api-error";
import type { ApiResponse } from "@/types/api";

const CLIENT_API_BASE = "/api/backend";

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string | number | boolean | null | undefined>;
  skipAuthRefresh?: boolean;
}

/**
 * Deduplicate concurrent refresh calls in the browser so rotating refresh
 * tokens never trigger backend reuse-detection revocation cascades.
 */
let activeRefreshPromise: Promise<boolean> | null = null;

async function refreshSessionClient(): Promise<boolean> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const res = await fetch(`${CLIENT_API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function isAuthEndpoint(path: string): boolean {
  return (
    path.startsWith("/auth/login") ||
    path.startsWith("/auth/register") ||
    path.startsWith("/auth/refresh")
  );
}

let unauthorizedHandler: ((loginUrl: string) => void) | null = null;

/** Register a client router handler (e.g., router.replace) for 401 redirects. */
export function setUnauthorizedHandler(
  handler: ((loginUrl: string) => void) | null
): void {
  unauthorizedHandler = handler;
}

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  const current = window.location.pathname + window.location.search;
  if (
    window.location.pathname === "/login" ||
    window.location.pathname === "/register"
  ) {
    return;
  }
  const loginPath = `/login?next=${encodeURIComponent(current)}`;
  if (unauthorizedHandler) {
    unauthorizedHandler(loginPath);
    return;
  }
  window.location.assign(new URL(loginPath, window.location.origin).toString());
}

async function executeClientRequest<T>(
  path: string,
  options: ApiFetchOptions,
  hasRetried = false
): Promise<ApiResponse<T>> {
  const { body, params, headers, skipAuthRefresh, ...rest } = options;
  const cleanPath = normalizePath(path);
  const query = buildQueryString(params);
  const url = `${CLIENT_API_BASE}${cleanPath}${query}`;

  const requestHeaders = new Headers(headers);
  let serializedBody: BodyInit | undefined;

  if (body !== undefined) {
    if (body instanceof FormData || typeof body === "string") {
      serializedBody = body;
    } else {
      if (!requestHeaders.has("Content-Type")) {
        requestHeaders.set("Content-Type", "application/json");
      }
      serializedBody = JSON.stringify(body);
    }
  }

  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
    body: serializedBody,
    credentials: "include",
  });

  if (
    response.status === 401 &&
    !hasRetried &&
    !skipAuthRefresh &&
    !isAuthEndpoint(cleanPath)
  ) {
    const refreshed = await refreshSessionClient();
    if (refreshed) {
      return executeClientRequest<T>(path, options, true);
    }
    redirectToLogin();
    throw new ApiError(401, "Session expired. Please log in again.");
  }

  return parseApiResponse<T>(response);
}

/** Client-side fetch returning the unwrapped `data` payload. */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const envelope = await executeClientRequest<T>(path, options);
  return envelope.data;
}

/** Client-side fetch returning the full `{ success, message, data, meta }` envelope. */
export async function apiFetchEnvelope<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  return executeClientRequest<T>(path, options);
}
