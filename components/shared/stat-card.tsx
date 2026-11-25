import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("glass rounded-2xl border-white/10", className)}>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {value}
            </p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Icon className="size-5" aria-hidden="true" />
          </div>
        </div>

        {subtitle || badge ? (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            {subtitle ? (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
            {badge}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
