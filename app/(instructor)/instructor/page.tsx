import { Suspense } from "react";
import type { Metadata } from "next";

import InstructorDashboardLoading from "@/app/(instructor)/instructor/loading";
import { InstructorDashboardContent } from "@/components/instructor/instructor-dashboard-content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Instructor Dashboard",
  description:
    "View assigned course sections, weekly teaching schedule, and links to rosters, attendance, and grading.",
});

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
