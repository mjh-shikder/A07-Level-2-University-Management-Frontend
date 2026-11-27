"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calculator,
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  Loader2,
  Lock,
  Save,
  Users,
} from "lucide-react";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
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
import { normalizeDecimal } from "@/lib/format";
import {
  bulkEnterMarksFormSchema,
  type Enrollment,
  type Exam,
  type ExamMark,
  type Result,
  type Section,
} from "@/types/api";

export interface SectionMarksClientProps {
  section: Section;
  exams: Exam[];
  enrollments: Enrollment[];
  initialResults: Result[];
}

export function SectionMarksClient({
  section,
  exams,
  enrollments,
  initialResults,
}: SectionMarksClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getParam, setParam } = useUrlState();

  const urlExamId = getParam("examId");
  const activeExam = useMemo(
    () => exams.find((e) => e.id === urlExamId) ?? exams[0] ?? null,
    [exams, urlExamId]
  );

  const marksQueryKey = [
    "instructor",
    "exams",
    activeExam?.id ?? "none",
    "marks",
  ] as const;

  /** Backend returns `{ exam: Exam, marks: ExamMark[] }` inside the envelope. */
  const marksQuery = useQuery<
    { exam: Exam; marks: ExamMark[] },
    ApiError
  >({
    queryKey: marksQueryKey,
    enabled: Boolean(activeExam),
    queryFn: () =>
      apiFetch<{ exam: Exam; marks: ExamMark[] }>(
        `/exams/${activeExam?.id}/marks`,
        { params: { limit: 100 } }
      ),
  });

  /** Unwrap the nested marks array from the API response. */
  const marks: ExamMark[] = marksQuery.data?.marks ?? [];

  const resultsQueryKey = [
    "instructor",
    "sections",
    section.id,
    "results",
  ] as const;

  const resultsQuery = useQuery<Result[], ApiError>({
    queryKey: resultsQueryKey,
    initialData: initialResults,
    queryFn: () =>
      apiFetch<Result[]>(`/sections/${section.id}/results`, {
        params: { limit: 100 },
      }),
  });

  const results = resultsQuery.data ?? initialResults;
  const isPublished = results.some((r) => r.status === "PUBLISHED");

  const [markInputs, setMarkInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    const byEnrollment = new Map<string, number>();
    for (const row of marks) {
      if (row.obtainedMarks !== null && row.obtainedMarks !== undefined) {
        byEnrollment.set(
          row.enrollmentId,
          normalizeDecimal(row.obtainedMarks, 0)
        );
      }
    }

    const next: Record<string, string> = {};
    for (const enrollment of enrollments) {
      const existing = byEnrollment.get(enrollment.id);
      next[enrollment.id] = existing !== undefined ? String(existing) : "";
    }
    setMarkInputs(next);
  }, [marks, enrollments]);

  const maxMarks = activeExam ? normalizeDecimal(activeExam.maxMarks, 100) : 100;

  const invalidEntries = useMemo(() => {
    const invalid = new Set<string>();
    for (const enrollment of enrollments) {
      const raw = markInputs[enrollment.id]?.trim() ?? "";
      if (!raw) continue;
      const num = Number(raw);
      if (Number.isNaN(num) || num < 0 || num > maxMarks) {
        invalid.add(enrollment.id);
      }
    }
    return invalid;
  }, [enrollments, markInputs, maxMarks]);

  const saveMarksMutation = useMutation<
    unknown,
    ApiError,
    Array<{ enrollmentId: string; obtainedMarks: number }>
  >({
    mutationFn: (marks) =>
      apiFetch(`/exams/${activeExam?.id}/marks`, {
        method: "POST",
        body: { marks },
      }),
    onSuccess: () => {
      toast.success(`Marks saved for "${activeExam?.title}".`);
      queryClient.invalidateQueries({ queryKey: marksQueryKey });
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Unable to save marks.");
    },
  });

  const computeResultsMutation = useMutation<
    { sectionId: string; computedCount: number; records: Result[] },
    ApiError,
    void
  >({
    mutationFn: () =>
      apiFetch(`/sections/${section.id}/results/compute`, {
        method: "POST",
      }),
    onSuccess: (res) => {
      toast.success(
        `Computed ${res.computedCount} draft grade(s) for ${section.course?.code}.`
      );
      queryClient.invalidateQueries({ queryKey: resultsQueryKey });
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Unable to compute draft results.");
    },
  });

  function handleSaveMarks() {
    if (!activeExam) return;
    if (invalidEntries.size > 0) {
      toast.error(`All marks must be between 0 and ${maxMarks}.`);
      return;
    }

    const marksPayload: Array<{ enrollmentId: string; obtainedMarks: number }> =
      [];
    for (const enrollment of enrollments) {
      const raw = markInputs[enrollment.id]?.trim() ?? "";
      if (!raw) continue;
      marksPayload.push({
        enrollmentId: enrollment.id,
        obtainedMarks: Number(raw),
      });
    }

    const parsed = bulkEnterMarksFormSchema.safeParse({ marks: marksPayload });
    if (!parsed.success) {
      toast.error(
        parsed.error.issues[0]?.message ??
          "Enter at least one student mark before saving."
      );
      return;
    }

    saveMarksMutation.mutate(parsed.data.marks);
  }

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
              <Link href={`/instructor/sections/${section.id}/attendance`}>
                <ClipboardCheck className="size-4" aria-hidden="true" />
                Attendance
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/instructor/sections/${section.id}/exams`}>
                <FileSpreadsheet className="size-4" aria-hidden="true" />
                Exams &amp; Weights
              </Link>
            </Button>
          </div>

          <h1 className="flex flex-wrap items-center gap-2 pt-1 text-2xl font-bold tracking-tight text-foreground">
            <GraduationCap
              className="size-6 text-accent-brand"
              aria-hidden="true"
            />
            <span>
              {section.course?.code ?? "Course"} · Sec {section.sectionNumber}{" "}
              Marks &amp; Gradebook
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {section.course?.title}
            {section.semester ? ` · ${section.semester.name}` : ""}
          </p>
        </div>

        <Button
          type="button"
          disabled={
            isPublished ||
            exams.length === 0 ||
            computeResultsMutation.isPending
          }
          onClick={() => computeResultsMutation.mutate()}
        >
          {computeResultsMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Computing…
            </>
          ) : (
            <>
              <Calculator className="size-4" aria-hidden="true" />
              Compute Draft Grades
            </>
          )}
        </Button>
      </div>

      {isPublished ? (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-600/30 bg-amber-500/15 p-4 text-xs text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <Lock className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" />
          <p>
            Official grades for this section are <strong>PUBLISHED</strong>.
            Marks are locked unless an administrator reverts results to DRAFT.
          </p>
        </div>
      ) : null}

      {/* Marks Entry Grid */}
      {exams.length === 0 ? (
        <EmptyState
          title="No exams defined yet"
          description="Create at least one exam in Exams & Weights before entering student marks."
          action={
            <Button asChild>
              <Link href={`/instructor/sections/${section.id}/exams`}>
                Configure Exams
              </Link>
            </Button>
          }
        />
      ) : (
        <Card className="glass rounded-2xl border-white/10">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Marks Entry Grid</CardTitle>
              <CardDescription>
                Select an exam and enter obtained marks (0 – {maxMarks}).
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={activeExam?.id ?? ""}
                onValueChange={(value) => setParam("examId", value)}
              >
                <SelectTrigger className="w-full sm:w-64" aria-label="Select exam">
                  <SelectValue placeholder="Select an exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.title} ({normalizeDecimal(exam.weightPercent, 0)}% ·
                      Max {normalizeDecimal(exam.maxMarks, 0)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                size="sm"
                disabled={
                  isPublished ||
                  enrollments.length === 0 ||
                  invalidEntries.size > 0 ||
                  saveMarksMutation.isPending
                }
                onClick={handleSaveMarks}
              >
                {saveMarksMutation.isPending ? (
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
                    Save Marks
                  </>
                )}
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {enrollments.length === 0 ? (
              <EmptyState
                title="No enrolled students"
                description="No active enrolled students found in this section."
                className="border-0 bg-transparent py-8"
              />
            ) : marksQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Student ID</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="w-44">
                      Obtained Marks (/{maxMarks})
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => {
                    const isInvalid = invalidEntries.has(enrollment.id);
                    return (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          {enrollment.student?.studentId ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-foreground">
                          {enrollment.student
                            ? `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`
                            : "Unknown Student"}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.5"
                            min={0}
                            max={maxMarks}
                            disabled={isPublished || saveMarksMutation.isPending}
                            value={markInputs[enrollment.id] ?? ""}
                            onChange={(e) =>
                              setMarkInputs((prev) => ({
                                ...prev,
                                [enrollment.id]: e.target.value,
                              }))
                            }
                            aria-invalid={isInvalid}
                            aria-label={`Marks for ${enrollment.student?.studentId ?? enrollment.id}`}
                            placeholder="0"
                            className="h-9 tabular-nums"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Draft / Computed Gradebook Preview */}
      <Card className="glass rounded-2xl border-white/10">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">
                Computed Section Results
              </CardTitle>
              <CardDescription>
                Draft grades remain editable until published by an administrator.
              </CardDescription>
            </div>
            {results.length > 0 ? (
              <StatusBadge status={isPublished ? "PUBLISHED" : "DRAFT"} />
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <EmptyState
              title="No computed results yet"
              description="Save exam marks and click Compute Draft Grades to generate weighted results."
              className="border-0 bg-transparent py-8"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Student ID</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Weighted %</TableHead>
                  <TableHead>Letter Grade</TableHead>
                  <TableHead>Grade Point</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      {result.enrollment?.student?.studentId ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      {result.enrollment?.student
                        ? `${result.enrollment.student.user.firstName} ${result.enrollment.student.user.lastName}`
                        : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {normalizeDecimal(result.totalWeightedPercent, 0).toFixed(
                        2
                      )}
                      %
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-semibold">
                        {result.letterGrade}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {normalizeDecimal(result.gradePoint, 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={result.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
