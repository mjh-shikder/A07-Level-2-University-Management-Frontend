import { EmptyState } from "@/components/shared/empty-state";
import { StudentDashboardClient } from "@/components/student/student-dashboard-client";
import { serverApiFetch } from "@/lib/api-server";
import type {
  Enrollment,
  Invoice,
  Semester,
  StudentGPASummary,
  UserSummary,
} from "@/types/api";

export async function StudentDashboardContent() {
  const me = await serverApiFetch<UserSummary>("/users/me", {
    currentPath: "/student",
  });

  if (!me.studentProfile) {
    return (
      <EmptyState
        title="Student profile not linked"
        description="Your account does not have an active student profile yet. Contact an administrator to complete onboarding."
      />
    );
  }

  const [semesters, enrollments, gpaSummary, invoices] = await Promise.all([
    serverApiFetch<Semester[]>("/semesters", {
      params: { limit: 50, sortBy: "startDate", order: "desc" },
      redirectOnAuthError: false,
    }).catch(() => [] as Semester[]),
    serverApiFetch<Enrollment[]>("/enrollments/my", {
      params: {
        status: "ENROLLED",
        limit: 100,
        sortBy: "enrolledAt",
        order: "desc",
      },
      currentPath: "/student",
    }),
    serverApiFetch<StudentGPASummary>("/students/me/gpa", {
      redirectOnAuthError: false,
    }).catch(() => null),
    serverApiFetch<Invoice[]>("/invoices/my", {
      params: { limit: 50, sortBy: "dueDate", order: "asc" },
      redirectOnAuthError: false,
    }).catch(() => [] as Invoice[]),
  ]);

  const activeSemester =
    semesters.find((semester) => semester.status === "ACTIVE") ?? null;

  const activeEnrollments = activeSemester
    ? enrollments.filter(
        (enrollment) => enrollment.section.semesterId === activeSemester.id
      )
    : enrollments;

  return (
    <StudentDashboardClient
      student={me}
      activeSemester={activeSemester}
      enrollments={activeEnrollments}
      gpaSummary={gpaSummary}
      invoices={invoices}
    />
  );
}
