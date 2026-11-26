import { EmptyState } from "@/components/shared/empty-state";
import { StudentRegistrationClient } from "@/components/student/student-registration-client";
import { serverApiFetch, serverApiFetchEnvelope } from "@/lib/api-server";
import type {
  Enrollment,
  Invoice,
  Section,
  Semester,
  UserSummary,
} from "@/types/api";

export interface StudentRegistrationContentProps {
  searchParams?: Promise<{
    q?: string;
    page?: string;
    limit?: string;
  }>;
}

export async function StudentRegistrationContent({
  searchParams,
}: StudentRegistrationContentProps) {
  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(params.limit) || 12));
  const q = params.q?.trim() || undefined;

  const me = await serverApiFetch<UserSummary>("/users/me", {
    currentPath: "/student/registration",
  });

  if (!me.studentProfile) {
    return (
      <EmptyState
        title="Student profile not linked"
        description="Your account does not have an active student profile yet. Contact an administrator to complete onboarding."
      />
    );
  }

  const [semesters, enrollments, invoices] = await Promise.all([
    serverApiFetch<Semester[]>("/semesters", {
      params: { limit: 50, sortBy: "startDate", order: "desc" },
      redirectOnAuthError: false,
    }).catch(() => [] as Semester[]),
    serverApiFetch<Enrollment[]>("/enrollments/my", {
      params: { status: "ENROLLED", limit: 100 },
      currentPath: "/student/registration",
    }),
    serverApiFetch<Invoice[]>("/invoices/my", {
      params: { limit: 50 },
      redirectOnAuthError: false,
    }).catch(() => [] as Invoice[]),
  ]);

  const activeSemester =
    semesters.find((semester) => semester.status === "ACTIVE") ?? null;

  const sectionsResponse = activeSemester
    ? await serverApiFetchEnvelope<Section[]>("/sections", {
        params: {
          semesterId: activeSemester.id,
          q,
          page,
          limit,
          sortBy: "createdAt",
          order: "desc",
        },
        currentPath: "/student/registration",
      })
    : {
        success: true,
        message: "No active semester",
        data: [] as Section[],
        meta: { page: 1, limit, total: 0, totalPages: 1 },
      };

  const activeEnrollments = activeSemester
    ? enrollments.filter(
        (enrollment) => enrollment.section.semesterId === activeSemester.id
      )
    : [];

  const hasUnpaidInvoices = invoices.some(
    (invoice) => invoice.status === "PENDING" || invoice.status === "OVERDUE"
  );

  return (
    <StudentRegistrationClient
      activeSemester={activeSemester}
      sections={sectionsResponse.data}
      meta={
        sectionsResponse.meta ?? {
          page,
          limit,
          total: sectionsResponse.data.length,
          totalPages: 1,
        }
      }
      activeEnrollments={activeEnrollments}
      hasUnpaidInvoices={hasUnpaidInvoices}
    />
  );
}
