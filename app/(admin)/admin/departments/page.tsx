import { Suspense } from "react";
import type { Metadata } from "next";

import AdminDepartmentsLoading from "@/app/(admin)/admin/departments/loading";
import { AdminDepartmentsClient } from "@/components/admin/departments/admin-departments-client";
import { serverApiFetchEnvelope } from "@/lib/api-server";
import { createPageMetadata } from "@/lib/metadata";
import type { Department } from "@/types/api";

export const metadata: Metadata = createPageMetadata({
  title: "Departments",
  description: "Create, edit, and manage university academic departments.",
});

interface DepartmentsSearchParams {
  page?: string;
  limit?: string;
  q?: string;
  sortBy?: string;
  order?: string;
}

async function AdminDepartmentsContent({
  searchParams,
}: {
  searchParams: Promise<DepartmentsSearchParams>;
}) {
  const params = await searchParams;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;
  const limit = Number(params.limit) > 0 ? Math.min(100, Number(params.limit)) : 10;
  const sortBy = params.sortBy || "createdAt";
  const order = params.order === "asc" || params.order === "desc" ? params.order : "desc";

  const envelope = await serverApiFetchEnvelope<Department[]>("/departments", {
    params: {
      page,
      limit,
      q: params.q || undefined,
      sortBy,
      order,
    },
    currentPath: "/admin/departments",
  });

  return (
    <AdminDepartmentsClient
      departments={envelope.data}
      meta={envelope.meta}
    />
  );
}

export default function AdminDepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<DepartmentsSearchParams>;
}) {
  return (
    <Suspense fallback={<AdminDepartmentsLoading />}>
      <AdminDepartmentsContent searchParams={searchParams} />
    </Suspense>
  );
}
