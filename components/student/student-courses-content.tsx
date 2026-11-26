import { EmptyState } from "@/components/shared/empty-state";
import { StudentCoursesClient } from "@/components/student/student-courses-client";
import { serverApiFetch } from "@/lib/api-server";
import type { Enrollment, Semester, UserSummary } from "@/types/api";

export async function StudentCoursesContent() {
  const me = await serverApiFetch<UserSummary>("/users/me", {
    currentPath: "/student/courses",
  });

  if (!me.studentProfile) {
    return (
      <EmptyState
        title="Student profile not linked"
        description="Your account does not have an active student profile yet. Contact an administrator to complete onboarding."
      />
    );
  }

  const [enrollments, semesters] = await Promise.all([
    serverApiFetch<Enrollment[]>("/enrollments/my", {
      params: { limit: 100, sortBy: "enrolledAt", order: "desc" },
      currentPath: "/student/courses",
    }),
    serverApiFetch<Semester[]>("/semesters", {
      params: { limit: 50, sortBy: "startDate", order: "desc" },
      redirectOnAuthError: false,
    }).catch(() => [] as Semester[]),
  ]);

  const activeSemester =
    semesters.find((semester) => semester.status === "ACTIVE") ?? null;

  return (
    <StudentCoursesClient
      enrollments={enrollments}
      activeSemester={activeSemester}
    />
  );
}
