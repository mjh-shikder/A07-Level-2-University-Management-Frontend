"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  CheckCheck,
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  Loader2,
  Save,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useUrlState } from "@/hooks/use-url-state";
import { apiFetch } from "@/lib/api";
import type { ApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import {
  AttendanceStatusEnum,
  bulkMarkAttendanceFormSchema,
  type AttendanceRecord,
  type AttendanceStatus,
  type Enrollment,
  type Section,
} from "@/types/api";

const STATUS_OPTIONS: AttendanceStatus[] = AttendanceStatusEnum.options;

const STATUS_BUTTON_STYLES: Record<
  AttendanceStatus,
  { active: string; label: string }
> = {
  PRESENT: {
    active:
      "border-emerald-500/50 bg-emerald-500/20 text-emerald-300 shadow-xs",
    label: "Present",
  },
  ABSENT: {
    active: "border-destructive/50 bg-destructive/20 text-red-300 shadow-xs",
    label: "Absent",
  },
  LATE: {
    active: "border-amber-500/50 bg-amber-500/20 text-amber-300 shadow-xs",
    label: "Late",
  },
  EXCUSED: {
    active: "border-blue-400/50 bg-blue-500/20 text-blue-300 shadow-xs",
    label: "Excused",
  },
};

interface DraftRecord {
  status: AttendanceStatus;
  remarks: string;
}

export interface SectionAttendanceClientProps {
  section: Section;
  enrollments: Enrollment[];
}

export function SectionAttendanceClient({
  section,
  enrollments,
}: SectionAttendanceClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getParam, setParam } = useUrlState();

  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const selectedDate = getParam("date", today);

  const attendanceQueryKey = [
    "instructor",
    "sections",
    section.id,
    "attendance",
    selectedDate,
  ] as const;

  const attendanceQuery = useQuery<AttendanceRecord[], ApiError>({
    queryKey: attendanceQueryKey,
    queryFn: () =>
      apiFetch<AttendanceRecord[]>(`/sections/${section.id}/attendance`, {
        params: { date: selectedDate, limit: 100 },
      }),
  });

  const [drafts, setDrafts] = useState<Record<string, DraftRecord>>({});

  useEffect(() => {
    const existingByEnrollment = new Map<string, AttendanceRecord>();
    for (const rec of attendanceQuery.data ?? []) {
      existingByEnrollment.set(rec.enrollmentId, rec);
    }

    const nextDrafts: Record<string, DraftRecord> = {};
    for (const enrollment of enrollments) {
      const existing = existingByEnrollment.get(enrollment.id);
      nextDrafts[enrollment.id] = {
        status: existing?.status ?? "PRESENT",
        remarks: existing?.remarks ?? "",
      };
    }
    setDrafts(nextDrafts);
  }, [attendanceQuery.data, enrollments]);

  const mutation = useMutation<
    unknown,
    ApiError,
    {
      date: string;
      records: Array<{
        enrollmentId: string;
        status: AttendanceStatus;
        remarks?: string;
      }>;
    },
    { previous?: AttendanceRecord[] }
  >({
    mutationFn: (payload) =>
      apiFetch(`/sections/${section.id}/attendance`, {
        method: "POST",
        body: payload,
      }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: attendanceQueryKey });
      const previous =
        queryClient.getQueryData<AttendanceRecord[]>(attendanceQueryKey);

      const optimistic: AttendanceRecord[] = variables.records.map((rec) => ({
        id: `optimistic-${rec.enrollmentId}`,
        enrollmentId: rec.enrollmentId,
        sectionId: section.id,
        date: variables.date,
        status: rec.status,
        remarks: rec.remarks ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      queryClient.setQueryData(attendanceQueryKey, optimistic);
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(attendanceQueryKey, context.previous);
      }
      toast.error(error.message || "Unable to save attendance.");
    },
    onSuccess: () => {
      toast.success(`Attendance saved for ${selectedDate}.`);
      queryClient.invalidateQueries({ queryKey: attendanceQueryKey });
      router.refresh();
    },
  });

  function updateStatus(enrollmentId: string, status: AttendanceStatus) {
    setDrafts((prev) => ({
      ...prev,
      [enrollmentId]: {
        status,
        remarks: prev[enrollmentId]?.remarks ?? "",
      },
    }));
  }

  function updateRemarks(enrollmentId: string, remarks: string) {
    setDrafts((prev) => ({
      ...prev,
      [enrollmentId]: {
        status: prev[enrollmentId]?.status ?? "PRESENT",
        remarks,
      },
    }));
  }

  function handleMarkAllPresent() {
    setDrafts((prev) => {
      const updated: Record<string, DraftRecord> = {};
      for (const enrollment of enrollments) {
        updated[enrollment.id] = {
          status: "PRESENT",
          remarks: prev[enrollment.id]?.remarks ?? "",
        };
      }
      return updated;
    });
  }

  function handleSave() {
    const records = enrollments.map((enrollment) => {
      const entry = drafts[enrollment.id];
      const trimmedRemarks = entry?.remarks.trim();
      return {
        enrollmentId: enrollment.id,
        status: entry?.status ?? "PRESENT",
        ...(trimmedRemarks ? { remarks: trimmedRemarks } : {}),
      };
    });

    const parsed = bulkMarkAttendanceFormSchema.safeParse({
      date: selectedDate,
      records,
    });

    if (!parsed.success) {
      toast.error(
        parsed.error.issues[0]?.message ?? "Please check attendance entries."
      );
      return;
    }

    mutation.mutate(parsed.data);
  }

  const counts = useMemo(() => {
    const summary: Record<AttendanceStatus, number> = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
    };
    for (const enrollment of enrollments) {
      const status = drafts[enrollment.id]?.status ?? "PRESENT";
      summary[status] += 1;
    }
    return summary;
  }, [drafts, enrollments]);

  const hasSavedRecords = (attendanceQuery.data?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Section Links */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/instructor">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to Sections
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/instructor/sections/${section.id}/students`}>
                <Users className="size-4" aria-hidden="true" />
                Roster
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/instructor/sections/${section.id}/exams`}>
                <FileSpreadsheet className="size-4" aria-hidden="true" />
                Exams
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/instructor/sections/${section.id}/results`}>
                <GraduationCap className="size-4" aria-hidden="true" />
                Gradebook
              </Link>
            </Button>
          </div>

          <h1 className="flex flex-wrap items-center gap-2 pt-1 text-2xl font-bold tracking-tight text-foreground">
            <ClipboardCheck
              className="size-6 text-accent-brand"
              aria-hidden="true"
            />
            <span>
              {section.course?.code ?? "Course"} · Sec {section.sectionNumber}{" "}
              Attendance
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {section.course?.title}
            {section.semester ? ` · ${section.semester.name}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            status={hasSavedRecords ? "PUBLISHED" : "DRAFT"}
            label={hasSavedRecords ? "Recorded for Date" : "Not Yet Submitted"}
          />
        </div>
      </div>

      {/* Date Picker & Quick Actions Toolbar */}
      <Card className="glass rounded-2xl border-white/10">
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="attendance-date"
                className="flex items-center gap-1.5 text-xs"
              >
                <CalendarDays className="size-3.5" aria-hidden="true" />
                Session Date
              </Label>
              <Input
                id="attendance-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setParam("date", e.target.value || today)}
                className="w-44"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs tabular-nums">
                Present: {counts.PRESENT}
              </Badge>
              <Badge variant="outline" className="text-xs tabular-nums">
                Absent: {counts.ABSENT}
              </Badge>
              <Badge variant="outline" className="text-xs tabular-nums">
                Late: {counts.LATE}
              </Badge>
              <Badge variant="outline" className="text-xs tabular-nums">
                Excused: {counts.EXCUSED}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={enrollments.length === 0 || mutation.isPending}
              onClick={handleMarkAllPresent}
            >
              <CheckCheck className="size-4" aria-hidden="true" />
              Mark All Present
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={enrollments.length === 0 || mutation.isPending}
              onClick={handleSave}
            >
              {mutation.isPending ? (
                <>
                  <Loader2
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="size-4" aria-hidden="true" />
                  Save Attendance
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Attendance Sheet */}
      {enrollments.length === 0 ? (
        <EmptyState
          title="No enrolled students"
          description="There are no active enrolled students in this section to mark attendance for."
        />
      ) : attendanceQuery.isLoading ? (
        <Card className="glass rounded-2xl border-white/10">
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </CardContent>
        </Card>
      ) : (
        <Card className="glass rounded-2xl border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Student Attendance Sheet ({enrollments.length} enrolled)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {enrollments.map((enrollment) => {
              const current = drafts[enrollment.id] ?? {
                status: "PRESENT",
                remarks: "",
              };

              return (
                <div
                  key={enrollment.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/70 bg-secondary/25 p-3.5 xl:flex-row xl:items-center xl:justify-between"
                >
                  <div className="min-w-0 xl:w-64">
                    <p className="font-mono text-xs font-semibold text-primary">
                      {enrollment.student?.studentId ?? "—"}
                    </p>
                    <p className="truncate text-sm font-medium text-foreground">
                      {enrollment.student
                        ? `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`
                        : "Unknown Student"}
                    </p>
                  </div>

                  <fieldset
                    aria-label={`Attendance for ${enrollment.student?.studentId ?? enrollment.id}`}
                    className="flex flex-wrap gap-1.5 border-0 p-0 m-0"
                  >
                    {STATUS_OPTIONS.map((option) => {
                      const isSelected = current.status === option;
                      const style = STATUS_BUTTON_STYLES[option];
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={isSelected}
                          disabled={mutation.isPending}
                          onClick={() => updateStatus(enrollment.id, option)}
                          className={cn(
                            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                            isSelected
                              ? style.active
                              : "border-border/70 bg-background/40 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                          )}
                        >
                          {style.label}
                        </button>
                      );
                    })}
                  </fieldset>

                  <div className="w-full xl:w-60">
                    <Input
                      value={current.remarks}
                      maxLength={255}
                      disabled={mutation.isPending}
                      onChange={(e) =>
                        updateRemarks(enrollment.id, e.target.value)
                      }
                      placeholder="Optional remarks..."
                      aria-label={`Remarks for ${enrollment.student?.studentId ?? enrollment.id}`}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
