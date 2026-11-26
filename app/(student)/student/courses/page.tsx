import { Suspense } from "react";
import type { Metadata } from "next";

import StudentCoursesLoading from "@/app/(student)/student/courses/loading";
import { StudentCoursesContent } from "@/components/student/student-courses-content";

export const metadata: Metadata = {
  title: "My Enrolled Courses",
};

export default function StudentCoursesPage() {
  return (
    <Suspense fallback={<StudentCoursesLoading />}>
      <StudentCoursesContent />
    </Suspense>
  );
}
