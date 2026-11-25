"use client";

import { type ReactNode } from "react";
import { DashboardShell } from "@/components/shared/dashboard-sidebar";
import { DashboardHeader } from "@/components/shared/dashboard-header";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell
      userRole="ADMIN"
      headerSlot={(onMobileMenuToggle) => (
        <DashboardHeader onMobileMenuToggle={onMobileMenuToggle} />
      )}
    >
      {children}
    </DashboardShell>
  );
}
