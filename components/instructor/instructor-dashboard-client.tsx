"use client";

import Link from "next/link";
import {
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  Clock,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Users,
  X,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
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
import { useUrlState } from "@/hooks/use-url-state";
import { DayOfWeekEnum, type DayOfWeek, type Section, type Semester, type UserSummary } from "@/types/api";

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

export interface InstructorDashboardClientProps {
  instructor: UserSummary;
  sections: Section[];
  semesters: Semester[];
}

export function InstructorDashboardClient({
  instructor,
  sections,
  semesters,
}: InstructorDashboardClientProps) {
  const { q, getParam, setParam, setSearch, resetParams } = useUrlState({
    defaultLimit: 50,
  });

  const semesterFilter = getParam("semesterId", "all");
  const hasFilters = Boolean(q || (semesterFilter && semesterFilter !== "all"));

  const totalStudents = sections.reduce(
    (sum, sec) => sum + (sec.enrolledCount ?? 0),
    0
  );
  const totalWeeklySlots = sections.reduce(
    (sum, sec) => sum + sec.schedule.length,
    0
  );

  // Build weekly timetable grouped by day of week
  const scheduleByDay = new Map<
    DayOfWeek,
    Array<{
      key: string;
      sectionId: string;
      courseCode: string;
      courseTitle: string;
      sectionNumber: string;
      startTime: string;
      endTime: string;
      room?: string | null;
    }>
  >();

  for (const day of ORDERED_DAYS) {
    scheduleByDay.set(day, []);
  }

  for (const section of sections) {
    const slotCounts = new Map<string, number>();
    for (const slot of section.schedule) {
      const base = `${slot.day}-${slot.startTime}-${slot.endTime}`;
      const occ = (slotCounts.get(base) ?? 0) + 1;
      slotCounts.set(base, occ);
      const bucket = scheduleByDay.get(slot.day);
      if (bucket) {
        bucket.push({
          key: `${section.id}-${base}-${occ}`,
          sectionId: section.id,
          courseCode: section.course?.code ?? "COURSE",
          courseTitle: section.course?.title ?? "Assigned Section",
          sectionNumber: section.sectionNumber,
          startTime: slot.startTime,
          endTime: slot.endTime,
          room: section.room,
        });
      }
    }
  }

  for (const day of ORDERED_DAYS) {
    const items = scheduleByDay.get(day);
    if (items) {
      items.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
  }

  const activeDays = ORDERED_DAYS.filter(
    (day) => (scheduleByDay.get(day)?.length ?? 0) > 0
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header + Faculty Badge */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <LayoutDashboard
              className="size-6 text-accent-brand"
              aria-hidden="true"
            />
            Instructor Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back, {instructor.firstName} {instructor.lastName}. Manage
            your assigned sections, attendance, and grading.
          </p>
        </div>

        {instructor.instructorProfile ? (
          <div className="glass flex items-center gap-2.5 self-start rounded-2xl border-white/10 px-4 py-2 text-xs sm:self-auto">
            <span className="font-semibold text-foreground">
              {instructor.instructorProfile.employeeId}
            </span>
            {instructor.instructorProfile.department ? (
              <Badge variant="outline">
                {instructor.instructorProfile.department.code}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Assigned Sections"
          value={sections.length}
          subtitle="Active & historical course offerings"
          icon={BookOpen}
        />
        <StatCard
          title="Enrolled Students"
          value={totalStudents}
          subtitle="Total seats occupied across sections"
          icon={Users}
        />
        <StatCard
          title="Weekly Sessions"
          value={totalWeeklySlots}
          subtitle="Scheduled lecture & lab slots"
          icon={CalendarClock}
        />
      </div>

      {/* Filter Bar */}
      <div className="glass flex flex-col gap-3 rounded-2xl border-white/10 p-4 sm:flex-row sm:items-center">
        <SearchInput
          value={q}
          onValueChange={setSearch}
          placeholder="Search assigned sections by course code, title, or room..."
          ariaLabel="Search assigned sections"
        />

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={semesterFilter}
            onValueChange={(value) =>
              setParam("semesterId", value === "all" ? null : value)
            }
          >
            <SelectTrigger
              className="w-full sm:w-52"
              aria-label="Filter by semester"
            >
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

          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => resetParams(["q", "semesterId"])}
            >
              <X className="size-4" aria-hidden="true" />
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      {/* Assigned Course Sections Grid */}
      {sections.length === 0 ? (
        <EmptyState
          title="No assigned sections found"
          description={
            hasFilters
              ? "Try clearing your search or semester filter."
              : "You have not been assigned to any course sections yet."
          }
          action={
            hasFilters ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => resetParams(["q", "semesterId"])}
              >
                Reset filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => {
            const fillPct =
              section.capacity > 0
                ? Math.min(
                    100,
                    Math.round((section.enrolledCount / section.capacity) * 100)
                  )
                : 0;
            const slotCounts = new Map<string, number>();

            return (
              <Card
                key={section.id}
                className="glass flex flex-col justify-between rounded-2xl border-white/10"
              >
                <CardHeader className="space-y-2 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        status="ACTIVE"
                        label={section.course?.code ?? "COURSE"}
                      />
                      <Badge variant="outline">
                        Sec {section.sectionNumber}
                      </Badge>
                    </div>
                    {section.semester ? (
                      <StatusBadge
                        status={section.semester.status}
                        label={section.semester.name}
                      />
                    ) : null}
                  </div>

                  <div>
                    <CardTitle className="line-clamp-1 text-base">
                      {section.course?.title ?? "Untitled Course"}
                    </CardTitle>
                    <CardDescription className="mt-0.5 text-xs">
                      {section.course?.credits ?? 0} Credits
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <div className="space-y-3">
                    {/* Room & Capacity */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-3.5" aria-hidden="true" />
                        {section.room || "Room TBA"}
                      </span>
                      <span className="font-medium text-foreground tabular-nums">
                        {section.enrolledCount} / {section.capacity} seats
                      </span>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>

                    {/* Schedule slots */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {section.schedule.length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          No schedule slots configured
                        </span>
                      ) : (
                        section.schedule.map((slot) => {
                          const base = `${slot.day}-${slot.startTime}-${slot.endTime}`;
                          const occ = (slotCounts.get(base) ?? 0) + 1;
                          slotCounts.set(base, occ);
                          return (
                            <Badge
                              key={`${section.id}-${base}-${occ}`}
                              variant="secondary"
                              className="gap-1 text-[11px]"
                            >
                              <Clock className="size-3" aria-hidden="true" />
                              {slot.day} {slot.startTime}–{slot.endTime}
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/instructor/sections/${section.id}/students`}>
                        <Users className="size-3.5" aria-hidden="true" />
                        Roster
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/instructor/sections/${section.id}/attendance`}
                      >
                        <ClipboardCheck
                          className="size-3.5"
                          aria-hidden="true"
                        />
                        Attendance
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/instructor/sections/${section.id}/exams`}>
                        <FileSpreadsheet
                          className="size-3.5"
                          aria-hidden="true"
                        />
                        Exams
                      </Link>
                    </Button>
                    <Button variant="default" size="sm" asChild>
                      <Link href={`/instructor/sections/${section.id}/results`}>
                        <GraduationCap
                          className="size-3.5"
                          aria-hidden="true"
                        />
                        Gradebook
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Weekly Teaching Schedule */}
      {activeDays.length > 0 ? (
        <Card className="glass rounded-2xl border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock
                className="size-4 text-primary"
                aria-hidden="true"
              />
              Weekly Teaching Schedule
            </CardTitle>
            <CardDescription>
              Your lecture and lab times organized by day of the week.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeDays.map((day) => {
              const slots = scheduleByDay.get(day) ?? [];
              return (
                <div
                  key={day}
                  className="rounded-xl border border-border/70 bg-secondary/25 p-3.5 space-y-2.5"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {DAY_LABELS[day]}
                  </p>
                  <div className="space-y-2">
                    {slots.map((item) => (
                      <Link
                        key={item.key}
                        href={`/instructor/sections/${item.sectionId}/attendance`}
                        className="block rounded-lg border border-border/50 bg-background/40 p-2.5 transition-colors hover:border-primary/40"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-foreground">
                            {item.courseCode} · Sec {item.sectionNumber}
                          </span>
                          <span className="text-muted-foreground tabular-nums">
                            {item.startTime}–{item.endTime}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {item.room || "Room TBA"}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
