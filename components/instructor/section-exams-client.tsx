"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { ExamFormDialog } from "@/components/instructor/exam-form-dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";
import type { Exam, Section } from "@/types/api";

export interface SectionExamsClientProps {
  section: Section;
  exams: Exam[];
  isPublished: boolean;
}

export function SectionExamsClient({
  section,
  exams,
  isPublished,
}: SectionExamsClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);

  const totalWeight = exams.reduce(
    (sum, exam) => sum + normalizeDecimal(exam.weightPercent, 0),
    0
  );
  const remainingWeight = Math.max(0, 100 - totalWeight);
  const isComplete = Math.abs(totalWeight - 100) < 0.01;

  const deleteMutation = useMutation<null, ApiError, string>({
    mutationFn: (id) =>
      apiFetch<null>(`/exams/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Exam deleted.");
      setDeletingExam(null);
      queryClient.invalidateQueries({
        queryKey: ["instructor", "sections", section.id, "exams"],
      });
      router.refresh();
    },
    onError: (error) => {
      setDeletingExam(null);
      toast.error(error.message || "Unable to delete exam.");
    },
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
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
              <Link href={`/instructor/sections/${section.id}/marks`}>
                <GraduationCap className="size-4" aria-hidden="true" />
                Marks &amp; Grades
              </Link>
            </Button>
          </div>

          <h1 className="flex flex-wrap items-center gap-2 pt-1 text-2xl font-bold tracking-tight text-foreground">
            <FileSpreadsheet
              className="size-6 text-accent-brand"
              aria-hidden="true"
            />
            <span>
              {section.course?.code ?? "Course"} · Sec {section.sectionNumber}{" "}
              Exams &amp; Weights
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {section.course?.title}
            {section.semester ? ` · ${section.semester.name}` : ""}
          </p>
        </div>

        <Button
          type="button"
          disabled={isPublished || totalWeight >= 100}
          onClick={() => {
            setEditingExam(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add Exam
        </Button>
      </div>

      {isPublished ? (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-600/30 bg-amber-500/15 p-4 text-xs text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <Lock className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" />
          <p>
            Official results for this section are <strong>PUBLISHED</strong>.
            Exam configurations and marks are locked unless an administrator
            reverts results to DRAFT.
          </p>
        </div>
      ) : null}

      {/* Weight Allocation Progress Card */}
      <Card className="glass rounded-2xl border-white/10">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">
                Total Assessment Weight Allocation
              </CardTitle>
              <CardDescription>
                Combined exam weights must total up to 100% before computing
                final grades.
              </CardDescription>
            </div>
            <StatusBadge
              status={isComplete ? "COMPLETED" : "UPCOMING"}
              label={`${totalWeight.toFixed(1)}% / 100%`}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                totalWeight > 100
                  ? "bg-destructive"
                  : isComplete
                    ? "bg-emerald-500"
                    : "bg-primary"
              )}
              style={{ width: `${Math.min(100, totalWeight)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {isComplete
              ? "100% allocated — ready for marks entry and draft grade computation."
              : `${remainingWeight.toFixed(1)}% remaining to allocate across exams.`}
          </p>
        </CardContent>
      </Card>

      {/* Exams Table */}
      {exams.length === 0 ? (
        <EmptyState
          title="No exams configured yet"
          description="Add exams such as Midterm, Quiz, and Final totaling 100% weight."
          action={
            <Button
              type="button"
              disabled={isPublished}
              onClick={() => {
                setEditingExam(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              Add Exam
            </Button>
          }
        />
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Exam Title</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Max Marks</TableHead>
                <TableHead>Exam Date</TableHead>
                <TableHead className="text-right">Marks Entry</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium text-foreground">
                    {exam.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="tabular-nums">
                      {normalizeDecimal(exam.weightPercent, 0)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {normalizeDecimal(exam.maxMarks, 0)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(exam.examDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/instructor/sections/${section.id}/marks?examId=${exam.id}`}
                      >
                        Enter Marks
                      </Link>
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={isPublished}
                          aria-label={`Actions for ${exam.title}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditingExam(exam);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                          <span>Edit Exam</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeletingExam(exam)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ExamFormDialog
        sectionId={section.id}
        exam={editingExam}
        remainingWeight={
          editingExam
            ? remainingWeight + normalizeDecimal(editingExam.weightPercent, 0)
            : remainingWeight
        }
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingExam(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingExam)}
        onOpenChange={(open) => {
          if (!open) setDeletingExam(null);
        }}
        title="Delete exam"
        description={
          deletingExam
            ? `Delete "${deletingExam.title}"? Exams with recorded student marks cannot be deleted.`
            : undefined
        }
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deletingExam) {
            deleteMutation.mutate(deletingExam.id);
          }
        }}
      />
    </div>
  );
}
