"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Loader2,
  MapPin,
  PlusCircle,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
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
import { useUrlState } from "@/hooks/use-url-state";
import { apiFetch } from "@/lib/api";
import type { ApiError } from "@/lib/api-error";
import { formatDate, normalizeDecimal } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  Enrollment,
  Section,
  Semester,
  TPaginationMeta,
} from "@/types/api";

const MAX_CREDITS_PER_SEMESTER = 18;

export interface StudentRegistrationClientProps {
  activeSemester: Semester | null;
  sections: Section[];
  meta: TPaginationMeta;
  activeEnrollments: Enrollment[];
  hasUnpaidInvoices: boolean;
}

export function StudentRegistrationClient({
  activeSemester,
  sections,
  meta,
  activeEnrollments,
  hasUnpaidInvoices,
}: StudentRegistrationClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { q, page, setSearch, setPage, resetParams } = useUrlState({
    defaultLimit: 12,
  });

  const [enrollingSectionId, setEnrollingSectionId] = useState<string | null>(
    null
  );
  const [ruleError, setRuleError] = useState<string | null>(null);

  const currentCredits = activeEnrollments.reduce(
    (sum, enrollment) =>
      sum + normalizeDecimal(enrollment.section.course?.credits, 0),
    0
  );
  const creditPercent = Math.min(
    100,
    (currentCredits / MAX_CREDITS_PER_SEMESTER) * 100
  );

  const enrolledSectionIds = new Set(
    activeEnrollments.map((enrollment) => enrollment.sectionId)
  );
  const enrolledCourseIds = new Set(
    activeEnrollments.map((enrollment) => enrollment.section.courseId)
  );

  const now = Date.now();
  const regStartMs = activeSemester?.registrationStart
    ? Date.parse(activeSemester.registrationStart)
    : null;
  const regEndMs = activeSemester?.registrationEnd
    ? Date.parse(activeSemester.registrationEnd)
    : null;
  const windowNotOpen =
    regStartMs !== null && !Number.isNaN(regStartMs) && now < regStartMs;
  const windowClosed =
    regEndMs !== null && !Number.isNaN(regEndMs) && now > regEndMs;
  const isWindowOpen = Boolean(activeSemester) && !windowNotOpen && !windowClosed;

  const enrollMutation = useMutation<Enrollment, ApiError, string>({
    mutationFn: (sectionId) =>
      apiFetch<Enrollment>("/enrollments", {
        method: "POST",
        body: { sectionId },
      }),
    onMutate: (sectionId) => {
      setEnrollingSectionId(sectionId);
      setRuleError(null);
    },
    onSuccess: (enrollment) => {
      const code = enrollment.section?.course?.code ?? "course";
      toast.success(`Successfully enrolled in ${code}.`);
      queryClient.invalidateQueries({ queryKey: ["student"] });
      router.refresh();
    },
    onError: (error) => {
      const msg = error.message || "Unable to complete enrollment.";
      setRuleError(msg);
      toast.error(msg);
    },
    onSettled: () => {
      setEnrollingSectionId(null);
    },
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <BookOpen className="size-6 text-accent-brand" aria-hidden="true" />
            <span>Course Registration</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse open course sections for the active semester and enroll
            within your credit limit.
          </p>
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link href="/student/courses">View My Enrolled Courses</Link>
        </Button>
      </div>

      {/* Unpaid Invoice Block Warning */}
      {hasUnpaidInvoices ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-amber-600/35 bg-amber-500/15 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/40 dark:bg-amber-500/10"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400"
              aria-hidden="true"
            />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">
                Outstanding Tuition Invoice Detected
              </p>
              <p className="text-xs text-muted-foreground">
                Pending or overdue invoices may block new course enrollments
                until paid.
              </p>
            </div>
          </div>
          <Button size="sm" asChild className="shrink-0">
            <Link href="/student/billing">
              <CreditCard className="size-4" aria-hidden="true" />
              Go to Billing
            </Link>
          </Button>
        </div>
      ) : null}

      {/* Active Semester & Credit Gauge */}
      {activeSemester ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="glass rounded-2xl border-white/10">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarClock
                    className="size-4 text-accent-brand"
                    aria-hidden="true"
                  />
                  <span>{activeSemester.name}</span>
                </CardTitle>
                <StatusBadge status={activeSemester.status} />
              </div>
              <CardDescription className="text-xs">
                {activeSemester.registrationStart ||
                activeSemester.registrationEnd
                  ? `Registration window: ${formatDate(activeSemester.registrationStart)} – ${formatDate(activeSemester.registrationEnd)}`
                  : "Registration window open for active semester"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "text-xs font-medium",
                  isWindowOpen
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-amber-800 dark:text-amber-300"
                )}
              >
                {windowNotOpen
                  ? "Registration has not opened yet."
                  : windowClosed
                    ? "Registration window has closed."
                    : "Registration window is currently open."}
              </p>
            </CardContent>
          </Card>

          <Card className="glass rounded-2xl border-white/10">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">
                  Semester Credit Limit
                </CardTitle>
                <Badge variant="outline" className="font-mono text-xs">
                  {currentCredits} / {MAX_CREDITS_PER_SEMESTER} Credits
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Maximum {MAX_CREDITS_PER_SEMESTER} credits allowed per semester.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    currentCredits >= MAX_CREDITS_PER_SEMESTER
                      ? "bg-amber-500"
                      : "bg-primary"
                  )}
                  style={{ width: `${creditPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.max(0, MAX_CREDITS_PER_SEMESTER - currentCredits)} credit
                {MAX_CREDITS_PER_SEMESTER - currentCredits === 1 ? "" : "s"}{" "}
                remaining available.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <EmptyState
          title="No active semester"
          description="Course registration is only available when an academic semester is marked ACTIVE."
        />
      )}

      {/* Business Rule Error Banner */}
      {ruleError ? (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive dark:text-red-300"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle
              className="mt-0.5 size-4 shrink-0 text-destructive"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold text-foreground">
                Enrollment Blocked by Academic Rule
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {ruleError}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={() => setRuleError(null)}
            aria-label="Dismiss error"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : null}

      {/* Search Toolbar */}
      {activeSemester ? (
        <div className="glass flex flex-col gap-3 rounded-2xl border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={q}
            onValueChange={setSearch}
            placeholder="Search by course code, title, room, or section..."
            className="w-full sm:max-w-md"
          />
          {q ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => resetParams()}
            >
              <X className="size-4" aria-hidden="true" />
              Clear Search
            </Button>
          ) : null}
        </div>
      ) : null}

      {/* Available Sections Grid */}
      {activeSemester ? (
        sections.length === 0 ? (
          <EmptyState
            title="No matching course sections"
            description={
              q
                ? "Try adjusting your search query to see other available sections."
                : "No course sections have been scheduled for this semester yet."
            }
            action={
              q ? (
                <Button variant="outline" onClick={() => resetParams()}>
                  Reset Search
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sections.map((section) => {
                const isEnrolledInSection = enrolledSectionIds.has(section.id);
                const isEnrolledInCourse = enrolledCourseIds.has(
                  section.courseId
                );
                const isFull = section.enrolledCount >= section.capacity;
                const seatsPercent =
                  section.capacity > 0
                    ? Math.min(
                        100,
                        (section.enrolledCount / section.capacity) * 100
                      )
                    : 100;
                const isThisEnrolling =
                  enrollMutation.isPending &&
                  enrollingSectionId === section.id;

                const slotCounts = new Map<string, number>();

                const disabled =
                  !isWindowOpen ||
                  isEnrolledInSection ||
                  isEnrolledInCourse ||
                  isFull ||
                  enrollMutation.isPending;

                return (
                  <Card
                    key={section.id}
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

                        {isEnrolledInSection ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2
                              className="mr-1 size-3"
                              aria-hidden="true"
                            />
                            Enrolled
                          </Badge>
                        ) : isFull ? (
                          <Badge variant="destructive">Full</Badge>
                        ) : null}
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
                                  key={`${section.id}-${base}-${occ}`}
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

                      {/* Capacity Indicator */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="size-3.5" aria-hidden="true" />
                            Seats Filled
                          </span>
                          <span className="font-mono font-semibold text-foreground">
                            {section.enrolledCount} / {section.capacity}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              isFull
                                ? "bg-destructive"
                                : seatsPercent >= 80
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            )}
                            style={{ width: `${seatsPercent}%` }}
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        className="w-full"
                        disabled={disabled}
                        onClick={() => enrollMutation.mutate(section.id)}
                      >
                        {isThisEnrolling ? (
                          <>
                            <Loader2
                              className="size-4 animate-spin"
                              aria-hidden="true"
                            />
                            Enrolling…
                          </>
                        ) : isEnrolledInSection ? (
                          "Already Enrolled"
                        ) : isEnrolledInCourse ? (
                          "Enrolled in Another Section"
                        ) : isFull ? (
                          "Section Full"
                        ) : !isWindowOpen ? (
                          "Registration Closed"
                        ) : (
                          <>
                            <PlusCircle
                              className="size-4"
                              aria-hidden="true"
                            />
                            Enroll in Section
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-muted-foreground">
                <span>
                  Page {meta.page} of {meta.totalPages} ({meta.total} sections)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )
      ) : null}
    </div>
  );
}
