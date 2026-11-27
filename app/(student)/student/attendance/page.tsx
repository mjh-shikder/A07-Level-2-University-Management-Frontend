import { Suspense } from "react";
import type { Metadata } from "next";

import StudentAttendanceLoading from "@/app/(student)/student/attendance/loading";
import { StudentAttendanceContent } from "@/components/student/student-attendance-content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "My Attendance",
  description:
    "Track attendance rates and dated class session logs across your enrolled courses.",
});

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
