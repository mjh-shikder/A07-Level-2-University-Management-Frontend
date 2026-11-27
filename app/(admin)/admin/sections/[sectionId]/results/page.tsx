import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import AdminSectionResultsLoading from "@/app/(admin)/admin/sections/[sectionId]/results/loading";
import { AdminSectionResultsClient } from "@/components/admin/sections/admin-section-results-client";
import { ApiError } from "@/lib/api-error";
import { serverApiFetch } from "@/lib/api-server";
import { createPageMetadata } from "@/lib/metadata";
import type { Result, Section } from "@/types/api";

export const metadata: Metadata = createPageMetadata({
  title: "Section Results",
  description:
    "Review computed draft results, publish official grades, or unpublish section results for corrections.",
});

async function AdminSectionResultsContent({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;
  const currentPath = `/admin/sections/${sectionId}/results`;

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

  const results = await serverApiFetch<Result[]>(
    `/sections/${sectionId}/results`,
    {
      params: { limit: 100 },
      redirectOnAuthError: false,
    }
  ).catch(() => [] as Result[]);

  return (
    <AdminSectionResultsClient section={section} initialResults={results} />
  );
}

export default function AdminSectionResultsPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  return (
    <Suspense fallback={<AdminSectionResultsLoading />}>
      <AdminSectionResultsContent params={params} />
    </Suspense>
  );
}
