import { EmptyState } from "@/components/shared/empty-state";
import {
  StudentTranscriptClient,
  type RawTranscriptResponse,
} from "@/components/student/student-transcript-client";
import { serverApiFetch } from "@/lib/api-server";
import type { StudentGPASummary, UserSummary } from "@/types/api";

export async function StudentTranscriptContent() {
  const me = await serverApiFetch<UserSummary>("/users/me", {
    currentPath: "/student/transcript",
  });

  if (!me.studentProfile) {
    return (
      <EmptyState
        title="Student profile not linked"
        description="Your account does not have an active student profile yet. Contact an administrator to complete onboarding."
      />
    );
  }

  const [transcript, gpaSummary] = await Promise.all([
    serverApiFetch<RawTranscriptResponse>("/students/me/transcript", {
      currentPath: "/student/transcript",
    }),
    serverApiFetch<StudentGPASummary>("/students/me/gpa", {
      redirectOnAuthError: false,
    }).catch(() => null),
  ]);

  return (
    <StudentTranscriptClient
      transcript={transcript}
      gpaSummary={gpaSummary}
    />
  );
}
