"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  XCircle,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUrlState } from "@/hooks/use-url-state";
import { apiFetch } from "@/lib/api";
import type { ApiError } from "@/lib/api-error";
import { formatDate, normalizeDecimal } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  AttendanceRecord,
  AttendanceStatus,
  AttendanceSummary,
  Enrollment,
} from "@/types/api";

type RawAttendanceSummary = Partial<AttendanceSummary> & {
  total?: number;
  present?: number;
  absent?: number;
  late?: number;
  excused?: number;
  percentage?: number | string;
};

function normalizeAttendanceSummary(
  raw: RawAttendanceSummary | null | undefined
): AttendanceSummary | null {
  if (!raw) return null;
  return {
    totalClasses: raw.total ?? raw.totalClasses ?? 0,
    presentCount: raw.present ?? raw.presentCount ?? 0,
    absentCount: raw.absent ?? raw.absentCount ?? 0,
    lateCount: raw.late ?? raw.lateCount ?? 0,
    excusedCount: raw.excused ?? raw.excusedCount ?? 0,
    attendancePercentage: normalizeDecimal(
      raw.percentage ?? raw.attendancePercentage,
      0
    ),
  };
}

export interface StudentAttendanceClientProps {
  enrollments: Enrollment[];
  initialEnrollmentId: string;
  initialSummary: AttendanceSummary | null;
  initialRecords: AttendanceRecord[];
}

export function StudentAttendanceClient({
  enrollments,
  initialEnrollmentId,
  initialSummary,
  initialRecords,
}: StudentAttendanceClientProps) {
  const { getParam, setParam } = useUrlState();
  const selectedEnrollmentId =
    getParam("enrollmentId") || initialEnrollmentId;
  const statusFilter = getParam("status", "ALL") as AttendanceStatus | "ALL";

  const activeEnrollment =
    enrollments.find((e) => e.id === selectedEnrollmentId) ??
    enrollments[0] ??
    null;
  const activeId = activeEnrollment?.id ?? "";
  const isInitial = activeId === initialEnrollmentId;

  const summaryQuery = useQuery<AttendanceSummary | null, ApiError>({
    queryKey: ["student", "attendance", activeId, "summary"],
    enabled: Boolean(activeId),
    initialData: isInitial ? initialSummary : undefined,
    queryFn: () =>
      apiFetch<AttendanceSummary>(
        `/enrollments/${activeId}/attendance/summary`
      ),
  });

  const recordsQuery = useQuery<AttendanceRecord[], ApiError>({
    queryKey: ["student", "attendance", activeId, "records", statusFilter],
    enabled: Boolean(activeId),
    initialData:
      isInitial && statusFilter === "ALL" ? initialRecords : undefined,
    queryFn: () =>
      apiFetch<AttendanceRecord[]>(`/enrollments/${activeId}/attendance`, {
        params: {
          limit: 100,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          sortBy: "date",
          order: "desc",
        },
      }),
  });

  const summary = normalizeAttendanceSummary(
    summaryQuery.data as RawAttendanceSummary | null | undefined
  );
  const records = recordsQuery.data ?? [];
  const attendancePct = summary ? summary.attendancePercentage : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <ClipboardList
              className="size-6 text-accent-brand"
              aria-hidden="true"
            />
            <span>My Attendance</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your attendance rate and dated class logs across your enrolled
            courses.
          </p>
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link href="/student/courses">View My Courses</Link>
        </Button>
      </div>

      {enrollments.length === 0 ? (
        <EmptyState
          title="No enrolled courses"
          description="Enroll in a course section to start tracking your class attendance."
          action={
            <Button asChild>
              <Link href="/student/registration">Browse Open Sections</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Filter Bar */}
          <div className="glass flex flex-col gap-3 rounded-2xl border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={activeId}
                onValueChange={(value) => setParam("enrollmentId", value)}
              >
                <SelectTrigger
                  className="w-full sm:w-80"
                  aria-label="Select course enrollment"
                >
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {enrollments.map((enrollment) => (
                    <SelectItem key={enrollment.id} value={enrollment.id}>
                      {enrollment.section.course?.code ?? "COURSE"} · Sec{" "}
                      {enrollment.section.sectionNumber} (
                      {enrollment.section.semester?.name ?? "Semester"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setParam("status", value === "ALL" ? null : value)
                }
              >
                <SelectTrigger
                  className="w-full sm:w-44"
                  aria-label="Filter by status"
                >
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PRESENT">Present</SelectItem>
                  <SelectItem value="LATE">Late</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                  <SelectItem value="EXCUSED">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {activeEnrollment ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{activeEnrollment.section.course?.title}</span>
                <StatusBadge status={activeEnrollment.status} />
              </div>
            ) : null}
          </div>

          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Attendance Rate"
              value={summary ? `${attendancePct.toFixed(1)}%` : "—"}
              subtitle={
                summary
                  ? `${summary.totalClasses} total recorded class${summary.totalClasses === 1 ? "" : "es"}`
                  : "No classes recorded"
              }
              icon={CalendarCheck}
            />
            <StatCard
              title="Present"
              value={summary?.presentCount ?? 0}
              subtitle="On-time attendance"
              icon={CheckCircle2}
            />
            <StatCard
              title="Late / Excused"
              value={(summary?.lateCount ?? 0) + (summary?.excusedCount ?? 0)}
              subtitle={`${summary?.lateCount ?? 0} late · ${summary?.excusedCount ?? 0} excused`}
              icon={Clock}
            />
            <StatCard
              title="Absent"
              value={summary?.absentCount ?? 0}
              subtitle="Unexcused absences"
              icon={XCircle}
            />
          </div>

          {/* Attendance Rate Bar */}
          {summary && summary.totalClasses > 0 ? (
            <Card className="glass rounded-2xl border-white/10">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">
                      Course Attendance Standing
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Present and late sessions count toward your attendance
                      percentage.
                    </CardDescription>
                  </div>
                  <Badge
                    variant={attendancePct >= 75 ? "outline" : "destructive"}
                    className={cn(
                      "font-mono text-xs",
                      attendancePct >= 75
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : ""
                    )}
                  >
                    {attendancePct >= 75 ? "Good Standing" : "Below 75%"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      attendancePct >= 75 ? "bg-emerald-500" : "bg-destructive"
                    )}
                    style={{ width: `${Math.min(100, attendancePct)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Detailed Attendance Logs */}
          <Card className="glass rounded-2xl border-white/10">
            <CardHeader>
              <CardTitle className="text-base">Attendance Log</CardTitle>
              <CardDescription>
                Chronological record of class sessions for{" "}
                {activeEnrollment?.section.course?.code ?? "this course"}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recordsQuery.isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ) : records.length === 0 ? (
                <EmptyState
                  title="No attendance records found"
                  description={
                    statusFilter !== "ALL"
                      ? "No sessions match the selected status filter."
                      : "Your instructor has not recorded attendance for this course yet."
                  }
                  className="border-0 bg-transparent py-8"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Instructor Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono text-xs font-medium text-foreground">
                          {formatDate(record.date)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={record.status} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {record.remarks || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
