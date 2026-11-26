"use client";

import Link from "next/link";
import { Award, GraduationCap, Printer, ScrollText } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, normalizeDecimal } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StudentGPASummary } from "@/types/api";

export interface RawTranscriptCourse {
  courseId: string;
  courseCode?: string;
  code?: string;
  courseTitle?: string;
  title?: string;
  credits: number;
  totalWeightedPercent: number | string;
  letterGrade?: string;
  grade?: string;
  gradePoint: number | string;
  isRetake?: boolean;
  isLatestAttempt?: boolean;
  enrolledAt?: string;
}

export interface RawTranscriptSemester {
  semesterId?: string;
  semesterName?: string;
  year?: number;
  term?: string;
  semester?: {
    id: string;
    name: string;
    year: number;
    term: string;
  };
  sgpa: number | string;
  semesterCreditsAttempted?: number;
  semesterCreditsEarned?: number;
  totalCredits?: number;
  totalCreditsEarned?: number;
  courses: RawTranscriptCourse[];
}

export interface RawTranscriptResponse {
  student: {
    id: string;
    studentId: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
    program:
      | {
          id?: string;
          code?: string;
          name: string;
          requiredCredits?: number;
        }
      | string
      | null;
  };
  academicSummary?: {
    cgpa: number | string;
    totalCreditsAttempted: number;
    totalCreditsEarned: number;
    totalSemestersCompleted: number;
    creditsEarned: number;
    requiredCredits: number;
    creditsRemaining: number;
    graduationEligible: boolean;
  };
  cgpa?: number | string;
  totalCreditsAttempted?: number;
  totalCreditsEarned?: number;
  semesters: RawTranscriptSemester[];
}

export interface StudentTranscriptClientProps {
  transcript: RawTranscriptResponse;
  gpaSummary?: StudentGPASummary | null;
}

export function StudentTranscriptClient({
  transcript,
  gpaSummary,
}: StudentTranscriptClientProps) {
  const { student, semesters } = transcript;
  const summary = transcript.academicSummary;

  const fullName =
    student.name ??
    ([student.firstName, student.lastName].filter(Boolean).join(" ") ||
      "Student");

  const programLabel =
    typeof student.program === "string"
      ? student.program
      : student.program
        ? student.program.code
          ? `${student.program.code} · ${student.program.name}`
          : student.program.name
        : "Unassigned";

  const cgpa = normalizeDecimal(
    summary?.cgpa ?? transcript.cgpa ?? gpaSummary?.cgpa,
    0
  );
  const creditsEarned = normalizeDecimal(
    summary?.creditsEarned ??
      summary?.totalCreditsEarned ??
      transcript.totalCreditsEarned ??
      gpaSummary?.creditsEarned,
    0
  );
  const totalCreditsAttempted = normalizeDecimal(
    summary?.totalCreditsAttempted ?? transcript.totalCreditsAttempted,
    creditsEarned
  );
  const requiredCredits = normalizeDecimal(
    summary?.requiredCredits ??
      (typeof student.program === "object" && student.program
        ? student.program.requiredCredits
        : undefined) ??
      gpaSummary?.requiredCredits,
    0
  );
  const creditsRemaining = normalizeDecimal(
    summary?.creditsRemaining ??
      gpaSummary?.creditsRemaining ??
      (requiredCredits > 0 ? Math.max(0, requiredCredits - creditsEarned) : 0),
    0
  );
  const totalSemestersCompleted =
    summary?.totalSemestersCompleted ?? semesters.length;
  const graduationEligible =
    summary?.graduationEligible ?? gpaSummary?.graduationEligible ?? false;

  return (
    <div className="flex flex-col gap-6">
      {/* Screen Header & Print Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <ScrollText
              className="size-6 text-accent-brand"
              aria-hidden="true"
            />
            <span>Official Academic Transcript</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Cumulative academic record with semester SGPA breakdown and retake
            adjustments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/student/results">Published Results</Link>
          </Button>
          <Button type="button" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden="true" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Printable University Transcript Document */}
      <Card className="glass rounded-2xl border-white/10 print:border print:border-border print:bg-white print:text-black print:shadow-none">
        <CardHeader className="border-b border-white/10 pb-5 print:border-border">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent-brand print:text-black">
                <GraduationCap className="size-4" aria-hidden="true" />
                <span>UniManage University · Office of the Registrar</span>
              </div>
              <CardTitle className="text-xl">
                Official Academic Transcript
              </CardTitle>
              <CardDescription>
                Issued on {formatDate(new Date())}
              </CardDescription>
            </div>

            <div className="rounded-xl border border-white/10 bg-background/40 px-4 py-2.5 text-right print:border-border print:bg-transparent">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Cumulative GPA
              </p>
              <p className="flex items-center justify-end gap-1.5 text-2xl font-bold tabular-nums text-foreground print:text-black">
                <Award className="size-5 text-primary" aria-hidden="true" />
                {cgpa.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Student & Degree Summary */}
          <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-background/30 p-4 text-xs sm:grid-cols-2 lg:grid-cols-4 print:border-border print:bg-transparent">
            <div>
              <p className="text-muted-foreground">Student Name</p>
              <p className="mt-0.5 font-semibold text-foreground print:text-black">
                {fullName}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Student ID</p>
              <p className="mt-0.5 font-mono font-semibold text-foreground print:text-black">
                {student.studentId}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Academic Program</p>
              <p className="mt-0.5 font-semibold text-foreground print:text-black">
                {programLabel}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Degree Credits</p>
              <p className="mt-0.5 font-semibold tabular-nums text-foreground print:text-black">
                {requiredCredits > 0
                  ? `${creditsEarned} / ${requiredCredits} earned (${creditsRemaining} remaining)`
                  : `${creditsEarned} credits earned`}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Graduation Eligibility Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">
              Semesters Completed: {totalSemestersCompleted} · Total Attempted
              Credits: {totalCreditsAttempted}
            </span>
            <Badge
              variant="outline"
              className={cn(
                graduationEligible
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-white/15 text-muted-foreground"
              )}
            >
              {graduationEligible
                ? "Graduation Eligible"
                : "Degree In Progress"}
            </Badge>
          </div>

          {semesters.length === 0 ? (
            <EmptyState
              title="No completed academic semesters yet"
              description="Published semester grades will appear chronologically on your official transcript."
              className="border-0 bg-transparent py-8"
            />
          ) : (
            <div className="space-y-6">
              {semesters.map((semesterItem) => {
                const semId =
                  semesterItem.semester?.id ??
                  semesterItem.semesterId ??
                  "semester";
                const semName =
                  semesterItem.semester?.name ??
                  semesterItem.semesterName ??
                  "Semester";
                const semTerm =
                  semesterItem.semester?.term ?? semesterItem.term ?? "";
                const semYear =
                  semesterItem.semester?.year ?? semesterItem.year ?? "";
                const semEarned =
                  semesterItem.totalCreditsEarned ??
                  semesterItem.semesterCreditsEarned ??
                  0;
                const semAttempted =
                  semesterItem.totalCredits ??
                  semesterItem.semesterCreditsAttempted ??
                  semEarned;

                return (
                  <div
                    key={semId}
                    className="overflow-hidden rounded-xl border border-white/10 print:border-border"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-background/40 px-4 py-3 print:border-border print:bg-muted/30">
                      <div>
                        <h2 className="text-sm font-semibold text-foreground print:text-black">
                          {semName}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {semTerm} {semYear} · Credits Earned: {semEarned} /{" "}
                          {semAttempted}
                        </p>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        SGPA: {normalizeDecimal(semesterItem.sgpa, 0).toFixed(2)}
                      </Badge>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Code</TableHead>
                          <TableHead>Course Title</TableHead>
                          <TableHead>Credits</TableHead>
                          <TableHead>Weighted %</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Grade Point</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {semesterItem.courses.map((course) => {
                          const code = course.code ?? course.courseCode ?? "—";
                          const title =
                            course.title ?? course.courseTitle ?? "—";
                          const grade =
                            course.grade ?? course.letterGrade ?? "—";
                          const isLatest = course.isLatestAttempt ?? true;

                          return (
                            <TableRow
                              key={`${semId}-${course.courseId}-${course.enrolledAt ?? code}`}
                            >
                              <TableCell className="font-mono text-xs font-semibold text-foreground print:text-black">
                                {code}
                              </TableCell>
                              <TableCell className="text-xs font-medium text-foreground print:text-black">
                                {title}
                              </TableCell>
                              <TableCell className="tabular-nums text-xs">
                                {course.credits}
                              </TableCell>
                              <TableCell className="tabular-nums text-xs">
                                {normalizeDecimal(
                                  course.totalWeightedPercent,
                                  0
                                ).toFixed(2)}
                                %
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="font-semibold"
                                >
                                  {grade}
                                </Badge>
                              </TableCell>
                              <TableCell className="tabular-nums text-xs font-semibold">
                                {normalizeDecimal(course.gradePoint, 0).toFixed(
                                  2
                                )}
                              </TableCell>
                              <TableCell className="text-xs">
                                {!isLatest ? (
                                  <Badge
                                    variant="secondary"
                                    className="text-[11px]"
                                  >
                                    Superseded
                                  </Badge>
                                ) : course.isRetake ? (
                                  <Badge
                                    variant="outline"
                                    className="text-[11px]"
                                  >
                                    Retake
                                  </Badge>
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </div>
          )}

          <p className="border-t border-white/10 pt-4 text-[11px] text-muted-foreground print:border-border">
            Note: Repeated courses marked &ldquo;Superseded&rdquo; are excluded
            from cumulative GPA in favor of the latest attempt marked
            &ldquo;Retake&rdquo;.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
