"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  GraduationCap,
  MapPin,
  Trash2,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";
import type { ApiError } from "@/lib/api-error";
import { formatDate } from "@/lib/format";
import type { Enrollment, Semester } from "@/types/api";

export interface StudentCoursesClientProps {
  enrollments: Enrollment[];
  activeSemester: Semester | null;
}

export function StudentCoursesClient({
  enrollments,
  activeSemester,
}: StudentCoursesClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [droppingEnrollment, setDroppingEnrollment] =
    useState<Enrollment | null>(null);

  const activeEnrollments = enrollments.filter(
    (enrollment) => enrollment.status === "ENROLLED"
  );
  const pastEnrollments = enrollments.filter(
    (enrollment) => enrollment.status !== "ENROLLED"
  );

  const dropMutation = useMutation<Enrollment, ApiError, string>({
    mutationFn: (enrollmentId) =>
      apiFetch<Enrollment>(`/enrollments/${enrollmentId}/drop`, {
        method: "PATCH",
      }),
    onSuccess: (dropped) => {
      const code = dropped.section?.course?.code ?? "course";
      toast.success(`Dropped ${code} successfully.`);
      setDroppingEnrollment(null);
      queryClient.invalidateQueries({ queryKey: ["student"] });
      router.refresh();
    },
    onError: (error) => {
      setDroppingEnrollment(null);
      toast.error(error.message || "Unable to drop this course.");
    },
  });

  function renderEnrollmentCard(enrollment: Enrollment, allowDrop: boolean) {
    const { section } = enrollment;
    const slotCounts = new Map<string, number>();

    return (
      <Card
        key={enrollment.id}
        className="glass flex flex-col justify-between rounded-2xl border-white/10"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {section.course?.code ?? "COURSE"}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Sec {section.sectionNumber}
                </Badge>
                {section.course?.credits !== undefined ? (
                  <span className="text-xs text-muted-foreground">
                    {section.course.credits} cr
                  </span>
                ) : null}
              </div>
              <CardTitle className="pt-1 text-base leading-snug">
                {section.course?.title ?? "Course Section"}
              </CardTitle>
            </div>
            <StatusBadge status={enrollment.status} />
          </div>

          <CardDescription className="text-xs">
            {section.semester?.name ? `${section.semester.name} · ` : ""}
            {section.instructor
              ? `${section.instructor.user.firstName} ${section.instructor.user.lastName}`
              : "Instructor TBA"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{section.room ? `Room ${section.room}` : "Room TBA"}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 shrink-0" aria-hidden="true" />
              <span>
                Enrolled {formatDate(enrollment.enrolledAt)}
                {enrollment.droppedAt
                  ? ` · Dropped ${formatDate(enrollment.droppedAt)}`
                  : ""}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {section.schedule.length > 0 ? (
                section.schedule.map((slot) => {
                  const base = `${slot.day}-${slot.startTime}-${slot.endTime}`;
                  const occ = (slotCounts.get(base) ?? 0) + 1;
                  slotCounts.set(base, occ);
                  return (
                    <Badge
                      key={`${enrollment.id}-${base}-${occ}`}
                      variant="secondary"
                      className="font-mono text-[11px]"
                    >
                      {slot.day} {slot.startTime}–{slot.endTime}
                    </Badge>
                  );
                })
              ) : (
                <span>No schedule slots assigned</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/student/attendance">
                  <UserCheck className="size-3.5" aria-hidden="true" />
                  Attendance
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/student/results">
                  <GraduationCap className="size-3.5" aria-hidden="true" />
                  Results
                </Link>
              </Button>
            </div>

            {allowDrop ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setDroppingEnrollment(enrollment)}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Drop Course
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    );
  }

  const dropDeadlineText = activeSemester?.registrationEnd
    ? `Courses can only be dropped before the registration/drop deadline (${formatDate(activeSemester.registrationEnd)}).`
    : "Courses can only be dropped before the semester's drop deadline.";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <BookOpen className="size-6 text-accent-brand" aria-hidden="true" />
            <span>My Enrolled Courses</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Review your active registrations, completed courses, or drop a
            section within the allowed deadline.
          </p>
        </div>

        <Button size="sm" asChild>
          <Link href="/student/registration">Register for Courses</Link>
        </Button>
      </div>

      {/* Drop Deadline Notice */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-amber-600/30 bg-amber-500/15 p-4 text-xs text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <AlertTriangle
          className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400"
          aria-hidden="true"
        />
        <p>
          <strong>Drop Policy:</strong> {dropDeadlineText} Dropping a course
          frees your seat immediately and cannot be undone once past the
          deadline.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeEnrollments.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Completed &amp; Dropped ({pastEnrollments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeEnrollments.length === 0 ? (
            <EmptyState
              title="No active enrollments"
              description="You are not currently enrolled in any active sections."
              action={
                <Button asChild>
                  <Link href="/student/registration">Browse Open Sections</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {activeEnrollments.map((enrollment) =>
                renderEnrollmentCard(enrollment, true)
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {pastEnrollments.length === 0 ? (
            <EmptyState
              title="No past or dropped courses"
              description="Completed and dropped course enrollments will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pastEnrollments.map((enrollment) =>
                renderEnrollmentCard(enrollment, false)
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Drop Course Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(droppingEnrollment)}
        onOpenChange={(open) => {
          if (!open) setDroppingEnrollment(null);
        }}
        title={
          droppingEnrollment
            ? `Drop ${droppingEnrollment.section.course?.code ?? "Course"} (Sec ${droppingEnrollment.section.sectionNumber})?`
            : "Drop Course"
        }
        description={
          droppingEnrollment
            ? `Are you sure you want to drop "${droppingEnrollment.section.course?.title ?? "this course"}"? ${dropDeadlineText} Re-enrolling later is subject to seat availability and registration window rules.`
            : undefined
        }
        confirmLabel="Confirm Drop"
        variant="destructive"
        isLoading={dropMutation.isPending}
        onConfirm={() => {
          if (droppingEnrollment) {
            dropMutation.mutate(droppingEnrollment.id);
          }
        }}
      />
    </div>
  );
}
