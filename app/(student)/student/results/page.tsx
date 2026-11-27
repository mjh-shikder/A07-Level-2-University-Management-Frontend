import { Suspense } from "react";
import type { Metadata } from "next";

import StudentResultsLoading from "@/app/(student)/student/results/loading";
import { StudentResultsContent } from "@/components/student/student-results-content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Published Results",
  description:
    "View official published semester letter grades, weighted scores, and grade points.",
});

export default function StudentResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ semesterId?: string; page?: string; limit?: string }>;
}) {
  return (
    <Suspense fallback={<StudentResultsLoading />}>
      <StudentResultsContent searchParams={searchParams} />
    </Suspense>
  );
}
