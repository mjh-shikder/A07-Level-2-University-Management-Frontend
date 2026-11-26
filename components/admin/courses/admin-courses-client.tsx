"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { CourseFormDialog } from "@/components/admin/courses/course-form-dialog";
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
import { formatDate } from "@/lib/format";
import type { Course, Program, TPaginationMeta } from "@/types/api";

export interface AdminCoursesClientProps {
  courses: Course[];
  programs: Program[];
  allCourses: Course[];
  meta?: TPaginationMeta;
}

export function AdminCoursesClient({
  courses,
  programs,
  allCourses,
  meta,
}: AdminCoursesClientProps) {
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

  const programFilter = getParam("programId", "all");
  const hasFilters = Boolean(q || (programFilter && programFilter !== "all"));

  const [formOpen, setFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

  const deleteMutation = useMutation<null, ApiError, string>({
    mutationFn: (id) =>
      apiFetch<null>(`/courses/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Course deleted successfully.");
      setDeletingCourse(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Unable to delete course.");
    },
  });

  const columns: DataTableColumn<Course>[] = [
    {
      id: "code",
      header: "Code",
      sortKey: "code",
      cell: (row) => (
        <Link
          href={`/admin/courses/${row.id}`}
          className="inline-flex items-center gap-1.5 font-medium hover:underline"
        >
          <StatusBadge status="ACTIVE" label={row.code} />
        </Link>
      ),
    },
    {
      id: "title",
      header: "Course Title",
      sortKey: "title",
      cell: (row) => (
        <div className="min-w-0 max-w-[260px] whitespace-normal">
          <Link
            href={`/admin/courses/${row.id}`}
            className="font-medium text-foreground hover:text-primary hover:underline"
          >
            {row.title}
          </Link>
          {row.description ? (
            <p className="truncate text-xs text-muted-foreground">
              {row.description}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "program",
      header: "Program / Dept",
      cell: (row) =>
        row.program ? (
          <div className="text-xs">
            <p className="font-medium text-foreground">{row.program.code}</p>
            {row.program.department ? (
              <p className="text-muted-foreground">
                {row.program.department.code}
              </p>
            ) : null}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      id: "credits",
      header: "Credits",
      sortKey: "credits",
      cell: (row) => (
        <span className="text-sm font-medium text-foreground tabular-nums">
          {row.credits} cr
        </span>
      ),
    },
    {
      id: "prerequisites",
      header: "Prerequisites",
      cell: (row) => {
        const prereqs = row.prerequisites ?? [];
        if (prereqs.length === 0) {
          return <span className="text-xs text-muted-foreground">None</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {prereqs.slice(0, 2).map((item) => (
              <Badge key={item.prerequisite.id} variant="outline" className="text-xs">
                {item.prerequisite.code}
              </Badge>
            ))}
            {prereqs.length > 2 ? (
              <Badge variant="secondary" className="text-xs">
                +{prereqs.length - 2}
              </Badge>
            ) : null}
          </div>
        );
      },
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
              aria-label={`Actions for ${row.code}`}
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={`/admin/courses/${row.id}`}>
                <ExternalLink className="size-4" aria-hidden="true" />
                <span>Syllabus &amp; Prereqs</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                setEditingCourse(row);
                setFormOpen(true);
              }}
            >
              <Pencil className="size-4" aria-hidden="true" />
              <span>Edit Course</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeletingCourse(row)}
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
        placeholder="Search courses by code or title..."
        ariaLabel="Search courses"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={programFilter}
          onValueChange={(value) =>
            setParam("programId", value === "all" ? null : value)
          }
        >
          <SelectTrigger
            className="w-full sm:w-64"
            aria-label="Filter by program"
          >
            <SelectValue placeholder="All programs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All programs</SelectItem>
            {programs.map((program) => (
              <SelectItem key={program.id} value={program.id}>
                {program.code} — {program.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => resetParams(["q", "programId", "page"])}
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
            <BookOpen className="size-6 text-accent-brand" aria-hidden="true" />
            Course Catalog
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage university courses, credit hours, syllabus details, and prerequisites.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setEditingCourse(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add Course
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={courses}
        getRowKey={(row) => row.id}
        toolbar={toolbar}
        sortBy={sortBy}
        order={order}
        onSortChange={toggleSort}
        meta={meta}
        onPageChange={setPage}
        onLimitChange={setLimit}
        emptyTitle="No courses found"
        emptyDescription="Add your first course or adjust your program and search filters."
        emptyAction={
          hasFilters ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => resetParams(["q", "programId", "page"])}
            >
              Reset filters
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => {
                setEditingCourse(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              Add Course
            </Button>
          )
        }
      />

      <CourseFormDialog
        course={editingCourse}
        programs={programs}
        availableCourses={allCourses}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingCourse(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingCourse)}
        onOpenChange={(open) => {
          if (!open) setDeletingCourse(null);
        }}
        title="Delete course"
        description={
          deletingCourse
            ? `Soft-delete "${deletingCourse.code} — ${deletingCourse.title}"? Existing sections or prerequisites may be impacted.`
            : undefined
        }
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deletingCourse) {
            deleteMutation.mutate(deletingCourse.id);
          }
        }}
      />
    </div>
  );
}
