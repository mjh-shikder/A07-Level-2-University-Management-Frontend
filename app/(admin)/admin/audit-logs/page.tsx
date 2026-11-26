import { Suspense } from "react";
import type { Metadata } from "next";

import AdminAuditLogsLoading from "@/app/(admin)/admin/audit-logs/loading";
import { AdminAuditLogsContent } from "@/components/admin/audit-logs/admin-audit-logs-content";

export const metadata: Metadata = {
  title: "System Audit Logs",
};

export default function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    entity?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }>;
}) {
  return (
    <Suspense fallback={<AdminAuditLogsLoading />}>
      <AdminAuditLogsContent searchParams={searchParams} />
    </Suspense>
  );
}
