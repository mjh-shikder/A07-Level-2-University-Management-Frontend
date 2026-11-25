import { Suspense } from "react";
import type { Metadata } from "next";

import AdminDashboardLoading from "@/app/(admin)/admin/loading";
import { AdminDashboardContent } from "@/components/admin/admin-dashboard-content";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminDashboardLoading />}>
      <AdminDashboardContent />
    </Suspense>
  );
}
