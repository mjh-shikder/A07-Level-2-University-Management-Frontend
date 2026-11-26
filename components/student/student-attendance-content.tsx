import { EmptyState } from "@/components/shared/empty-state";
import { StudentAttendanceClient } from "@/components/student/student-attendance-client";
import { serverApiFetch } from "@/lib/api-server";
import type {
  AttendanceRecord,
  AttendanceSummary,
  Enrollment,
  UserSummary,
} from "@/types/api";

export interface StudentAttendanceContentProps {
  searchParams?: Promise<{
    enrollmentId?: string;
  }>;
}

export async function StudentAttendanceContent({
  searchParams,
}: StudentAttendanceContentProps) {
  const params = searchParams ? await searchParams : {};

  const me = await serverApiFetch<UserSummary>("/users/me", {
    currentPath: "/student/attendance",
  });

  if (!me.studentProfile) {
    return (
      <EmptyState
        title="Student profile not linked"
        description="Your account does not have an active student profile yet. Contact an administrator to complete onboarding."
      />
    );
  }

  const enrollments = await serverApiFetch<Enrollment[]>("/enrollments/my", {
    params: { limit: 100, sortBy: "enrolledAt", order: "desc" },
    currentPath: "/student/attendance",
  });

  const nonDropped = enrollments.filter((e) => e.status !== "DROPPED");
  const defaultEnrollment =
    nonDropped.find((e) => e.id === params.enrollmentId) ??
    nonDropped.find((e) => e.status === "ENROLLED") ??
    nonDropped[0] ??
    null;

  const [initialSummary, initialRecords] = defaultEnrollment
    ? await Promise.all([
        serverApiFetch<AttendanceSummary>(
          `/enrollments/${defaultEnrollment.id}/attendance/summary`,
          { redirectOnAuthError: false }
        ).catch(() => null),
        serverApiFetch<AttendanceRecord[]>(
          `/enrollments/${defaultEnrollment.id}/attendance`,
          {
            params: { limit: 100, sortBy: "date", order: "desc" },
            redirectOnAuthError: false,
          }
        ).catch(() => [] as AttendanceRecord[]),
      ])
    : [null, [] as AttendanceRecord[]];

  return (
    <StudentAttendanceClient
      enrollments={nonDropped}
      initialEnrollmentId={defaultEnrollment?.id ?? ""}
      initialSummary={initialSummary}
      initialRecords={initialRecords}
    />
  );
}
