import { Suspense } from "react";
import type { Metadata } from "next";

import StudentCoursesLoading from "@/app/(student)/student/courses/loading";
import { StudentCoursesContent } from "@/components/student/student-courses-content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "My Enrolled Courses",
  description:
    "Review active and past course enrollments or drop a section within the deadline.",
});

export default function StudentCoursesPage() {
  return (
    <Suspense fallback={<StudentCoursesLoading />}>
      <StudentCoursesContent />
    </Suspense>
  );
}
