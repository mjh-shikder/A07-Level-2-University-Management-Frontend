import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import SectionExamsLoading from "@/app/(instructor)/instructor/sections/[sectionId]/exams/loading";
import { SectionExamsClient } from "@/components/instructor/section-exams-client";
import { ApiError } from "@/lib/api-error";
import { serverApiFetch } from "@/lib/api-server";
import type { Exam, Result, Section } from "@/types/api";

export const metadata: Metadata = {
  title: "Exams & Weights",
};

async function SectionExamsContent({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;

  let section: Section;
  try {
    section = await serverApiFetch<Section>(`/sections/${sectionId}`, {
      currentPath: `/instructor/sections/${sectionId}/exams`,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const [exams, results] = await Promise.all([
    serverApiFetch<Exam[]>(`/sections/${sectionId}/exams`, {
      params: { limit: 50 },
      currentPath: `/instructor/sections/${sectionId}/exams`,
    }),
    serverApiFetch<Result[]>(`/sections/${sectionId}/results`, {
      params: { limit: 10 },
      redirectOnAuthError: false,
    }).catch(() => [] as Result[]),
  ]);

  const isPublished = results.some((r) => r.status === "PUBLISHED");

  return (
    <SectionExamsClient
      section={section}
      exams={exams}
      isPublished={isPublished}
    />
  );
}

export default function SectionExamsPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  return (
    <Suspense fallback={<SectionExamsLoading />}>
      <SectionExamsContent params={params} />
    </Suspense>
  );
}
