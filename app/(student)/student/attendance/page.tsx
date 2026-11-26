import { Suspense } from "react";
import type { Metadata } from "next";

import StudentAttendanceLoading from "@/app/(student)/student/attendance/loading";
import { StudentAttendanceContent } from "@/components/student/student-attendance-content";

export const metadata: Metadata = {
  title: "My Attendance",
};

export default function StudentAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ enrollmentId?: string }>;
}) {
  return (
    <Suspense fallback={<StudentAttendanceLoading />}>
      <StudentAttendanceContent searchParams={searchParams} />
    </Suspense>
  );
}
