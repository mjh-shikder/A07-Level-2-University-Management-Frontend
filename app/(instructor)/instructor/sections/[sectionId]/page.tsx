import { redirect } from "next/navigation";

export default async function InstructorSectionIndexPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;
  redirect(`/instructor/sections/${sectionId}/students`);
}
