"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ListOrdered,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  AssignInstructorDialog,
  EditSectionDialog,
} from "@/components/admin/sections/section-edit-dialogs";
import { SectionWizardDialog } from "@/components/admin/sections/section-wizard-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
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
import type {
  Course,
  Section,
  Semester,
  TPaginationMeta,
  UserSummary,
} from "@/types/api";

export interface AdminSectionsClientProps {
  sections: Section[];
  courses: Course[];
  semesters: Semester[];
  instructors: UserSummary[];
  meta?: TPaginationMeta;
}

export function AdminSectionsClient({
  sections,
  courses,
  semesters,
  instructors,
  meta,
}: AdminSectionsClientProps) {
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

  const semesterFilter = getParam("semesterId", "all");
  const courseFilter = getParam("courseId", "all");
  const hasFilters = Boolean(
    q ||
      (semesterFilter && semesterFilter !== "all") ||
      (courseFilter && courseFilter !== "all")
  );

  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [assigningSection, setAssigningSection] = useState<Section | null>(null);
  const [deletingSection, setDeletingSection] = useState<Section | null>(null);

  const deleteMutation = useMutation<null, ApiError, string>({
    mutationFn: (id) =>
      apiFetch<null>(`/sections/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Section deleted successfully.");
      setDeletingSection(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "sections"] });
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Unable to delete section.");
    },
  });

  const columns: DataTableColumn<Section>[] = [
    {
      id: "section",
      header: "Course & Section",
      sortKey: "sectionNumber",
      cell: (row) => (
        <div className="min-w-0 max-w-[240px] whitespace-normal">
          <div className="flex items-center gap-1.5">
            <StatusBadge status="ACTIVE" label={row.course?.code ?? "—"} />
            <span className="text-xs font-semibold text-foreground">
              Sec {row.sectionNumber}
            </span>
          </div>
          {row.course?.title ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {row.course.title}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "semester",
      header: "Semester",
      cell: (row) =>
        row.semester ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-foreground">
              {row.semester.name}
            </span>
            <div>
              <StatusBadge status={row.semester.status} />
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      id: "instructor",
      header: "Instructor",
      cell: (row) =>
        row.instructor ? (
          <div className="text-xs">
            <p className="font-medium text-foreground">
              {row.instructor.user.firstName} {row.instructor.user.lastName}
            </p>
            <p className="text-muted-foreground">
              {row.instructor.employeeId}
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        ),
    },
    {
      id: "schedule",
      header: "Schedule & Room",
      cell: (row) => {
        const slotCounts = new Map<string, number>();
        return (
          <div className="space-y-1 whitespace-normal max-w-[240px]">
            <div className="flex flex-wrap gap-1">
              {row.schedule.map((slot) => {
                const base = `${slot.day}-${slot.startTime}-${slot.endTime}`;
                const occurrence = (slotCounts.get(base) ?? 0) + 1;
                slotCounts.set(base, occurrence);
                return (
                  <Badge
                    key={`${row.id}-${base}-${occurrence}`}
                    variant="outline"
                    className="text-[11px]"
                  >
                    {slot.day} {slot.startTime}–{slot.endTime}
                  </Badge>
                );
              })}
            </div>
            {row.room ? (
              <p className="text-xs text-muted-foreground">{row.room}</p>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "capacity",
      header: "Seats",
      sortKey: "capacity",
      cell: (row) => (
        <span className="text-xs font-medium text-foreground tabular-nums">
          {row.enrolledCount} / {row.capacity}
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
              aria-label={`Actions for Section ${row.sectionNumber}`}
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={() => setEditingSection(row)}>
              <Pencil className="size-4" aria-hidden="true" />
              <span>Edit Section</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setAssigningSection(row)}>
              <UserCheck className="size-4" aria-hidden="true" />
              <span>Assign Instructor</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeletingSection(row)}
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
        placeholder="Search by section, room, or course..."
        ariaLabel="Search sections"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={semesterFilter}
          onValueChange={(value) =>
            setParam("semesterId", value === "all" ? null : value)
          }
        >
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter by semester">
            <SelectValue placeholder="All semesters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All semesters</SelectItem>
            {semesters.map((sem) => (
              <SelectItem key={sem.id} value={sem.id}>
                {sem.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={courseFilter}
          onValueChange={(value) =>
            setParam("courseId", value === "all" ? null : value)
          }
        >
          <SelectTrigger className="w-full sm:w-52" aria-label="Filter by course">
            <SelectValue placeholder="All courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.code} — {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              resetParams(["q", "semesterId", "courseId", "page"])
            }
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
            <ListOrdered
              className="size-6 text-accent-brand"
              aria-hidden="true"
            />
            Course Sections &amp; Scheduling
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule course sections, assign faculty, and manage weekly meeting slots.
          </p>
        </div>

        <Button type="button" onClick={() => setWizardOpen(true)}>
          <Plus className="size-4" aria-hidden="true" />
          Schedule Section
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={sections}
        getRowKey={(row) => row.id}
        toolbar={toolbar}
        sortBy={sortBy}
        order={order}
        onSortChange={toggleSort}
        meta={meta}
        onPageChange={setPage}
        onLimitChange={setLimit}
        emptyTitle="No sections scheduled"
        emptyDescription="Launch the scheduling wizard to create a course section."
        emptyAction={
          <Button type="button" onClick={() => setWizardOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Schedule Section
          </Button>
        }
      />

      <SectionWizardDialog
        courses={courses}
        semesters={semesters}
        instructors={instructors}
        open={wizardOpen}
        onOpenChange={setWizardOpen}
      />

      <EditSectionDialog
        section={editingSection}
        open={Boolean(editingSection)}
        onOpenChange={(open) => {
          if (!open) setEditingSection(null);
        }}
      />

      <AssignInstructorDialog
        section={assigningSection}
        instructors={instructors}
        open={Boolean(assigningSection)}
        onOpenChange={(open) => {
          if (!open) setAssigningSection(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingSection)}
        onOpenChange={(open) => {
          if (!open) setDeletingSection(null);
        }}
        title="Delete section"
        description={
          deletingSection
            ? `Soft-delete ${deletingSection.course?.code ?? ""} Section ${deletingSection.sectionNumber}?`
            : undefined
        }
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deletingSection) {
            deleteMutation.mutate(deletingSection.id);
          }
        }}
      />
    </div>
  );
}
