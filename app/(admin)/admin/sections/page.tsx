import { Suspense } from "react";
import type { Metadata } from "next";

import AdminSectionsLoading from "@/app/(admin)/admin/sections/loading";
import { AdminSectionsClient } from "@/components/admin/sections/admin-sections-client";
import { serverApiFetch, serverApiFetchEnvelope } from "@/lib/api-server";
import { createPageMetadata } from "@/lib/metadata";
import type { Course, Section, Semester, UserSummary } from "@/types/api";

export const metadata: Metadata = createPageMetadata({
  title: "Sections & Scheduling",
  description:
    "Schedule course sections, assign instructors, set capacities, and manage weekly meeting slots.",
});

interface SectionsSearchParams {
  page?: string;
  limit?: string;
  q?: string;
  semesterId?: string;
  courseId?: string;
  sortBy?: string;
  order?: string;
}

async function AdminSectionsContent({
  searchParams,
}: {
  searchParams: Promise<SectionsSearchParams>;
}) {
  const params = await searchParams;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;
  const limit = Number(params.limit) > 0 ? Math.min(100, Number(params.limit)) : 10;
  const sortBy = params.sortBy || "createdAt";
  const order = params.order === "asc" || params.order === "desc" ? params.order : "desc";

  const [sectionsEnvelope, courses, semesters, instructors] = await Promise.all([
    serverApiFetchEnvelope<Section[]>("/sections", {
      params: {
        page,
        limit,
        q: params.q || undefined,
        semesterId: params.semesterId || undefined,
        courseId: params.courseId || undefined,
        sortBy,
        order,
      },
      currentPath: "/admin/sections",
    }),
    serverApiFetch<Course[]>("/courses", {
      params: { limit: 100, sortBy: "code", order: "asc" },
      redirectOnAuthError: false,
    }).catch(() => [] as Course[]),
    serverApiFetch<Semester[]>("/semesters", {
      params: { limit: 100, sortBy: "startDate", order: "desc" },
      redirectOnAuthError: false,
    }).catch(() => [] as Semester[]),
    serverApiFetch<UserSummary[]>("/admin/users", {
      params: { role: "INSTRUCTOR", status: "ACTIVE", limit: 100 },
      redirectOnAuthError: false,
    }).catch(() => [] as UserSummary[]),
  ]);

  return (
    <AdminSectionsClient
      sections={sectionsEnvelope.data}
      courses={courses}
      semesters={semesters}
      instructors={instructors}
      meta={sectionsEnvelope.meta}
    />
  );
}

export default function AdminSectionsPage({
  searchParams,
}: {
  searchParams: Promise<SectionsSearchParams>;
}) {
  return (
    <Suspense fallback={<AdminSectionsLoading />}>
      <AdminSectionsContent searchParams={searchParams} />
    </Suspense>
  );
}
