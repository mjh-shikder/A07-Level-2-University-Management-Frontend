"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu } from "lucide-react";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getRoleDashboardPath } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/api";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/programs", label: "Programs" },
  { href: "/tuition-faq", label: "Tuition & FAQ" },
  { href: "/contact", label: "Contact" },
];

export interface PublicNavbarUser {
  firstName: string;
  role: Role;
}

export function PublicNavbar({
  initialUser,
}: {
  initialUser: PublicNavbarUser | null;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardHref = initialUser
    ? getRoleDashboardPath(initialUser.role)
    : null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/5 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-base font-semibold tracking-tight text-foreground"
        >
          <span
            className="size-2.5 rounded-full bg-primary glow-brand"
            aria-hidden="true"
          />
          UniManage
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-1 md:flex"
        >
          {NAV_LINKS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <div className="hidden items-center gap-2 sm:flex">
            {dashboardHref ? (
              <Button asChild size="sm">
                <Link href={dashboardHref}>
                  Open Portal
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="md:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="size-4" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  UniManage
                </SheetTitle>
              </SheetHeader>
              <nav
                aria-label="Mobile navigation"
                className="flex flex-col gap-1 px-4"
              >
                {NAV_LINKS.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto flex flex-col gap-2.5 p-4">
                {dashboardHref ? (
                  <Button asChild className="w-full">
                    <Link
                      href={dashboardHref}
                      onClick={() => setMobileOpen(false)}
                    >
                      Open Portal
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/login" onClick={() => setMobileOpen(false)}>
                        Login
                      </Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link
                        href="/register"
                        onClick={() => setMobileOpen(false)}
                      >
                        Get started
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
