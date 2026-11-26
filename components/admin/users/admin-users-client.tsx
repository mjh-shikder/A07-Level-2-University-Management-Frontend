"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";

import {
  UserRoleDialog,
  UserStatusDialog,
} from "@/components/admin/users/user-action-dialogs";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useUrlState } from "@/hooks/use-url-state";
import { formatDate } from "@/lib/format";
import type { TPaginationMeta, UserSummary } from "@/types/api";

export interface AdminUsersClientProps {
  users: UserSummary[];
  meta?: TPaginationMeta;
  currentAdminId?: string;
}

export function AdminUsersClient({
  users,
  meta,
  currentAdminId,
}: AdminUsersClientProps) {
  const { user: authUser } = useAuth({ enabled: !currentAdminId });
  const activeAdminId = currentAdminId ?? authUser?.id;

  const {
    q,
    sortBy,
    order,
    getParam,
    setParam,
    setPage,
    setLimit,
    setSearch,
    toggleSort,
    resetParams,
  } = useUrlState({
    defaultLimit: 10,
    defaultSortBy: "createdAt",
    defaultOrder: "desc",
  });

  const roleFilter = getParam("role", "all");
  const statusFilter = getParam("status", "all");
  const hasFilters = Boolean(
    q || (roleFilter && roleFilter !== "all") || (statusFilter && statusFilter !== "all")
  );

  const [roleDialogUser, setRoleDialogUser] = useState<UserSummary | null>(null);
  const [statusDialogUser, setStatusDialogUser] = useState<UserSummary | null>(null);

  const columns: DataTableColumn<UserSummary>[] = [
    {
      id: "user",
      header: "User",
      sortKey: "firstName",
      cell: (row) => (
        <div className="min-w-0 max-w-[240px] whitespace-normal">
          <p className="truncate font-medium text-foreground">
            {row.firstName} {row.lastName}
            {row.id === activeAdminId ? (
              <span className="ml-1.5 text-xs text-muted-foreground">(You)</span>
            ) : null}
          </p>
          <p className="truncate text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      sortKey: "role",
      cell: (row) => <StatusBadge status={row.role} />,
    },
    {
      id: "status",
      header: "Status",
      sortKey: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "academicId",
      header: "ID / Affiliation",
      cell: (row) => {
        if (row.studentProfile) {
          return (
            <div className="text-xs">
              <p className="font-medium text-foreground">
                {row.studentProfile.studentId}
              </p>
              {row.studentProfile.program ? (
                <p className="text-muted-foreground">
                  {row.studentProfile.program.code}
                </p>
              ) : null}
            </div>
          );
        }
        if (row.instructorProfile) {
          return (
            <div className="text-xs">
              <p className="font-medium text-foreground">
                {row.instructorProfile.employeeId}
              </p>
              {row.instructorProfile.department ? (
                <p className="text-muted-foreground">
                  {row.instructorProfile.department.code}
                </p>
              ) : null}
            </div>
          );
        }
        return <span className="text-xs text-muted-foreground">—</span>;
      },
    },
    {
      id: "createdAt",
      header: "Joined",
      sortKey: "createdAt",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (row) => {
        const isSelf = row.id === activeAdminId;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={`Actions for ${row.firstName} ${row.lastName}`}
              >
                <MoreHorizontal className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Manage Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={isSelf}
                onSelect={() => setRoleDialogUser(row)}
              >
                <UserCog className="size-4" aria-hidden="true" />
                <span>{isSelf ? "Role (Self locked)" : "Change Role"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={isSelf}
                onSelect={() => setStatusDialogUser(row)}
              >
                <ShieldCheck className="size-4" aria-hidden="true" />
                <span>{isSelf ? "Status (Self locked)" : "Change Status"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const toolbar = (
    <div className="glass flex flex-col gap-3 rounded-2xl border-white/10 p-4 lg:flex-row lg:items-center">
      <SearchInput
        value={q}
        onValueChange={setSearch}
        placeholder="Search by name or email..."
        ariaLabel="Search users"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={roleFilter}
          onValueChange={(value) =>
            setParam("role", value === "all" ? null : value)
          }
        >
          <SelectTrigger className="w-full sm:w-40" aria-label="Filter by role">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
            <SelectItem value="STUDENT">Student</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setParam("status", value === "all" ? null : value)
          }
        >
          <SelectTrigger
            className="w-full sm:w-40"
            aria-label="Filter by status"
          >
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => resetParams(["q", "role", "status", "page"])}
          >
            <X className="size-4" aria-hidden="true" />
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <Users className="size-6 text-accent-brand" aria-hidden="true" />
            User Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search directory accounts, update role permissions, or manage access status.
          </p>
        </div>

        {meta ? (
          <div className="glass self-start rounded-xl border-white/10 px-3.5 py-2 text-xs text-muted-foreground sm:self-auto">
            Total matching:{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {meta.total}
            </span>
          </div>
        ) : null}
      </div>

      <DataTable
        columns={columns}
        data={users}
        getRowKey={(row) => row.id}
        toolbar={toolbar}
        sortBy={sortBy}
        order={order}
        onSortChange={toggleSort}
        meta={meta}
        onPageChange={setPage}
        onLimitChange={setLimit}
        emptyTitle="No matching users found"
        emptyDescription="Try clearing or adjusting your search query, role, or status filters."
        emptyAction={
          hasFilters ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => resetParams(["q", "role", "status", "page"])}
            >
              Reset filters
            </Button>
          ) : undefined
        }
      />

      <UserRoleDialog
        user={roleDialogUser}
        open={Boolean(roleDialogUser)}
        onOpenChange={(open) => {
          if (!open) setRoleDialogUser(null);
        }}
      />

      <UserStatusDialog
        user={statusDialogUser}
        open={Boolean(statusDialogUser)}
        onOpenChange={(open) => {
          if (!open) setStatusDialogUser(null);
        }}
      />
    </div>
  );
}
