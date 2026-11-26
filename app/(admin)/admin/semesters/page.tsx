import { Suspense } from "react";
import type { Metadata } from "next";

import AdminSemestersLoading from "@/app/(admin)/admin/semesters/loading";
import { AdminSemestersClient } from "@/components/admin/semesters/admin-semesters-client";
import { serverApiFetchEnvelope } from "@/lib/api-server";
import type { Semester } from "@/types/api";

export const metadata: Metadata = {
  title: "Academic Semesters",
};

interface SemestersSearchParams {
  page?: string;
  limit?: string;
  q?: string;
  status?: string;
  sortBy?: string;
  order?: string;
}

async function AdminSemestersContent({
  searchParams,
}: {
  searchParams: Promise<SemestersSearchParams>;
}) {
  const params = await searchParams;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;
  const limit = Number(params.limit) > 0 ? Math.min(100, Number(params.limit)) : 10;
  const sortBy = params.sortBy || "startDate";
  const order = params.order === "asc" || params.order === "desc" ? params.order : "desc";

  const envelope = await serverApiFetchEnvelope<Semester[]>("/semesters", {
    params: {
      page,
      limit,
      q: params.q || undefined,
      status: params.status || undefined,
      sortBy,
      order,
    },
    currentPath: "/admin/semesters",
  });

  return (
    <AdminSemestersClient
      semesters={envelope.data}
      meta={envelope.meta}
    />
  );
}

export default function AdminSemestersPage({
  searchParams,
}: {
  searchParams: Promise<SemestersSearchParams>;
}) {
  return (
    <Suspense fallback={<AdminSemestersLoading />}>
      <AdminSemestersContent searchParams={searchParams} />
    </Suspense>
  );
}
