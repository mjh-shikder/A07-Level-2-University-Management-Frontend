"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { SemesterFormDialog } from "@/components/admin/semesters/semester-form-dialog";
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
import type { Semester, SemesterStatus, TPaginationMeta } from "@/types/api";

export interface AdminSemestersClientProps {
  semesters: Semester[];
  meta?: TPaginationMeta;
}

export function AdminSemestersClient({
  semesters,
  meta,
}: AdminSemestersClientProps) {
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
    defaultSortBy: "startDate",
    defaultOrder: "desc",
  });

  const statusFilter = getParam("status", "all");
  const hasFilters = Boolean(q || (statusFilter && statusFilter !== "all"));

  const [formOpen, setFormOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [deletingSemester, setDeletingSemester] = useState<Semester | null>(
    null
  );
  const [transitionTarget, setTransitionTarget] = useState<{
    semester: Semester;
    nextStatus: SemesterStatus;
  } | null>(null);

  const statusMutation = useMutation<
    Semester,
    ApiError,
    { id: string; status: SemesterStatus }
  >({
    mutationFn: ({ id, status }) =>
      apiFetch<Semester>(`/semesters/${id}/status`, {
        method: "PATCH",
        body: { status },
      }),
    onSuccess: (updated) => {
      toast.success(
        `Semester "${updated.name}" transitioned to ${updated.status}.`
      );
      setTransitionTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "semesters"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      router.refresh();
    },
    onError: (error) => {
      setTransitionTarget(null);
      toast.error(error.message || "Unable to transition semester status.");
    },
  });

  const deleteMutation = useMutation<null, ApiError, string>({
    mutationFn: (id) =>
      apiFetch<null>(`/semesters/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Semester deleted successfully.");
      setDeletingSemester(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "semesters"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Unable to delete semester.");
    },
  });

  const columns: DataTableColumn<Semester>[] = [
    {
      id: "name",
      header: "Semester",
      sortKey: "name",
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.term} {row.year}
          </p>
        </div>
      ),
    },
    {
      id: "dates",
      header: "Term Dates",
      sortKey: "startDate",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.startDate)} – {formatDate(row.endDate)}
        </span>
      ),
    },
    {
      id: "registration",
      header: "Registration Window",
      cell: (row) =>
        row.registrationStart && row.registrationEnd ? (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.registrationStart)} –{" "}
            {formatDate(row.registrationEnd)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Not set</span>
        ),
    },
    {
      id: "status",
      header: "Status",
      sortKey: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "transition",
      header: "Lifecycle",
      cell: (row) => {
        if (row.status === "UPCOMING") {
          return (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setTransitionTarget({ semester: row, nextStatus: "ACTIVE" })
              }
            >
              <Play className="size-3.5 text-primary" aria-hidden="true" />
              Activate
            </Button>
          );
        }
        if (row.status === "ACTIVE") {
          return (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setTransitionTarget({ semester: row, nextStatus: "COMPLETED" })
              }
            >
              <CheckCircle2
                className="size-3.5 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              Complete
            </Button>
          );
        }
        return (
          <span className="text-xs text-muted-foreground">Archived</span>
        );
      },
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
                setEditingSemester(row);
                setFormOpen(true);
              }}
            >
              <Pencil className="size-4" aria-hidden="true" />
              <span>Edit Semester</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeletingSemester(row)}
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
        placeholder="Search semesters by name..."
        ariaLabel="Search semesters"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setParam("status", value === "all" ? null : value)
          }
        >
          <SelectTrigger
            className="w-full sm:w-44"
            aria-label="Filter by status"
          >
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="UPCOMING">Upcoming</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => resetParams(["q", "status", "page"])}
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
            <CalendarDays
              className="size-6 text-accent-brand"
              aria-hidden="true"
            />
            Academic Semesters
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure term schedules and advance semester lifecycle (UPCOMING → ACTIVE → COMPLETED).
          </p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setEditingSemester(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden="true" />
          New Semester
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={semesters}
        getRowKey={(row) => row.id}
        toolbar={toolbar}
        sortBy={sortBy}
        order={order}
        onSortChange={toggleSort}
        meta={meta}
        onPageChange={setPage}
        onLimitChange={setLimit}
        emptyTitle="No semesters found"
        emptyDescription="Create an academic semester or adjust your status/search filters."
      />

      <SemesterFormDialog
        semester={editingSemester}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingSemester(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(transitionTarget)}
        onOpenChange={(open) => {
          if (!open) setTransitionTarget(null);
        }}
        title={
          transitionTarget?.nextStatus === "ACTIVE"
            ? "Activate semester"
            : "Complete semester"
        }
        description={
          transitionTarget
            ? transitionTarget.nextStatus === "ACTIVE"
              ? `Activate "${transitionTarget.semester.name}"? Only one semester can be ACTIVE at a time.`
              : `Mark "${transitionTarget.semester.name}" as COMPLETED? This closes active registration and term operations.`
            : undefined
        }
        confirmLabel={
          transitionTarget?.nextStatus === "ACTIVE"
            ? "Activate Semester"
            : "Complete Semester"
        }
        variant={
          transitionTarget?.nextStatus === "COMPLETED" ? "destructive" : "default"
        }
        isLoading={statusMutation.isPending}
        onConfirm={() => {
          if (transitionTarget) {
            statusMutation.mutate({
              id: transitionTarget.semester.id,
              status: transitionTarget.nextStatus,
            });
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingSemester)}
        onOpenChange={(open) => {
          if (!open) setDeletingSemester(null);
        }}
        title="Delete semester"
        description={
          deletingSemester
            ? `Soft-delete "${deletingSemester.name}"?`
            : undefined
        }
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deletingSemester) {
            deleteMutation.mutate(deletingSemester.id);
          }
        }}
      />
    </div>
  );
}
