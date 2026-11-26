import { Suspense } from "react";
import type { Metadata } from "next";

import StudentResultsLoading from "@/app/(student)/student/results/loading";
import { StudentResultsContent } from "@/components/student/student-results-content";

export const metadata: Metadata = {
  title: "Published Results",
};

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
