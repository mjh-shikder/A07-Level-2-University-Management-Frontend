import { Suspense } from "react";
import type { Metadata } from "next";

import AdminCoursesLoading from "@/app/(admin)/admin/courses/loading";
import { AdminCoursesClient } from "@/components/admin/courses/admin-courses-client";
import { serverApiFetch, serverApiFetchEnvelope } from "@/lib/api-server";
import { createPageMetadata } from "@/lib/metadata";
import type { Course, Program } from "@/types/api";

export const metadata: Metadata = createPageMetadata({
  title: "Course Catalog",
  description:
    "Manage university courses, credit hours, program assignments, and prerequisites.",
});

interface CoursesSearchParams {
  page?: string;
  limit?: string;
  q?: string;
  programId?: string;
  sortBy?: string;
  order?: string;
}

async function AdminCoursesContent({
  searchParams,
}: {
  searchParams: Promise<CoursesSearchParams>;
}) {
  const params = await searchParams;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;
  const limit = Number(params.limit) > 0 ? Math.min(100, Number(params.limit)) : 10;
  const sortBy = params.sortBy || "createdAt";
  const order = params.order === "asc" || params.order === "desc" ? params.order : "desc";

  const [coursesEnvelope, programs, allCourses] = await Promise.all([
    serverApiFetchEnvelope<Course[]>("/courses", {
      params: {
        page,
        limit,
        q: params.q || undefined,
        programId: params.programId || undefined,
        sortBy,
        order,
      },
      currentPath: "/admin/courses",
    }),
    serverApiFetch<Program[]>("/programs", {
      params: { limit: 100, sortBy: "name", order: "asc" },
      redirectOnAuthError: false,
    }).catch(() => [] as Program[]),
    serverApiFetch<Course[]>("/courses", {
      params: { limit: 100, sortBy: "code", order: "asc" },
      redirectOnAuthError: false,
    }).catch(() => [] as Course[]),
  ]);

  return (
    <AdminCoursesClient
      courses={coursesEnvelope.data}
      programs={programs}
      allCourses={allCourses}
      meta={coursesEnvelope.meta}
    />
  );
}

export default function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<CoursesSearchParams>;
}) {
  return (
    <Suspense fallback={<AdminCoursesLoading />}>
      <AdminCoursesContent searchParams={searchParams} />
    </Suspense>
  );
}
