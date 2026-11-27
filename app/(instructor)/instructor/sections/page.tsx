import { Suspense } from "react";
import type { Metadata } from "next";

import InstructorSectionsLoading from "@/app/(instructor)/instructor/sections/loading";
import { InstructorDashboardContent } from "@/components/instructor/instructor-dashboard-content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "My Sections",
  description:
    "Browse your assigned course sections, teaching schedule, student rosters, attendance, and gradebooks.",
});

export default function InstructorSectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; semesterId?: string }>;
}) {
  return (
    <Suspense fallback={<InstructorSectionsLoading />}>
      <InstructorDashboardContent searchParams={searchParams} />
    </Suspense>
  );
}
