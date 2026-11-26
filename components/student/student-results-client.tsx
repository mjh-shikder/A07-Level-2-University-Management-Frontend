"use client";

import Link from "next/link";
import { BarChart3, ChevronLeft, ChevronRight, ScrollText } from "lucide-react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUrlState } from "@/hooks/use-url-state";
import { formatDate, normalizeDecimal } from "@/lib/format";
import type { Result, Section, Semester, TPaginationMeta } from "@/types/api";

export type StudentResultItem = Result & {
  enrollment?: Result["enrollment"] & {
    section?: Section;
  };
};

export interface StudentResultsClientProps {
  results: StudentResultItem[];
  meta: TPaginationMeta;
  semesters: Semester[];
}

export function StudentResultsClient({
  results,
  meta,
  semesters,
}: StudentResultsClientProps) {
  const { page, getParam, setParam, setPage } = useUrlState({
    defaultLimit: 20,
  });
  const semesterFilter = getParam("semesterId", "all");

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <BarChart3
              className="size-6 text-accent-brand"
              aria-hidden="true"
            />
            <span>Published Results</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Official published letter grades and grade points per semester.
          </p>
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link href="/student/transcript">
            <ScrollText className="size-4" aria-hidden="true" />
            Official Transcript
          </Link>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 p-4">
        <Select
          value={semesterFilter}
          onValueChange={(value) =>
            setParam("semesterId", value === "all" ? null : value)
          }
        >
          <SelectTrigger
            className="w-full sm:w-72"
            aria-label="Filter results by semester"
          >
            <SelectValue placeholder="All Semesters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {semesters.map((semester) => (
              <SelectItem key={semester.id} value={semester.id}>
                {semester.name} ({semester.status})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-xs text-muted-foreground">
          Showing {results.length} of {meta.total} published result
          {meta.total === 1 ? "" : "s"}
        </span>
      </div>

      {/* Results Table */}
      <Card className="glass rounded-2xl border-white/10">
        <CardHeader>
          <CardTitle className="text-base">Course Gradebook</CardTitle>
          <CardDescription>
            Only official results published by an administrator are displayed
            here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <EmptyState
              title="No published results yet"
              description={
                semesterFilter !== "all"
                  ? "No published grades were found for the selected semester."
                  : "Your course grades will appear here once finalized and published."
              }
              className="border-0 bg-transparent py-8"
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Course</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Weighted %</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Grade Point</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => {
                    const section = result.enrollment?.section;
                    const course = section?.course;
                    return (
                      <TableRow key={result.id}>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="font-mono text-xs font-semibold text-foreground">
                              {course?.code ?? "Course"}
                              {section?.sectionNumber
                                ? ` · Sec ${section.sectionNumber}`
                                : ""}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {course?.title ?? "—"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {section?.semester?.name ?? "—"}
                        </TableCell>
                        <TableCell className="tabular-nums text-xs">
                          {course?.credits ?? "—"}
                        </TableCell>
                        <TableCell className="tabular-nums text-xs font-medium">
                          {normalizeDecimal(
                            result.totalWeightedPercent,
                            0
                          ).toFixed(2)}
                          %
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-semibold">
                            {result.letterGrade}
                          </Badge>
                        </TableCell>
                        <TableCell className="tabular-nums text-xs font-semibold">
                          {normalizeDecimal(result.gradePoint, 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(result.publishedAt)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={result.status} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {meta.totalPages > 1 ? (
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-muted-foreground">
                  <span>
                    Page {meta.page} of {meta.totalPages}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
