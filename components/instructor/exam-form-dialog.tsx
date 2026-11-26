"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import type { ApiError } from "@/lib/api-error";
import { normalizeDecimal } from "@/lib/format";
import { examFormSchema, type Exam, type TExamFormInput } from "@/types/api";

function toDateInput(iso?: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export interface ExamFormDialogProps {
  sectionId: string;
  exam: Exam | null;
  remainingWeight: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExamFormDialog({
  sectionId,
  exam,
  remainingWeight,
  open,
  onOpenChange,
}: ExamFormDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [retryCountdown, setRetryCountdown] = useState(0);
  const isEditing = Boolean(exam);

  const form = useForm<TExamFormInput>({
    resolver: zodResolver(examFormSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      weightPercent: 20,
      maxMarks: 100,
      examDate: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      title: exam?.title ?? "",
      weightPercent: exam
        ? normalizeDecimal(exam.weightPercent, 20)
        : Math.min(25, Math.max(5, remainingWeight)),
      maxMarks: exam ? normalizeDecimal(exam.maxMarks, 100) : 100,
      examDate: toDateInput(exam?.examDate),
    });
  }, [exam, remainingWeight, open, form]);

  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setRetryCountdown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryCountdown]);

  const mutation = useMutation<Exam, ApiError, TExamFormInput>({
    mutationFn: (values) => {
      const payload = {
        title: values.title.trim(),
        weightPercent: values.weightPercent,
        maxMarks: values.maxMarks,
        examDate: values.examDate?.trim() || undefined,
      };
      if (exam) {
        return apiFetch<Exam>(`/exams/${exam.id}`, {
          method: "PATCH",
          body: payload,
        });
      }
      return apiFetch<Exam>(`/sections/${sectionId}/exams`, {
        method: "POST",
        body: payload,
      });
    },
    onSuccess: (saved) => {
      toast.success(
        isEditing
          ? `Exam "${saved.title}" updated.`
          : `Exam "${saved.title}" created.`
      );
      onOpenChange(false);
      queryClient.invalidateQueries({
        queryKey: ["instructor", "sections", sectionId, "exams"],
      });
      router.refresh();
    },
    onError: (error) => {
      if (error.status === 429 && error.retryAfter) {
        setRetryCountdown(error.retryAfter);
      }
      const fieldErrors = error.getFieldErrors();
      if (fieldErrors.title) form.setError("title", { message: fieldErrors.title });
      if (fieldErrors.weightPercent) {
        form.setError("weightPercent", { message: fieldErrors.weightPercent });
      }
      if (fieldErrors.maxMarks) {
        form.setError("maxMarks", { message: fieldErrors.maxMarks });
      }
      toast.error(error.message || "Unable to save exam.");
    },
  });

  function onSubmit(values: TExamFormInput) {
    if (retryCountdown > 0) return;
    mutation.mutate(values);
  }

  const isSubmitting = mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet
              className="size-5 text-primary"
              aria-hidden="true"
            />
            {isEditing ? "Edit Exam" : "Add Exam"}
          </DialogTitle>
          <DialogDescription>
            Configure assessment title, percentage weight (total ≤ 100%), and maximum marks.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="exam-title">Exam title</Label>
            <Input
              id="exam-title"
              placeholder="e.g. Midterm Exam, Quiz 1, Final Exam"
              aria-invalid={Boolean(form.formState.errors.title)}
              disabled={isSubmitting}
              {...form.register("title")}
            />
            {form.formState.errors.title ? (
              <p className="text-xs text-destructive" role="alert">
                {form.formState.errors.title.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="exam-weight">Weight (%)</Label>
              <Input
                id="exam-weight"
                type="number"
                step="0.5"
                min={0.5}
                max={100}
                aria-invalid={Boolean(form.formState.errors.weightPercent)}
                disabled={isSubmitting}
                {...form.register("weightPercent", { valueAsNumber: true })}
              />
              {form.formState.errors.weightPercent ? (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.weightPercent.message}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Remaining unallocated: {Math.max(0, remainingWeight).toFixed(1)}%
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="exam-max">Max marks</Label>
              <Input
                id="exam-max"
                type="number"
                step="0.5"
                min={1}
                max={1000}
                aria-invalid={Boolean(form.formState.errors.maxMarks)}
                disabled={isSubmitting}
                {...form.register("maxMarks", { valueAsNumber: true })}
              />
              {form.formState.errors.maxMarks ? (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.maxMarks.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exam-date">Exam date (optional)</Label>
            <Input
              id="exam-date"
              type="date"
              disabled={isSubmitting}
              {...form.register("examDate")}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || retryCountdown > 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : retryCountdown > 0 ? (
                `Retry in ${retryCountdown}s`
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Exam"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
