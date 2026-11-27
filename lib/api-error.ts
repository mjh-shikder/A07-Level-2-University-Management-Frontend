import type { ApiErrorResponse, ApiResponse } from "@/types/api";

export interface FieldError {
  field: string;
  message: string;
}

/** Strip `body.` or `query.` prefixes from backend Zod validation field paths. */
export function stripFieldPrefix(field: string | number | undefined): string {
  if (field === undefined || field === null) return "";
  return String(field).replace(/^(body|query|params)\./, "");
}

/** Parse Retry-After header (seconds or HTTP date) into whole seconds. */
export function parseRetryAfter(headerValue: string | null): number | undefined {
  if (!headerValue) return undefined;
  const seconds = Number(headerValue);
  if (!Number.isNaN(seconds) && seconds >= 0) {
    return Math.ceil(seconds);
  }
  const targetDate = Date.parse(headerValue);
  if (!Number.isNaN(targetDate)) {
    const diffSeconds = Math.ceil((targetDate - Date.now()) / 1000);
    return Math.max(diffSeconds, 0);
  }
  return undefined;
}

/** Typed API error thrown by both client and server apiFetch helpers. */
export class ApiError extends Error {
  public readonly status: number;
  public readonly errors: FieldError[];
  public readonly retryAfter?: number;

  constructor(
    status: number,
    message: string,
    errors: FieldError[] = [],
    retryAfter?: number
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.retryAfter = retryAfter;
  }

  /** Map backend field errors into a flat `{ fieldName: message }` dictionary for RHF. */
  public getFieldErrors(): Record<string, string> {
    const mapped: Record<string, string> = {};
    for (const err of this.errors) {
      if (err.field && !mapped[err.field]) {
        mapped[err.field] = err.message;
      }
    }
    return mapped;
  }
}

/** Normalize query parameters into URLSearchParams, enforcing `order` (never `sortOrder`). */
export function buildQueryString(
  params?: Record<string, string | number | boolean | null | undefined>
): string {
  if (!params) return "";
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    // Enforce AGENTS.md convention: always send `order`, never `sortOrder`.
    const normalizedKey = key === "sortOrder" ? "order" : key;
    searchParams.set(normalizedKey, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

/** Parse a backend JSON response envelope and throw ApiError on failure. */
export async function parseApiResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {
  const retryAfter =
    response.status === 429
      ? parseRetryAfter(response.headers.get("Retry-After"))
      : undefined;

  let payload: ApiResponse<T> | ApiErrorResponse | null = null;
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      payload = (await response.json()) as ApiResponse<T> | ApiErrorResponse;
    } catch {
      payload = null;
    }
  }

  if (!response.ok || !payload?.success) {
    const errPayload = payload as ApiErrorResponse | null;
    const message =
      errPayload?.message ||
      response.statusText ||
      `Request failed with status ${response.status}`;

    const fieldErrors: FieldError[] = Array.isArray(errPayload?.errors)
      ? errPayload.errors
          .map((item) => ({
            field: stripFieldPrefix(item.field),
            message: item.message,
          }))
          .filter((item) => item.message.length > 0)
      : [];

    throw new ApiError(response.status, message, fieldErrors, retryAfter);
  }

  return payload as ApiResponse<T>;
}
