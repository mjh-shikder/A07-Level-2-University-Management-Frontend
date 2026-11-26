import { Suspense } from "react";
import type { Metadata } from "next";

import AdminUsersLoading from "@/app/(admin)/admin/users/loading";
import { AdminUsersClient } from "@/components/admin/users/admin-users-client";
import { serverApiFetch, serverApiFetchEnvelope } from "@/lib/api-server";
import type { UserSummary } from "@/types/api";

export const metadata: Metadata = {
  title: "User Management",
};

interface AdminUsersSearchParams {
  page?: string;
  limit?: string;
  q?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  order?: string;
}

async function AdminUsersContent({
  searchParams,
}: {
  searchParams: Promise<AdminUsersSearchParams>;
}) {
  const params = await searchParams;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;
  const limit = Number(params.limit) > 0 ? Math.min(100, Number(params.limit)) : 10;
  const sortBy = params.sortBy || "createdAt";
  const order = params.order === "asc" || params.order === "desc" ? params.order : "desc";

  const [usersEnvelope, meRes] = await Promise.all([
    serverApiFetchEnvelope<UserSummary[]>("/admin/users", {
      params: {
        page,
        limit,
        q: params.q || undefined,
        role: params.role || undefined,
        status: params.status || undefined,
        sortBy,
        order,
      },
      currentPath: "/admin/users",
    }),
    serverApiFetch<UserSummary>("/users/me", {
      redirectOnAuthError: false,
    }).catch(() => null),
  ]);

  return (
    <AdminUsersClient
      users={usersEnvelope.data}
      meta={usersEnvelope.meta}
      currentAdminId={meRes?.id}
    />
  );
}

export default function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<AdminUsersSearchParams>;
}) {
  return (
    <Suspense fallback={<AdminUsersLoading />}>
      <AdminUsersContent searchParams={searchParams} />
    </Suspense>
  );
}
