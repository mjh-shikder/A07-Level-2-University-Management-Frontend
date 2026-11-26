import { Suspense } from "react";
import type { Metadata } from "next";

import StudentTranscriptLoading from "@/app/(student)/student/transcript/loading";
import { StudentTranscriptContent } from "@/components/student/student-transcript-content";

export const metadata: Metadata = {
  title: "Official Academic Transcript",
};

export default function StudentTranscriptPage() {
  return (
    <Suspense fallback={<StudentTranscriptLoading />}>
      <StudentTranscriptContent />
    </Suspense>
  );
}
