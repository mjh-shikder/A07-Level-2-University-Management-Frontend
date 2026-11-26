import { Suspense } from "react";
import type { Metadata } from "next";

import SectionMarksLoading from "@/app/(instructor)/instructor/sections/[sectionId]/marks/loading";
import { SectionMarksServerContent } from "@/components/instructor/section-marks-server";

export const metadata: Metadata = {
  title: "Marks Entry & Gradebook",
};

async function SectionMarksWrapper({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;
  return (
    <SectionMarksServerContent
      sectionId={sectionId}
      currentPath={`/instructor/sections/${sectionId}/marks`}
    />
  );
}

export default function SectionMarksPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  return (
    <Suspense fallback={<SectionMarksLoading />}>
      <SectionMarksWrapper params={params} />
    </Suspense>
  );
}
