import { Suspense } from "react";
import type { Metadata } from "next";

import AdminDashboardLoading from "@/app/(admin)/admin/loading";
import { AdminDashboardContent } from "@/components/admin/admin-dashboard-content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Admin Dashboard",
  description:
    "System overview with user statistics, active semester metrics, revenue charts, and recent audit events.",
});

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminDashboardLoading />}>
      <AdminDashboardContent />
    </Suspense>
  );
}
