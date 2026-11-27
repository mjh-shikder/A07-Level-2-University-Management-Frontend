import { Suspense } from "react";
import type { Metadata } from "next";

import StudentRegistrationLoading from "@/app/(student)/student/registration/loading";
import { StudentRegistrationContent } from "@/components/student/student-registration-content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Course Registration",
  description:
    "Browse open course sections for the active semester and enroll within your credit limit.",
});

export default function StudentRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; limit?: string }>;
}) {
  return (
    <Suspense fallback={<StudentRegistrationLoading />}>
      <StudentRegistrationContent searchParams={searchParams} />
    </Suspense>
  );
}
