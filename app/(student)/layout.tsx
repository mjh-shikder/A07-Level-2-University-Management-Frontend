"use client";

import { type ReactNode } from "react";
import { DashboardShell } from "@/components/shared/dashboard-sidebar";
import { DashboardHeader } from "@/components/shared/dashboard-header";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell
      userRole="STUDENT"
      headerSlot={(onMobileMenuToggle) => (
        <DashboardHeader onMobileMenuToggle={onMobileMenuToggle} />
      )}
    >
      {children}
    </DashboardShell>
  );
}
