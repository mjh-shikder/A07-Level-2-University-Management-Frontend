import { EmptyState } from "@/components/shared/empty-state";
import { InstructorDashboardClient } from "@/components/instructor/instructor-dashboard-client";
import { serverApiFetch } from "@/lib/api-server";
import type { Section, Semester, UserSummary } from "@/types/api";

export interface InstructorDashboardContentProps {
  searchParams?: Promise<{
    q?: string;
    semesterId?: string;
  }>;
}

export async function InstructorDashboardContent({
  searchParams,
}: InstructorDashboardContentProps) {
  const params = searchParams ? await searchParams : {};
  const me = await serverApiFetch<UserSummary>("/users/me", {
    currentPath: "/instructor",
  });

  const instructorProfileId = me.instructorProfile?.id;
  if (!instructorProfileId) {
    return (
      <EmptyState
        title="Instructor profile not linked"
        description="Your account does not have an active faculty profile yet. Contact an administrator to complete onboarding."
      />
    );
  }

  const [sections, semesters] = await Promise.all([
    serverApiFetch<Section[]>("/sections", {
      params: {
        instructorId: instructorProfileId,
        semesterId: params.semesterId || undefined,
        q: params.q || undefined,
        limit: 50,
        sortBy: "createdAt",
        order: "desc",
      },
      currentPath: "/instructor",
    }),
    serverApiFetch<Semester[]>("/semesters", {
      params: { limit: 50, sortBy: "startDate", order: "desc" },
      redirectOnAuthError: false,
    }).catch(() => [] as Semester[]),
  ]);

  return (
    <InstructorDashboardClient
      instructor={me}
      sections={sections}
      semesters={semesters}
    />
  );
}
