import { format, isValid, parseISO } from "date-fns";

/** Normalize Prisma Decimal values (number or numeric string) in one place. */
export function normalizeDecimal(
  value: number | string | null | undefined,
  fallback = 0
): number {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Format monetary values using Intl.NumberFormat. */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency = "USD"
): string {
  const numeric = normalizeDecimal(amount, 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

/** Format ISO date strings or Date instances consistently. */
export function formatDate(
  value: string | Date | null | undefined,
  pattern = "MMM d, yyyy"
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(date)) return "—";
  return format(date, pattern);
}
