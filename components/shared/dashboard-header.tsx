"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserNav } from "@/components/shared/user-nav";
import { cn } from "@/lib/utils";

/** Converts a URL segment to a human-readable label. */
function segmentToLabel(segment: string): string {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Returns the breadcrumb trail from the current pathname, skipping the root. */
function buildBreadcrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((part, idx) => ({
    label: segmentToLabel(part),
    href: `/${parts.slice(0, idx + 1).join("/")}`,
    isLast: idx === parts.length - 1,
  }));
}

interface DashboardHeaderProps {
  /** Called when the mobile menu toggle is clicked. */
  onMobileMenuToggle?: () => void;
  className?: string;
}

export function DashboardHeader({
  onMobileMenuToggle,
  className,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const breadcrumbs = buildBreadcrumbs(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/5 bg-background/80 backdrop-blur-xl px-4 md:px-6",
        className
      )}
    >
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="size-10 md:hidden shrink-0"
        onClick={onMobileMenuToggle}
        aria-label="Toggle sidebar"
      >
        <Menu className="size-5" />
      </Button>

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex-1 min-w-0">
        <ol className="flex items-center gap-1 text-sm flex-wrap">
          {breadcrumbs.map((crumb, i) => (
            <li key={crumb.href} className="flex items-center gap-1 min-w-0">
              {i > 0 && (
                <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
              )}
              {crumb.isLast ? (
                <span className="font-medium text-foreground truncate">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors truncate"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Right-side actions */}
      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}
