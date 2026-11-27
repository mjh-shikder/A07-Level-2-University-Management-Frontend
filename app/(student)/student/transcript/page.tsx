import { Suspense } from "react";
import type { Metadata } from "next";

import StudentTranscriptLoading from "@/app/(student)/student/transcript/loading";
import { StudentTranscriptContent } from "@/components/student/student-transcript-content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Official Academic Transcript",
  description:
    "Printable official academic transcript with semester SGPA breakdown and cumulative CGPA.",
});

export default function StudentTranscriptPage() {
  return (
    <Suspense fallback={<StudentTranscriptLoading />}>
      <StudentTranscriptContent />
    </Suspense>
  );
}
