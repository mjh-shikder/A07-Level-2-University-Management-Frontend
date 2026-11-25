import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ApiError,
  buildQueryString,
  parseApiResponse,
} from "@/lib/api-error";
import type { ApiResponse } from "@/types/api";

const BACKEND_INTERNAL_URL = (
  process.env.BACKEND_INTERNAL_URL || "http://localhost:5000/api/v1"
).replace(/\/+$/, "");

export interface ServerApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string | number | boolean | null | undefined>;
  /** Set to false to throw ApiError(401) instead of redirecting to /login. */
  redirectOnAuthError?: boolean;
  /** Path passed as `?next=` when redirecting to /login on 401. */
  currentPath?: string;
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

async function refreshAccessTokenServer(
  cookieHeader: string
): Promise<string | null> {
  try {
    const res = await fetch(`${BACKEND_INTERNAL_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const envelope = (await res.json()) as ApiResponse<{
      accessToken?: string;
    }>;
    return envelope.data?.accessToken ?? null;
  } catch {
    return null;
  }
}

async function executeServerRequest<T>(
  path: string,
  options: ServerApiFetchOptions,
  overrideAccessToken?: string
): Promise<ApiResponse<T>> {
  const {
    body,
    params,
    headers,
    redirectOnAuthError = true,
    currentPath,
    ...rest
  } = options;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const cleanPath = normalizePath(path);
  const query = buildQueryString(params);
  const url = `${BACKEND_INTERNAL_URL}${cleanPath}${query}`;

  const requestHeaders = new Headers(headers);
  if (cookieHeader) {
    requestHeaders.set("Cookie", cookieHeader);
  }
  if (overrideAccessToken) {
    requestHeaders.set("Authorization", `Bearer ${overrideAccessToken}`);
  }

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
    cache: rest.cache ?? "no-store",
  });

  if (response.status === 401 && !overrideAccessToken) {
    const hasRefreshCookie = Boolean(cookieStore.get("refreshToken")?.value);

    if (hasRefreshCookie) {
      const newAccessToken = await refreshAccessTokenServer(cookieHeader);
      if (newAccessToken) {
        return executeServerRequest<T>(path, options, newAccessToken);
      }
    }

    if (redirectOnAuthError) {
      const loginUrl = currentPath
        ? `/login?next=${encodeURIComponent(currentPath)}`
        : "/login";
      redirect(loginUrl);
    }

    throw new ApiError(401, "Unauthorized. Please log in again.");
  }

  return parseApiResponse<T>(response);
}

/** Server-side fetch returning the unwrapped `data` payload. */
export async function serverApiFetch<T>(
  path: string,
  options: ServerApiFetchOptions = {}
): Promise<T> {
  const envelope = await executeServerRequest<T>(path, options);
  return envelope.data;
}

/** Server-side fetch returning the full `{ success, message, data, meta }` envelope. */
export async function serverApiFetchEnvelope<T>(
  path: string,
  options: ServerApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  return executeServerRequest<T>(path, options);
}
