"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type SortOrder = "asc" | "desc";

export interface UseUrlStateOptions {
  defaultPage?: number;
  defaultLimit?: number;
  defaultSortBy?: string;
  defaultOrder?: SortOrder;
}

export interface SetParamOptions {
  /** Reset `page` to 1 when updating this parameter (defaults to true). */
  resetPage?: boolean;
}

function parsePositiveInt(raw: string | null, fallback: number, max?: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  if (max !== undefined && parsed > max) return max;
  return parsed;
}

/**
 * Synchronizes search (`q`), filters, sorting (`sortBy`, `order=asc|desc`),
 * and pagination (`page`, `limit`) with URL search params.
 */
export function useUrlState(options: UseUrlStateOptions = {}) {
  const {
    defaultPage = 1,
    defaultLimit = 10,
    defaultSortBy,
    defaultOrder = "desc",
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parsePositiveInt(searchParams.get("page"), defaultPage);
  const limit = parsePositiveInt(searchParams.get("limit"), defaultLimit, 100);
  const q = searchParams.get("q") ?? "";
  const sortBy = searchParams.get("sortBy") ?? defaultSortBy;

  const rawOrder = searchParams.get("order");
  const order: SortOrder =
    rawOrder === "asc" || rawOrder === "desc" ? rawOrder : defaultOrder;

  const navigateWithParams = useCallback(
    (params: URLSearchParams) => {
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  const getParam = useCallback(
    (key: string, fallback = ""): string => {
      return searchParams.get(key) ?? fallback;
    },
    [searchParams]
  );

  const setParams = useCallback(
    (
      updates: Record<string, string | number | null | undefined>,
      paramOptions: SetParamOptions = {}
    ) => {
      const { resetPage = true } = paramOptions;
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }

      if (resetPage && !("page" in updates)) {
        params.delete("page");
      }

      navigateWithParams(params);
    },
    [navigateWithParams, searchParams]
  );

  const setParam = useCallback(
    (
      key: string,
      value: string | number | null | undefined,
      paramOptions: SetParamOptions = {}
    ) => {
      setParams({ [key]: value }, paramOptions);
    },
    [setParams]
  );

  const setPage = useCallback(
    (nextPage: number) => {
      const safePage = Math.max(1, nextPage);
      setParams(
        { page: safePage <= 1 ? null : safePage },
        { resetPage: false }
      );
    },
    [setParams]
  );

  const setLimit = useCallback(
    (nextLimit: number) => {
      const safeLimit = Math.min(100, Math.max(1, nextLimit));
      setParams({ limit: safeLimit, page: null }, { resetPage: false });
    },
    [setParams]
  );

  const setSearch = useCallback(
    (nextQuery: string) => {
      const trimmed = nextQuery.trim();
      setParams({ q: trimmed || null }, { resetPage: true });
    },
    [setParams]
  );

  const toggleSort = useCallback(
    (column: string) => {
      const isSameColumn = sortBy === column;
      const nextOrder: SortOrder = isSameColumn
        ? order === "asc"
          ? "desc"
          : "asc"
        : "asc";

      setParams(
        {
          sortBy: column,
          order: nextOrder,
        },
        { resetPage: true }
      );
    },
    [order, setParams, sortBy]
  );

  const resetParams = useCallback(
    (keys?: string[]) => {
      if (!keys || keys.length === 0) {
        router.replace(pathname, { scroll: false });
        return;
      }
      const params = new URLSearchParams(searchParams.toString());
      for (const key of keys) {
        params.delete(key);
      }
      navigateWithParams(params);
    },
    [navigateWithParams, pathname, router, searchParams]
  );

  return useMemo(
    () => ({
      searchParams,
      page,
      limit,
      q,
      sortBy,
      order,
      getParam,
      setParam,
      setParams,
      setPage,
      setLimit,
      setSearch,
      toggleSort,
      resetParams,
    }),
    [
      searchParams,
      page,
      limit,
      q,
      sortBy,
      order,
      getParam,
      setParam,
      setParams,
      setPage,
      setLimit,
      setSearch,
      toggleSort,
      resetParams,
    ]
  );
}
