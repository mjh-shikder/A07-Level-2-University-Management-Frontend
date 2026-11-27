import { EmptyState } from "@/components/shared/empty-state";
import { StudentBillingClient } from "@/components/student/student-billing-client";
import { serverApiFetch, serverApiFetchEnvelope } from "@/lib/api-server";
import type { Invoice, UserSummary } from "@/types/api";

export interface StudentBillingContentProps {
  searchParams?: Promise<{
    status?: string;
    page?: string;
    limit?: string;
  }>;
}

export async function StudentBillingContent({
  searchParams,
}: StudentBillingContentProps) {
  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(params.limit) || 20));
  const status = params.status || undefined;

  const me = await serverApiFetch<UserSummary>("/users/me", {
    currentPath: "/student/billing",
  });

  if (!me.studentProfile) {
    return (
      <EmptyState
        title="Student profile not linked"
        description="Your account does not have an active student profile yet. Contact an administrator to complete onboarding."
      />
    );
  }

  const invoicesResponse = await serverApiFetchEnvelope<Invoice[]>(
    "/invoices/my",
    {
      params: {
        status,
        page,
        limit,
        sortBy: "dueDate",
        order: "asc",
      },
      currentPath: "/student/billing",
    }
  );

  return (
    <StudentBillingClient
      invoices={invoicesResponse.data}
      meta={
        invoicesResponse.meta ?? {
          page,
          limit,
          total: invoicesResponse.data.length,
          totalPages: 1,
        }
      }
    />
  );
}
