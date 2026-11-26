"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { DepartmentFormDialog } from "@/components/admin/departments/department-form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUrlState } from "@/hooks/use-url-state";
import { apiFetch } from "@/lib/api";
import type { ApiError } from "@/lib/api-error";
import { formatDate } from "@/lib/format";
import type { Department, TPaginationMeta } from "@/types/api";

export interface AdminDepartmentsClientProps {
  departments: Department[];
  meta?: TPaginationMeta;
}

export function AdminDepartmentsClient({
  departments,
  meta,
}: AdminDepartmentsClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    q,
    sortBy,
    order,
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

  const [formOpen, setFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null
  );
  const [deletingDepartment, setDeletingDepartment] =
    useState<Department | null>(null);

  const deleteMutation = useMutation<null, ApiError, string>({
    mutationFn: (id) =>
      apiFetch<null>(`/departments/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Department deleted successfully.");
      setDeletingDepartment(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "departments"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Unable to delete department.");
    },
  });

  const columns: DataTableColumn<Department>[] = [
    {
      id: "code",
      header: "Code",
      sortKey: "code",
      cell: (row) => <StatusBadge status="ACTIVE" label={row.code} />,
    },
    {
      id: "name",
      header: "Department Name",
      sortKey: "name",
      cell: (row) => (
        <span className="font-medium text-foreground">{row.name}</span>
      ),
    },
    {
      id: "description",
      header: "Description",
      cell: (row) => (
        <span className="block max-w-[320px] truncate text-xs text-muted-foreground">
          {row.description || "—"}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
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
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={`Actions for ${row.name}`}
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onSelect={() => {
                setEditingDepartment(row);
                setFormOpen(true);
              }}
            >
              <Pencil className="size-4" aria-hidden="true" />
              <span>Edit Department</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeletingDepartment(row)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const toolbar = (
    <div className="glass flex flex-col gap-3 rounded-2xl border-white/10 p-4 sm:flex-row sm:items-center">
      <SearchInput
        value={q}
        onValueChange={setSearch}
        placeholder="Search departments by code or name..."
        ariaLabel="Search departments"
      />
      {q ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => resetParams(["q", "page"])}
        >
          <X className="size-4" aria-hidden="true" />
          Clear
        </Button>
      ) : null}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <Building2 className="size-6 text-accent-brand" aria-hidden="true" />
            Departments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and maintain academic departments across the university.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setEditingDepartment(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden="true" />
          New Department
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={departments}
        getRowKey={(row) => row.id}
        toolbar={toolbar}
        sortBy={sortBy}
        order={order}
        onSortChange={toggleSort}
        meta={meta}
        onPageChange={setPage}
        onLimitChange={setLimit}
        emptyTitle="No departments found"
        emptyDescription="Create your first academic department or adjust your search."
        emptyAction={
          <Button
            type="button"
            onClick={() => {
              setEditingDepartment(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            New Department
          </Button>
        }
      />

      <DepartmentFormDialog
        department={editingDepartment}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingDepartment(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingDepartment)}
        onOpenChange={(open) => {
          if (!open) setDeletingDepartment(null);
        }}
        title="Delete department"
        description={
          deletingDepartment
            ? `Soft-delete "${deletingDepartment.code} — ${deletingDepartment.name}"? Existing programs linked to this department may be affected.`
            : undefined
        }
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deletingDepartment) {
            deleteMutation.mutate(deletingDepartment.id);
          }
        }}
      />
    </div>
  );
}
