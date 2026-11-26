"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GraduationCap,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { ProgramFormDialog } from "@/components/admin/programs/program-form-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUrlState } from "@/hooks/use-url-state";
import { apiFetch } from "@/lib/api";
import type { ApiError } from "@/lib/api-error";
import { formatDate } from "@/lib/format";
import type { Department, Program, TPaginationMeta } from "@/types/api";

export interface AdminProgramsClientProps {
  programs: Program[];
  departments: Department[];
  meta?: TPaginationMeta;
}

export function AdminProgramsClient({
  programs,
  departments,
  meta,
}: AdminProgramsClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

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

  const departmentFilter = getParam("departmentId", "all");
  const hasFilters = Boolean(
    q || (departmentFilter && departmentFilter !== "all")
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [deletingProgram, setDeletingProgram] = useState<Program | null>(null);

  const deleteMutation = useMutation<null, ApiError, string>({
    mutationFn: (id) =>
      apiFetch<null>(`/programs/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Program deleted successfully.");
      setDeletingProgram(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "programs"] });
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Unable to delete program.");
    },
  });

  const deptById = new Map(departments.map((d) => [d.id, d]));

  const columns: DataTableColumn<Program>[] = [
    {
      id: "code",
      header: "Code",
      sortKey: "code",
      cell: (row) => <StatusBadge status="ACTIVE" label={row.code} />,
    },
    {
      id: "name",
      header: "Program Title",
      sortKey: "name",
      cell: (row) => (
        <span className="font-medium text-foreground">{row.name}</span>
      ),
    },
    {
      id: "department",
      header: "Department",
      cell: (row) => {
        const dept = row.department ?? deptById.get(row.departmentId);
        return dept ? (
          <div className="text-xs">
            <p className="font-medium text-foreground">{dept.code}</p>
            <p className="max-w-[200px] truncate text-muted-foreground">
              {dept.name}
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    {
      id: "requiredCredits",
      header: "Total Credits",
      sortKey: "requiredCredits",
      cell: (row) => (
        <span className="text-sm font-medium text-foreground tabular-nums">
          {row.requiredCredits} cr
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
                setEditingProgram(row);
                setFormOpen(true);
              }}
            >
              <Pencil className="size-4" aria-hidden="true" />
              <span>Edit Program</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeletingProgram(row)}
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
    <div className="glass flex flex-col gap-3 rounded-2xl border-white/10 p-4 lg:flex-row lg:items-center">
      <SearchInput
        value={q}
        onValueChange={setSearch}
        placeholder="Search programs by code or title..."
        ariaLabel="Search programs"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={departmentFilter}
          onValueChange={(value) =>
            setParam("departmentId", value === "all" ? null : value)
          }
        >
          <SelectTrigger
            className="w-full sm:w-56"
            aria-label="Filter by department"
          >
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.code} — {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => resetParams(["q", "departmentId", "page"])}
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <GraduationCap
              className="size-6 text-accent-brand"
              aria-hidden="true"
            />
            Academic Programs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage degree programs, credit requirements, and department links.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setEditingProgram(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden="true" />
          New Program
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={programs}
        getRowKey={(row) => row.id}
        toolbar={toolbar}
        sortBy={sortBy}
        order={order}
        onSortChange={toggleSort}
        meta={meta}
        onPageChange={setPage}
        onLimitChange={setLimit}
        emptyTitle="No programs found"
        emptyDescription="Create a degree program or adjust your department/search filters."
        emptyAction={
          hasFilters ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => resetParams(["q", "departmentId", "page"])}
            >
              Reset filters
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => {
                setEditingProgram(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              New Program
            </Button>
          )
        }
      />

      <ProgramFormDialog
        program={editingProgram}
        departments={departments}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingProgram(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingProgram)}
        onOpenChange={(open) => {
          if (!open) setDeletingProgram(null);
        }}
        title="Delete program"
        description={
          deletingProgram
            ? `Soft-delete "${deletingProgram.code} — ${deletingProgram.name}"? Courses and students linked to this program may be affected.`
            : undefined
        }
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deletingProgram) {
            deleteMutation.mutate(deletingProgram.id);
          }
        }}
      />
    </div>
  );
}
