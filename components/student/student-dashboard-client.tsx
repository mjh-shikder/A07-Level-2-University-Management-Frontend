"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  CalendarClock,
  Clock,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Receipt,
  ScrollText,
  UserCheck,
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
import { formatCurrency, formatDate, normalizeDecimal } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  DayOfWeekEnum,
  type DayOfWeek,
  type Enrollment,
  type Invoice,
  type Semester,
  type StudentGPASummary,
  type UserSummary,
} from "@/types/api";

const ORDERED_DAYS: DayOfWeek[] = DayOfWeekEnum.options;

const DAY_LABELS: Record<DayOfWeek, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

export interface StudentDashboardClientProps {
  student: UserSummary;
  activeSemester: Semester | null;
  enrollments: Enrollment[];
  gpaSummary: StudentGPASummary | null;
  invoices: Invoice[];
}

export function StudentDashboardClient({
  student,
  activeSemester,
  enrollments,
  gpaSummary,
  invoices,
}: StudentDashboardClientProps) {
  const unpaidInvoices = invoices.filter(
    (invoice) => invoice.status === "OVERDUE" || invoice.status === "PENDING"
  );
  const overdueInvoices = unpaidInvoices.filter(
    (invoice) => invoice.status === "OVERDUE"
  );
  const hasOverdue = overdueInvoices.length > 0;
  const totalUnpaidAmount = unpaidInvoices.reduce(
    (sum, invoice) => sum + normalizeDecimal(invoice.amount, 0),
    0
  );
  const earliestDueInvoice = unpaidInvoices[0] ?? null;

  const activeCredits = enrollments.reduce(
    (sum, enrollment) =>
      sum + normalizeDecimal(enrollment.section.course?.credits, 0),
    0
  );

  const cgpa = gpaSummary ? normalizeDecimal(gpaSummary.cgpa, 0) : null;
  const creditsEarned = gpaSummary
    ? normalizeDecimal(gpaSummary.creditsEarned, 0)
    : 0;
  const requiredCredits = gpaSummary
    ? normalizeDecimal(gpaSummary.requiredCredits, 0)
    : 0;

  // Build weekly timetable grouped by day of week from active semester enrollments
  const scheduleByDay = new Map<
    DayOfWeek,
    Array<{
      key: string;
      courseCode: string;
      courseTitle: string;
      sectionNumber: string;
      startTime: string;
      endTime: string;
      room?: string | null;
      instructorName: string | null;
    }>
  >();

  for (const day of ORDERED_DAYS) {
    scheduleByDay.set(day, []);
  }

  for (const enrollment of enrollments) {
    const { section } = enrollment;
    const instructorName = section.instructor
      ? `${section.instructor.user.firstName} ${section.instructor.user.lastName}`
      : null;
    const slotCounts = new Map<string, number>();

    for (const slot of section.schedule) {
      const base = `${slot.day}-${slot.startTime}-${slot.endTime}`;
      const occ = (slotCounts.get(base) ?? 0) + 1;
      slotCounts.set(base, occ);
      const bucket = scheduleByDay.get(slot.day);
      if (bucket) {
        bucket.push({
          key: `${enrollment.id}-${base}-${occ}`,
          courseCode: section.course?.code ?? "COURSE",
          courseTitle: section.course?.title ?? "Enrolled Course",
          sectionNumber: section.sectionNumber,
          startTime: slot.startTime,
          endTime: slot.endTime,
          room: section.room,
          instructorName,
        });
      }
    }
  }

  for (const day of ORDERED_DAYS) {
    scheduleByDay
      .get(day)
      ?.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  const activeScheduleDays = ORDERED_DAYS.filter(
    (day) => (scheduleByDay.get(day)?.length ?? 0) > 0
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Urgent Unpaid Tuition Invoice Banner */}
      {unpaidInvoices.length > 0 ? (
        <div
          role="alert"
          className={cn(
            "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between",
            hasOverdue
              ? "border-destructive/40 bg-destructive/10 text-destructive-foreground"
              : "border-amber-500/40 bg-amber-500/10 text-amber-100"
          )}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={cn(
                "mt-0.5 size-5 shrink-0",
                hasOverdue ? "text-destructive" : "text-amber-400"
              )}
              aria-hidden="true"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {hasOverdue
                    ? `Urgent: ${overdueInvoices.length} Overdue Tuition Invoice${overdueInvoices.length > 1 ? "s" : ""}`
                    : `${unpaidInvoices.length} Unpaid Tuition Invoice${unpaidInvoices.length > 1 ? "s" : ""} Pending`}
                </p>
                <StatusBadge status={hasOverdue ? "OVERDUE" : "PENDING"} />
              </div>
              <p className="text-xs text-muted-foreground">
                Outstanding balance:{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(totalUnpaidAmount)}
                </span>
                {earliestDueInvoice
                  ? ` · Earliest due ${formatDate(earliestDueInvoice.dueDate)}`
                  : ""}
                . Course registration is restricted while invoices remain unpaid.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant={hasOverdue ? "destructive" : "default"}
            asChild
            className="shrink-0"
          >
            <Link href="/student/billing">
              <CreditCard className="size-4" aria-hidden="true" />
              Pay Tuition
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      ) : null}

      {/* Header + Cumulative CGPA Badge */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <LayoutDashboard
              className="size-6 text-accent-brand"
              aria-hidden="true"
            />
            <span>Welcome, {student.firstName}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>
              {student.firstName} {student.lastName}
            </span>
            {student.studentProfile?.studentId ? (
              <Badge variant="outline" className="font-mono text-xs">
                {student.studentProfile.studentId}
              </Badge>
            ) : null}
            {student.studentProfile?.program ? (
              <Badge variant="secondary" className="text-xs">
                {student.studentProfile.program.code} ·{" "}
                {student.studentProfile.program.name}
              </Badge>
            ) : null}
            {activeSemester ? (
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300"
              >
                {activeSemester.name} · Active
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Cumulative CGPA Badge */}
        <Link
          href="/student/transcript"
          className="glass group flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-2.5 transition-colors hover:border-primary/40"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Award className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Cumulative CGPA
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tabular-nums text-foreground">
                {cgpa !== null ? cgpa.toFixed(2) : "—"}
              </span>
              <span className="text-xs text-muted-foreground">/ 4.00</span>
            </div>
          </div>
          <ArrowRight
            className="ml-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
            aria-hidden="true"
          />
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={
            activeSemester
              ? `${activeSemester.term} ${activeSemester.year} Courses`
              : "Enrolled Courses"
          }
          value={enrollments.length}
          subtitle={`${activeCredits} active credit${activeCredits === 1 ? "" : "s"}`}
          icon={BookOpen}
        />
        <StatCard
          title="Cumulative GPA"
          value={cgpa !== null ? cgpa.toFixed(2) : "—"}
          subtitle={
            gpaSummary?.graduationEligible
              ? "Graduation eligible"
              : "Based on published grades"
          }
          icon={GraduationCap}
        />
        <StatCard
          title="Credits Earned"
          value={
            requiredCredits > 0
              ? `${creditsEarned} / ${requiredCredits}`
              : creditsEarned
          }
          subtitle={
            gpaSummary
              ? `${normalizeDecimal(gpaSummary.creditsRemaining, 0)} remaining`
              : "Degree progress"
          }
          icon={ScrollText}
        />
        <StatCard
          title="Tuition Balance"
          value={formatCurrency(totalUnpaidAmount)}
          subtitle={
            unpaidInvoices.length > 0
              ? `${unpaidInvoices.length} unpaid invoice${unpaidInvoices.length > 1 ? "s" : ""}`
              : "All invoices settled"
          }
          icon={Receipt}
        />
      </div>

      {/* Enrolled Courses for Active Semester */}
      <section className="space-y-3" aria-labelledby="enrolled-courses-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2
              id="enrolled-courses-heading"
              className="text-lg font-semibold text-foreground"
            >
              {activeSemester
                ? `Enrolled Courses · ${activeSemester.name}`
                : "Enrolled Courses"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Your active course registrations, instructors, and classroom
              assignments.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/student/courses">Manage Courses</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/student/registration">Browse Catalog</Link>
            </Button>
          </div>
        </div>

        {enrollments.length === 0 ? (
          <EmptyState
            title={
              activeSemester
                ? `No enrolled courses for ${activeSemester.name}`
                : "No active course enrollments"
            }
            description="Register for course sections during the active registration window to build your semester schedule."
            action={
              <Button asChild>
                <Link href="/student/registration">Browse &amp; Register</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {enrollments.map((enrollment) => {
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
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
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
                      {section.instructor
                        ? `Instructor: ${section.instructor.user.firstName} ${section.instructor.user.lastName}`
                        : "Instructor: TBA"}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0" />
                        <span>
                          {section.room ? `Room ${section.room}` : "Room TBA"}
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

                    <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/student/attendance">
                          <UserCheck
                            className="size-3.5"
                            aria-hidden="true"
                          />
                          Attendance
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/student/results">
                          <GraduationCap
                            className="size-3.5"
                            aria-hidden="true"
                          />
                          Results
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Weekly Lecture Schedule */}
      <section className="space-y-3" aria-labelledby="weekly-schedule-heading">
        <div>
          <h2
            id="weekly-schedule-heading"
            className="flex items-center gap-2 text-lg font-semibold text-foreground"
          >
            <CalendarClock
              className="size-5 text-accent-brand"
              aria-hidden="true"
            />
            <span>Weekly Lecture Schedule</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Your weekly class timetable grouped by day of the week.
          </p>
        </div>

        {activeScheduleDays.length === 0 ? (
          <EmptyState
            title="No scheduled classes"
            description="Once you enroll in sections with assigned meeting times, your weekly timetable will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeScheduleDays.map((day) => {
              const items = scheduleByDay.get(day) ?? [];
              return (
                <Card key={day} className="glass rounded-2xl border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-sm font-semibold">
                      <span>{DAY_LABELS[day]}</span>
                      <Badge variant="outline" className="font-mono text-[11px]">
                        {items.length} class{items.length === 1 ? "" : "es"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {items.map((item) => (
                      <div
                        key={item.key}
                        className="rounded-xl border border-white/10 bg-background/40 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {item.courseCode} · Sec {item.sectionNumber}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                            <Clock className="size-3" aria-hidden="true" />
                            {item.startTime}–{item.endTime}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {item.courseTitle}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" aria-hidden="true" />
                            {item.room ? `Room ${item.room}` : "Room TBA"}
                          </span>
                          {item.instructorName ? (
                            <span>· {item.instructorName}</span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
