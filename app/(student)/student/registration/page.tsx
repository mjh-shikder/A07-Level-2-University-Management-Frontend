import { Suspense } from "react";
import type { Metadata } from "next";

import StudentRegistrationLoading from "@/app/(student)/student/registration/loading";
import { StudentRegistrationContent } from "@/components/student/student-registration-content";

export const metadata: Metadata = {
  title: "Course Registration",
};

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
