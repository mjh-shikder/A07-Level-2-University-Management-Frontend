import { notFound } from "next/navigation";

import { SectionMarksClient } from "@/components/instructor/section-marks-client";
import { ApiError } from "@/lib/api-error";
import { serverApiFetch } from "@/lib/api-server";
import type { Enrollment, Exam, Result, Section } from "@/types/api";

export async function SectionMarksServerContent({
  sectionId,
  currentPath,
}: {
  sectionId: string;
  currentPath: string;
}) {
  let section: Section;
  try {
    section = await serverApiFetch<Section>(`/sections/${sectionId}`, {
      currentPath,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const [exams, enrollments, results] = await Promise.all([
    serverApiFetch<Exam[]>(`/sections/${sectionId}/exams`, {
      params: { limit: 50 },
      currentPath,
    }),
    serverApiFetch<Enrollment[]>(`/sections/${sectionId}/students`, {
      params: { status: "ENROLLED", limit: 100, sortBy: "enrolledAt", order: "asc" },
      currentPath,
    }),
    serverApiFetch<Result[]>(`/sections/${sectionId}/results`, {
      params: { limit: 100 },
      redirectOnAuthError: false,
    }).catch(() => [] as Result[]),
  ]);

  return (
    <SectionMarksClient
      section={section}
      exams={exams}
      enrollments={enrollments}
      initialResults={results}
    />
  );
}
