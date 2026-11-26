import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import SectionRosterLoading from "@/app/(instructor)/instructor/sections/[sectionId]/students/loading";
import {
  SectionRosterClient,
  type RosterEnrollment,
} from "@/components/instructor/section-roster-client";
import { ApiError } from "@/lib/api-error";
import { serverApiFetch, serverApiFetchEnvelope } from "@/lib/api-server";
import type { Section } from "@/types/api";

export const metadata: Metadata = {
  title: "Section Roster",
};

interface RosterSearchParams {
  page?: string;
  limit?: string;
  status?: string;
  sortBy?: string;
  order?: string;
}

async function SectionRosterContent({
  params,
  searchParams,
}: {
  params: Promise<{ sectionId: string }>;
  searchParams: Promise<RosterSearchParams>;
}) {
  const { sectionId } = await params;
  const query = await searchParams;

  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const limit = Number(query.limit) > 0 ? Math.min(100, Number(query.limit)) : 20;
  const sortBy = query.sortBy || "enrolledAt";
  const order = query.order === "asc" || query.order === "desc" ? query.order : "desc";

  let section: Section;
  try {
    section = await serverApiFetch<Section>(`/sections/${sectionId}`, {
      currentPath: `/instructor/sections/${sectionId}/students`,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const rosterEnvelope = await serverApiFetchEnvelope<RosterEnrollment[]>(
    `/sections/${sectionId}/students`,
    {
      params: {
        page,
        limit,
        status: query.status || undefined,
        sortBy,
        order,
      },
      currentPath: `/instructor/sections/${sectionId}/students`,
    }
  );

  return (
    <SectionRosterClient
      section={section}
      enrollments={rosterEnvelope.data}
      meta={rosterEnvelope.meta}
    />
  );
}

export default function SectionRosterPage({
  params,
  searchParams,
}: {
  params: Promise<{ sectionId: string }>;
  searchParams: Promise<RosterSearchParams>;
}) {
  return (
    <Suspense fallback={<SectionRosterLoading />}>
      <SectionRosterContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
