import { AdminAuditLogsClient } from "@/components/admin/audit-logs/admin-audit-logs-client";
import { serverApiFetchEnvelope } from "@/lib/api-server";
import type { AuditLog } from "@/types/api";

export interface AdminAuditLogsContentProps {
  searchParams?: Promise<{
    page?: string;
    limit?: string;
    entity?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export async function AdminAuditLogsContent({
  searchParams,
}: AdminAuditLogsContentProps) {
  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(params.limit) || 20));
  const entity = params.entity?.trim() || undefined;
  const action = params.action?.trim() || undefined;
  const startDate = params.startDate || undefined;
  const endDate = params.endDate || undefined;

  const logsResponse = await serverApiFetchEnvelope<AuditLog[]>(
    "/admin/audit-logs",
    {
      params: {
        page,
        limit,
        entity,
        action,
        startDate,
        endDate,
      },
      currentPath: "/admin/audit-logs",
    }
  );

  return (
    <AdminAuditLogsClient
      logs={logsResponse.data}
      meta={
        logsResponse.meta ?? {
          page,
          limit,
          total: logsResponse.data.length,
          totalPages: 1,
        }
      }
    />
  );
}
