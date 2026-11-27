import { Suspense } from "react";
import type { Metadata } from "next";

import StudentDashboardLoading from "@/app/(student)/student/loading";
import { StudentDashboardContent } from "@/components/student/student-dashboard-content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Student Dashboard",
  description:
    "View your active semester courses, weekly lecture schedule, CGPA, and tuition alerts.",
});

export default function StudentDashboardPage() {
  return (
    <Suspense fallback={<StudentDashboardLoading />}>
      <StudentDashboardContent />
    </Suspense>
  );
}
