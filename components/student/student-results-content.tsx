import { EmptyState } from "@/components/shared/empty-state";
import {
  StudentResultsClient,
  type StudentResultItem,
} from "@/components/student/student-results-client";
import { serverApiFetch, serverApiFetchEnvelope } from "@/lib/api-server";
import type { Semester, UserSummary } from "@/types/api";

export interface StudentResultsContentProps {
  searchParams?: Promise<{
    semesterId?: string;
    page?: string;
    limit?: string;
  }>;
}

export async function StudentResultsContent({
  searchParams,
}: StudentResultsContentProps) {
  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(params.limit) || 20));
  const semesterId = params.semesterId || undefined;

  const me = await serverApiFetch<UserSummary>("/users/me", {
    currentPath: "/student/results",
  });

  if (!me.studentProfile) {
    return (
      <EmptyState
        title="Student profile not linked"
        description="Your account does not have an active student profile yet. Contact an administrator to complete onboarding."
      />
    );
  }

  const [resultsResponse, semesters] = await Promise.all([
    serverApiFetchEnvelope<StudentResultItem[]>("/results/my", {
      params: {
        semesterId,
        page,
        limit,
        sortBy: "createdAt",
        order: "desc",
      },
      currentPath: "/student/results",
    }),
    serverApiFetch<Semester[]>("/semesters", {
      params: { limit: 50, sortBy: "startDate", order: "desc" },
      redirectOnAuthError: false,
    }).catch(() => [] as Semester[]),
  ]);

  return (
    <StudentResultsClient
      results={resultsResponse.data}
      meta={
        resultsResponse.meta ?? {
          page,
          limit,
          total: resultsResponse.data.length,
          totalPages: 1,
        }
      }
      semesters={semesters}
    />
  );
}
