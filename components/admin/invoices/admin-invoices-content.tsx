import { AdminInvoicesClient } from "@/components/admin/invoices/admin-invoices-client";
import { serverApiFetch, serverApiFetchEnvelope } from "@/lib/api-server";
import type { Invoice, Semester, UserSummary } from "@/types/api";

export interface AdminInvoicesContentProps {
  searchParams?: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    semesterId?: string;
    sortBy?: string;
    order?: string;
  }>;
}

export async function AdminInvoicesContent({
  searchParams,
}: AdminInvoicesContentProps) {
  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(params.limit) || 10));
  const status = params.status || undefined;
  const semesterId = params.semesterId || undefined;
  const sortBy = params.sortBy || "createdAt";
  const order = params.order === "asc" ? "asc" : "desc";

  const [invoicesResponse, semesters, studentsResponse] = await Promise.all([
    serverApiFetchEnvelope<Invoice[]>("/invoices", {
      params: {
        page,
        limit,
        status,
        semesterId,
        sortBy,
        order,
      },
      currentPath: "/admin/invoices",
    }),
    serverApiFetch<Semester[]>("/semesters", {
      params: { limit: 50, sortBy: "startDate", order: "desc" },
      redirectOnAuthError: false,
    }).catch(() => [] as Semester[]),
    serverApiFetch<UserSummary[]>("/admin/users", {
      params: { role: "STUDENT", limit: 100 },
      redirectOnAuthError: false,
    }).catch(() => [] as UserSummary[]),
  ]);

  const students = studentsResponse.filter((user) =>
    Boolean(user.studentProfile?.id)
  );

  return (
    <AdminInvoicesClient
      invoices={invoicesResponse.data}
      meta={
        invoicesResponse.meta ?? {
          page,
          limit,
          total: invoicesResponse.data.length,
          totalPages: 1,
        }
      }
      semesters={semesters}
      students={students}
    />
  );
}
