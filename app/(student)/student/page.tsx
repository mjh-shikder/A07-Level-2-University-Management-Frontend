import { Suspense } from "react";
import type { Metadata } from "next";

import StudentDashboardLoading from "@/app/(student)/student/loading";
import { StudentDashboardContent } from "@/components/student/student-dashboard-content";

export const metadata: Metadata = {
  title: "Student Dashboard",
};

export default function StudentDashboardPage() {
  return (
    <Suspense fallback={<StudentDashboardLoading />}>
      <StudentDashboardContent />
    </Suspense>
  );
}
