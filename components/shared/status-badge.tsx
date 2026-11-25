import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BadgeTone = "success" | "warning" | "danger" | "neutral" | "brand";

const STATUS_TONE_MAP: Record<string, BadgeTone> = {
  // Positive / Active
  ACTIVE: "brand",
  ENROLLED: "brand",
  COMPLETED: "success",
  PRESENT: "success",
  PUBLISHED: "success",
  PAID: "success",
  SUCCESS: "success",

  // Pending / In-progress
  UPCOMING: "warning",
  PENDING: "warning",
  INITIATED: "warning",
  LATE: "warning",
  DRAFT: "warning",

  // Neutral / Inactive
  INACTIVE: "neutral",
  EXCUSED: "neutral",

  // Negative / Blocked
  SUSPENDED: "danger",
  DROPPED: "danger",
  ABSENT: "danger",
  OVERDUE: "danger",
  CANCELLED: "danger",
  FAILED: "danger",
};

const TONE_CLASSES: Record<BadgeTone, string> = {
  brand:
    "border-primary/35 bg-primary/15 text-primary dark:text-primary",
  success:
    "border-emerald-500/35 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  warning:
    "border-amber-500/35 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  danger:
    "border-destructive/35 bg-destructive/15 text-destructive dark:text-red-300",
  neutral:
    "border-border bg-secondary/60 text-muted-foreground",
};

export interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

function formatStatusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ""))
    .join(" ");
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const normalized = status.toUpperCase();
  const tone = STATUS_TONE_MAP[normalized] ?? "neutral";

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", TONE_CLASSES[tone], className)}
    >
      {label ?? formatStatusLabel(status)}
    </Badge>
  );
}
