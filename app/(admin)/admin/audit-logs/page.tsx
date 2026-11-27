import { Suspense } from "react";
import type { Metadata } from "next";

import AdminAuditLogsLoading from "@/app/(admin)/admin/audit-logs/loading";
import { AdminAuditLogsContent } from "@/components/admin/audit-logs/admin-audit-logs-content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "System Audit Logs",
  description:
    "Explore chronological system audit logs with actor metadata and before/after state snapshots.",
});

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
