"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  BookUser,
  Building2,
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Library,
  ListOrdered,
  LogOut,
  Receipt,
  ScrollText,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import type { Role } from "@/types/api";

// ─── Nav item types ──────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

// ─── Role-specific nav configs ───────────────────────────────────────────────

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Departments", href: "/admin/departments", icon: Building2 },
  { label: "Programs", href: "/admin/programs", icon: GraduationCap },
  { label: "Courses", href: "/admin/courses", icon: BookOpen },
  { label: "Semesters", href: "/admin/semesters", icon: CalendarDays },
  { label: "Sections", href: "/admin/sections", icon: ListOrdered },
  { label: "Invoices", href: "/admin/invoices", icon: Receipt },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ShieldCheck },
  { label: "Profile", href: "/admin/profile", icon: BookUser },
];

const INSTRUCTOR_NAV: NavItem[] = [
  { label: "Dashboard", href: "/instructor", icon: LayoutDashboard },
  { label: "My Sections", href: "/instructor/sections", icon: Library },
  { label: "Profile", href: "/instructor/profile", icon: BookUser },
];

const STUDENT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/student", icon: LayoutDashboard },
  { label: "Registration", href: "/student/registration", icon: CalendarCheck },
  { label: "My Courses", href: "/student/courses", icon: BookOpen },
  { label: "Attendance", href: "/student/attendance", icon: ClipboardList },
  { label: "Results", href: "/student/results", icon: BarChart3 },
  { label: "Transcript", href: "/student/transcript", icon: ScrollText },
  { label: "Billing", href: "/student/billing", icon: Receipt },
  { label: "Profile", href: "/student/profile", icon: FileText },
];

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  ADMIN: ADMIN_NAV,
  INSTRUCTOR: INSTRUCTOR_NAV,
  STUDENT: STUDENT_NAV,
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin Portal",
  INSTRUCTOR: "Instructor Portal",
  STUDENT: "Student Portal",
};

/** Dashboard roots (exact-match active state) */
const DASHBOARD_ROOTS = new Set(["/admin", "/instructor", "/student"]);

// ─── NavLink ─────────────────────────────────────────────────────────────────

function NavLink({
  item,
  collapsed,
  onClick,
}: {
  item: NavItem;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = DASHBOARD_ROOTS.has(item.href)
    ? pathname === item.href
    : pathname.startsWith(item.href);

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-accent-brand/15 text-accent-brand shadow-[inset_0_0_0_1px_hsl(var(--accent-brand)/0.3)]"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          isActive
            ? "text-accent-brand"
            : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

// ─── Desktop sidebar ─────────────────────────────────────────────────────────

function DesktopSidebar({
  nav,
  roleLabel,
  collapsed,
  onToggleCollapse,
}: {
  nav: NavItem[];
  roleLabel: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const { logoutMutation } = useAuth();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-full border-r border-white/5 bg-background/60 backdrop-blur-xl transition-[width] duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo row */}
      <div
        className={cn(
          "flex items-center gap-2.5 border-b border-white/5 px-4 min-h-14",
          collapsed && "justify-center px-2"
        )}
      >
        <div className="size-7 rounded-lg bg-accent-brand/20 flex items-center justify-center shrink-0">
          <GraduationCap className="size-4 text-accent-brand" />
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold text-foreground truncate">
            {roleLabel}
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {nav.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 p-2 space-y-1">
        <button
          type="button"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && (
            <span>{logoutMutation.isPending ? "Signing out…" : "Sign out"}</span>
          )}
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground",
            collapsed && "justify-center px-2"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn(
              "size-4 shrink-0 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

// ─── Mobile drawer ───────────────────────────────────────────────────────────

function MobileDrawer({
  nav,
  roleLabel,
  open,
  onClose,
}: {
  nav: NavItem[];
  roleLabel: string;
  open: boolean;
  onClose: () => void;
}) {
  const { logoutMutation } = useAuth();

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="left"
        className="glass-strong w-64 p-0 border-r border-white/10 flex flex-col"
      >
        <SheetTitle className="sr-only">{roleLabel} Navigation</SheetTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-4 min-h-14 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-accent-brand/20 flex items-center justify-center">
              <GraduationCap className="size-4 text-accent-brand" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              {roleLabel}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8"
          >
            <X className="size-4" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {nav.map((item) => (
            <NavLink key={item.href} item={item} onClick={onClose} />
          ))}
        </nav>

        {/* Sign out */}
        <div className="border-t border-white/5 p-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              logoutMutation.mutate();
            }}
            disabled={logoutMutation.isPending}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          >
            <LogOut className="size-4 shrink-0" />
            <span>
              {logoutMutation.isPending ? "Signing out…" : "Sign out"}
            </span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface DashboardSidebarProps {
  role: Role;
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function DashboardSidebar({
  role,
  mobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapse,
}: DashboardSidebarProps) {
  const nav = NAV_BY_ROLE[role] ?? STUDENT_NAV;
  const roleLabel = ROLE_LABELS[role] ?? "Portal";

  return (
    <>
      <DesktopSidebar
        nav={nav}
        roleLabel={roleLabel}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
      />
      <MobileDrawer
        nav={nav}
        roleLabel={roleLabel}
        open={mobileOpen}
        onClose={onMobileClose}
      />
    </>
  );
}

// ─── DashboardShell ───────────────────────────────────────────────────────────

function RouteChangeCloser({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname drives the close; onClose is stable
  useEffect(() => {
    onClose();
  }, [pathname]);

  return null;
}

/**
 * Full dashboard chrome: sidebar + header + scrollable main area.
 * Used by each role's layout.tsx.
 */
export function DashboardShell({
  userRole,
  headerSlot,
  children,
}: {
  userRole: Role;
  /** Pass <DashboardHeader onMobileMenuToggle={...} /> bound to the setter. */
  headerSlot: (onMobileMenuToggle: () => void) => React.ReactNode;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden">
      <Suspense fallback={null}>
        <RouteChangeCloser onClose={() => setMobileOpen(false)} />
      </Suspense>
      <Suspense fallback={<div className="hidden w-60 border-r border-white/5 md:block" />}>
        <DashboardSidebar
          role={userRole}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
        />
      </Suspense>
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Suspense fallback={<div className="h-14 border-b border-white/5" />}>
          {headerSlot(() => setMobileOpen(true))}
        </Suspense>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
