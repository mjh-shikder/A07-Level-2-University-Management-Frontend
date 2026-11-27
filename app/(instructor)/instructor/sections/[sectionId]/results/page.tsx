import { Suspense } from "react";
import type { Metadata } from "next";

import SectionMarksLoading from "@/app/(instructor)/instructor/sections/[sectionId]/marks/loading";
import { SectionMarksServerContent } from "@/components/instructor/section-marks-server";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Section Gradebook",
  description:
    "Review computed weighted percentages, letter grades, and draft section results.",
});

async function SectionResultsWrapper({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;
  return (
    <SectionMarksServerContent
      sectionId={sectionId}
      currentPath={`/instructor/sections/${sectionId}/results`}
    />
  );
}

export default function SectionResultsPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  return (
    <Suspense fallback={<SectionMarksLoading />}>
      <SectionResultsWrapper params={params} />
    </Suspense>
  );
}
