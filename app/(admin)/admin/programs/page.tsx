import { Suspense } from "react";
import type { Metadata } from "next";

import AdminProgramsLoading from "@/app/(admin)/admin/programs/loading";
import { AdminProgramsClient } from "@/components/admin/programs/admin-programs-client";
import { serverApiFetch, serverApiFetchEnvelope } from "@/lib/api-server";
import type { Department, Program } from "@/types/api";

export const metadata: Metadata = {
  title: "Academic Programs",
};

interface ProgramsSearchParams {
  page?: string;
  limit?: string;
  q?: string;
  departmentId?: string;
  sortBy?: string;
  order?: string;
}

async function AdminProgramsContent({
  searchParams,
}: {
  searchParams: Promise<ProgramsSearchParams>;
}) {
  const params = await searchParams;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;
  const limit = Number(params.limit) > 0 ? Math.min(100, Number(params.limit)) : 10;
  const sortBy = params.sortBy || "createdAt";
  const order = params.order === "asc" || params.order === "desc" ? params.order : "desc";

  const [programsEnvelope, departments] = await Promise.all([
    serverApiFetchEnvelope<Program[]>("/programs", {
      params: {
        page,
        limit,
        q: params.q || undefined,
        departmentId: params.departmentId || undefined,
        sortBy,
        order,
      },
      currentPath: "/admin/programs",
    }),
    serverApiFetch<Department[]>("/departments", {
      params: { limit: 100, sortBy: "name", order: "asc" },
      redirectOnAuthError: false,
    }).catch(() => [] as Department[]),
  ]);

  return (
    <AdminProgramsClient
      programs={programsEnvelope.data}
      departments={departments}
      meta={programsEnvelope.meta}
    />
  );
}

export default function AdminProgramsPage({
  searchParams,
}: {
  searchParams: Promise<ProgramsSearchParams>;
}) {
  return (
    <Suspense fallback={<AdminProgramsLoading />}>
      <AdminProgramsContent searchParams={searchParams} />
    </Suspense>
  );
}
