"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Award,
  Calculator,
  CheckCircle2,
  Loader2,
  RotateCcw,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import type { ApiError } from "@/lib/api-error";
import { formatDate, normalizeDecimal } from "@/lib/format";
import type { Result, Section } from "@/types/api";

export interface AdminSectionResultsClientProps {
  section: Section;
  initialResults: Result[];
}

export function AdminSectionResultsClient({
  section,
  initialResults,
}: AdminSectionResultsClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [confirmAction, setConfirmAction] = useState<
    "publish" | "unpublish" | null
  >(null);

  const resultsQueryKey = [
    "admin",
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
  const draftCount = results.filter((r) => r.status === "DRAFT").length;
  const publishedCount = results.filter((r) => r.status === "PUBLISHED").length;
  const isPublished = publishedCount > 0;
  const publishedRecord = results.find((r) => r.status === "PUBLISHED");

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: resultsQueryKey });
    queryClient.invalidateQueries({ queryKey: ["admin", "sections"] });
    queryClient.invalidateQueries({
      queryKey: ["instructor", "sections", section.id, "results"],
    });
    router.refresh();
  };

  const computeMutation = useMutation<
    { computedCount: number },
    ApiError,
    void
  >({
    mutationFn: () =>
      apiFetch<{ computedCount: number }>(
        `/sections/${section.id}/results/compute`,
        {
          method: "POST",
        }
      ),
    onSuccess: (data) => {
      toast.success(
        `Computed draft results for ${data.computedCount} student(s).`
      );
      invalidateAll();
    },
    onError: (error) => {
      toast.error(error.message || "Unable to compute draft results.");
    },
  });

  const publishMutation = useMutation<
    { sectionId: string; publishedCount: number; publishedAt: string },
    ApiError,
    void
  >({
    mutationFn: () =>
      apiFetch<{
        sectionId: string;
        publishedCount: number;
        publishedAt: string;
      }>(`/sections/${section.id}/results/publish`, {
        method: "PATCH",
      }),
    onSuccess: (data) => {
      toast.success(
        `Published ${data.publishedCount} result(s) to official student records.`
      );
      setConfirmAction(null);
      invalidateAll();
    },
    onError: (error) => {
      toast.error(error.message || "Unable to publish section results.");
    },
  });

  const unpublishMutation = useMutation<
    { sectionId: string; unpublishedCount: number },
    ApiError,
    void
  >({
    mutationFn: () =>
      apiFetch<{ sectionId: string; unpublishedCount: number }>(
        `/sections/${section.id}/results/unpublish`,
        {
          method: "PATCH",
        }
      ),
    onSuccess: (data) => {
      toast.success(
        `Reverted ${data.unpublishedCount} result(s) back to DRAFT.`
      );
      setConfirmAction(null);
      invalidateAll();
    },
    onError: (error) => {
      toast.error(error.message || "Unable to unpublish section results.");
    },
  });

  const instructorName = section.instructor?.user
    ? `${section.instructor.user.firstName} ${section.instructor.user.lastName}`
    : "Unassigned";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/sections">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Sections
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          {!isPublished ? (
            <Button
              type="button"
              variant="outline"
              disabled={computeMutation.isPending}
              onClick={() => computeMutation.mutate()}
            >
              {computeMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Calculator className="size-4" aria-hidden="true" />
              )}
              <span>Compute Draft Results</span>
            </Button>
          ) : null}

          {results.length > 0 && !isPublished ? (
            <Button
              type="button"
              disabled={publishMutation.isPending}
              onClick={() => setConfirmAction("publish")}
            >
              <CheckCircle2 className="size-4" aria-hidden="true" />
              <span>Publish Results</span>
            </Button>
          ) : null}

          {isPublished ? (
            <Button
              type="button"
              variant="destructive"
              disabled={unpublishMutation.isPending}
              onClick={() => setConfirmAction("unpublish")}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              <span>Unpublish to Draft</span>
            </Button>
          ) : null}
        </div>
      </div>

      {/* Section Summary Card */}
      <Card className="glass rounded-2xl border-white/10">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {section.course?.code ?? "Course"} — Sec {section.sectionNumber}
              </Badge>
              {section.semester ? (
                <Badge variant="secondary">{section.semester.name}</Badge>
              ) : null}
              {results.length > 0 ? (
                <StatusBadge status={isPublished ? "PUBLISHED" : "DRAFT"} />
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  No Results Yet
                </Badge>
              )}
            </div>
            <CardTitle className="mt-2 flex items-center gap-2 text-xl">
              <Award className="size-5 text-primary" aria-hidden="true" />
              {section.course?.title ?? "Section Results"}
            </CardTitle>
            <CardDescription className="mt-1">
              Instructor: {instructorName}
              {publishedRecord?.publishedAt
                ? ` • Published on ${formatDate(publishedRecord.publishedAt)}`
                : ""}
              {publishedRecord?.publisher
                ? ` by ${publishedRecord.publisher.firstName} ${publishedRecord.publisher.lastName}`
                : ""}
            </CardDescription>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="rounded-xl border border-border/70 bg-secondary/30 px-3.5 py-2 text-center">
              <p className="text-xs text-muted-foreground">Draft</p>
              <p className="font-semibold tabular-nums">{draftCount}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-secondary/30 px-3.5 py-2 text-center">
              <p className="text-xs text-muted-foreground">Published</p>
              <p className="font-semibold tabular-nums">{publishedCount}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Results Table */}
      <Card className="glass rounded-2xl border-white/10">
        <CardHeader>
          <CardTitle className="text-base">Section Grade Sheet</CardTitle>
          <CardDescription>
            Publishing locks exam marks from instructor edits, marks enrollments
            as completed, and makes grades visible on student transcripts.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {results.length === 0 ? (
            <EmptyState
              title="No computed results yet"
              description="An instructor (or admin) must compute draft results after exam marks are entered before they can be published."
              action={
                <Button
                  type="button"
                  variant="outline"
                  disabled={computeMutation.isPending}
                  onClick={() => computeMutation.mutate()}
                >
                  {computeMutation.isPending ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Calculator className="size-4" aria-hidden="true" />
                  )}
                  <span>Compute Draft Results</span>
                </Button>
              }
              className="border-0 bg-transparent py-8"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Student ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Weighted %</TableHead>
                  <TableHead>Letter Grade</TableHead>
                  <TableHead>Grade Point</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => {
                  const student = result.enrollment?.student;
                  return (
                    <TableRow key={result.id}>
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {student?.studentId ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {student
                              ? `${student.user.firstName} ${student.user.lastName}`
                              : "—"}
                          </span>
                          {student?.user.email ? (
                            <span className="text-xs text-muted-foreground">
                              {student.user.email}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {normalizeDecimal(result.totalWeightedPercent, 0).toFixed(
                          2
                        )}
                        %
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{result.letterGrade}</Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {normalizeDecimal(result.gradePoint, 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={result.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmAction === "publish"}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        title="Publish section results"
        description={`Publish ${draftCount} draft result(s) for ${section.course?.code ?? "this section"} (Section ${section.sectionNumber})? This will lock exam marks, mark enrollments as COMPLETED, and release official grades to students.`}
        confirmLabel="Publish Results"
        isLoading={publishMutation.isPending}
        onConfirm={() => publishMutation.mutate()}
      />

      <ConfirmDialog
        open={confirmAction === "unpublish"}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        title="Unpublish section results"
        description={`Revert ${publishedCount} published result(s) back to DRAFT for ${section.course?.code ?? "this section"} (Section ${section.sectionNumber})? This will unlock exam marks for instructor corrections and revert enrollments to ENROLLED.`}
        confirmLabel="Unpublish to Draft"
        variant="destructive"
        isLoading={unpublishMutation.isPending}
        onConfirm={() => unpublishMutation.mutate()}
      />
    </div>
  );
}
