import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import SectionAttendanceLoading from "@/app/(instructor)/instructor/sections/[sectionId]/attendance/loading";
import { SectionAttendanceClient } from "@/components/instructor/section-attendance-client";
import { ApiError } from "@/lib/api-error";
import { serverApiFetch } from "@/lib/api-server";
import type { Enrollment, Section } from "@/types/api";

export const metadata: Metadata = {
  title: "Daily Attendance",
};

async function SectionAttendanceContent({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;

  let section: Section;
  try {
    section = await serverApiFetch<Section>(`/sections/${sectionId}`, {
      currentPath: `/instructor/sections/${sectionId}/attendance`,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const enrollments = await serverApiFetch<Enrollment[]>(
    `/sections/${sectionId}/students`,
    {
      params: { status: "ENROLLED", limit: 100, sortBy: "enrolledAt", order: "asc" },
      currentPath: `/instructor/sections/${sectionId}/attendance`,
    }
  );

  return (
    <SectionAttendanceClient section={section} enrollments={enrollments} />
  );
}

export default function SectionAttendancePage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  return (
    <Suspense fallback={<SectionAttendanceLoading />}>
      <SectionAttendanceContent params={params} />
    </Suspense>
  );
}
