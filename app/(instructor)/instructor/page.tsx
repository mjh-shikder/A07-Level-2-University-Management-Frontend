import { Suspense } from "react";
import type { Metadata } from "next";

import InstructorDashboardLoading from "@/app/(instructor)/instructor/loading";
import { InstructorDashboardContent } from "@/components/instructor/instructor-dashboard-content";

export const metadata: Metadata = {
  title: "Instructor Dashboard",
};

export default function InstructorDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; semesterId?: string }>;
}) {
  return (
    <Suspense fallback={<InstructorDashboardLoading />}>
      <InstructorDashboardContent searchParams={searchParams} />
    </Suspense>
  );
}
