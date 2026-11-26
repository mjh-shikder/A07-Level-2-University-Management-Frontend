"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Building2,
  GitBranch,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { CourseFormDialog } from "@/components/admin/courses/course-form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { apiFetch } from "@/lib/api";
import type { ApiError } from "@/lib/api-error";
import { formatDate } from "@/lib/format";
import type { Course, Program } from "@/types/api";

export interface CourseDetailClientProps {
  course: Course;
  programs: Program[];
  allCourses: Course[];
}

export function CourseDetailClient({
  course,
  programs,
  allCourses,
}: CourseDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [selectedPrereqId, setSelectedPrereqId] = useState<string>("");
  const [prereqError, setPrereqError] = useState<string | null>(null);
  const [removingPrereq, setRemovingPrereq] = useState<{
    id: string;
    code: string;
    title: string;
  } | null>(null);

  const existingPrereqIds = new Set(
    (course.prerequisites ?? []).map((p) => p.prerequisite.id)
  );

  const candidateCourses = allCourses.filter(
    (c) => c.id !== course.id && !existingPrereqIds.has(c.id)
  );

  const addPrereqMutation = useMutation<unknown, ApiError, string>({
    mutationFn: (prerequisiteId) =>
      apiFetch(`/courses/${course.id}/prerequisites`, {
        method: "POST",
        body: { prerequisiteId },
      }),
    onSuccess: () => {
      setPrereqError(null);
      setSelectedPrereqId("");
      toast.success("Prerequisite linked successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses", course.id] });
      router.refresh();
    },
    onError: (error) => {
      const msg = error.message || "Unable to add prerequisite.";
      setPrereqError(msg);
      toast.error(msg);
    },
  });

  const removePrereqMutation = useMutation<unknown, ApiError, string>({
    mutationFn: (prerequisiteId) =>
      apiFetch(`/courses/${course.id}/prerequisites/${prerequisiteId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Prerequisite removed.");
      setRemovingPrereq(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses", course.id] });
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Unable to remove prerequisite.");
    },
  });

  const prerequisites = course.prerequisites ?? [];
  const dependents = course.prerequisiteFor ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/courses">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to Catalog
            </Link>
          </Button>
          <StatusBadge status="ACTIVE" label={course.code} />
          <Badge variant="secondary" className="tabular-nums">
            {course.credits} Credits
          </Badge>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="size-4" aria-hidden="true" />
          Edit Course
        </Button>
      </div>

      {/* Course Syllabus & Metadata Card */}
      <Card className="glass rounded-2xl border-white/10">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <BookOpen className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-xl">{course.title}</CardTitle>
              <CardDescription className="mt-1">
                Course syllabus details, credit allocation, and program affiliation.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 rounded-xl border border-border/70 bg-secondary/30 p-4 sm:grid-cols-3">
            <div className="flex items-start gap-2.5">
              <GraduationCap
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Program</p>
                <p className="truncate text-sm font-medium text-foreground">
                  {course.program
                    ? `${course.program.code} — ${course.program.name}`
                    : "—"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Building2
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="truncate text-sm font-medium text-foreground">
                  {course.program?.department
                    ? `${course.program.department.code} — ${course.program.department.name}`
                    : "—"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Last Updated</p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(course.updatedAt)}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Syllabus &amp; Course Overview
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {course.description?.trim() ||
                "No syllabus description has been added for this course yet."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Prerequisites & Dependent Courses */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Required Prerequisites */}
        <Card className="glass rounded-2xl border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="size-4 text-primary" aria-hidden="true" />
              Required Prerequisites
            </CardTitle>
            <CardDescription>
              Courses students must complete before enrolling in {course.code}.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select
                value={selectedPrereqId}
                onValueChange={(value) => {
                  setSelectedPrereqId(value);
                  setPrereqError(null);
                }}
                disabled={
                  addPrereqMutation.isPending || candidateCourses.length === 0
                }
              >
                <SelectTrigger className="flex-1" aria-label="Select prerequisite course">
                  <SelectValue
                    placeholder={
                      candidateCourses.length === 0
                        ? "No eligible courses left"
                        : "Select a prerequisite course..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {candidateCourses.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.code} — {candidate.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                disabled={!selectedPrereqId || addPrereqMutation.isPending}
                onClick={() => {
                  if (selectedPrereqId) {
                    addPrereqMutation.mutate(selectedPrereqId);
                  }
                }}
              >
                {addPrereqMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="size-4" aria-hidden="true" />
                )}
                Add
              </Button>
            </div>

            {prereqError ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-destructive/35 bg-destructive/10 p-3 text-xs text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{prereqError}</span>
              </div>
            ) : null}

            {prerequisites.length === 0 ? (
              <EmptyState
                title="No prerequisites required"
                description="Students can enroll in this course without prior course completions."
                className="border-0 bg-transparent py-6"
              />
            ) : (
              <div className="flex flex-col gap-2">
                {prerequisites.map(({ prerequisite }) => (
                  <div
                    key={prerequisite.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-secondary/25 px-3.5 py-2.5"
                  >
                    <Link
                      href={`/admin/courses/${prerequisite.id}`}
                      className="flex min-w-0 items-center gap-2.5 hover:underline"
                    >
                      <Badge variant="outline" className="shrink-0">
                        {prerequisite.code}
                      </Badge>
                      <span className="truncate text-sm font-medium text-foreground">
                        {prerequisite.title}
                      </span>
                    </Link>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {prerequisite.credits} cr
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove prerequisite ${prerequisite.code}`}
                        onClick={() => setRemovingPrereq(prerequisite)}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dependent Courses */}
        <Card className="glass rounded-2xl border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="size-4 text-primary" aria-hidden="true" />
              Unlocks Subsequent Courses
            </CardTitle>
            <CardDescription>
              Courses that list {course.code} as a required prerequisite.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {dependents.length === 0 ? (
              <EmptyState
                title="No dependent courses"
                description="No other courses currently require this course as a prerequisite."
                className="border-0 bg-transparent py-8"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {dependents.map(({ course: dependent }) => (
                  <Link key={dependent.id} href={`/admin/courses/${dependent.id}`}>
                    <Badge
                      variant="outline"
                      className="gap-1.5 px-3 py-1.5 text-xs transition-colors hover:border-primary/50 hover:bg-primary/10"
                    >
                      <span className="font-semibold text-primary">
                        {dependent.code}
                      </span>
                      <span>{dependent.title}</span>
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CourseFormDialog
        course={course}
        programs={programs}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <ConfirmDialog
        open={Boolean(removingPrereq)}
        onOpenChange={(open) => {
          if (!open) setRemovingPrereq(null);
        }}
        title="Remove prerequisite"
        description={
          removingPrereq
            ? `Remove "${removingPrereq.code} — ${removingPrereq.title}" as a prerequisite for ${course.code}?`
            : undefined
        }
        confirmLabel="Remove"
        variant="destructive"
        isLoading={removePrereqMutation.isPending}
        onConfirm={() => {
          if (removingPrereq) {
            removePrereqMutation.mutate(removingPrereq.id);
          }
        }}
      />
    </div>
  );
}
