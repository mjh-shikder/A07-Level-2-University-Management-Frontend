"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import type { ApiError } from "@/lib/api-error";
import {
  semesterFormSchema,
  type Semester,
  type SemesterTerm,
  type TSemesterFormInput,
} from "@/types/api";

function toDateInputValue(iso?: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function toIsoStartOfDay(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  return `${dateStr}T00:00:00.000Z`;
}

export interface SemesterFormDialogProps {
  semester: Semester | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SemesterFormDialog({
  semester,
  open,
  onOpenChange,
}: SemesterFormDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [retryCountdown, setRetryCountdown] = useState(0);
  const isEditing = Boolean(semester);

  const form = useForm<TSemesterFormInput>({
    resolver: zodResolver(semesterFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      year: 2026,
      term: "Fall",
      startDate: "",
      endDate: "",
      registrationStart: "",
      registrationEnd: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: semester?.name ?? "",
      year: semester?.year ?? 2026,
      term: semester?.term ?? "Fall",
      startDate: toDateInputValue(semester?.startDate),
      endDate: toDateInputValue(semester?.endDate),
      registrationStart: toDateInputValue(semester?.registrationStart),
      registrationEnd: toDateInputValue(semester?.registrationEnd),
    });
  }, [semester, open, form]);

  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setRetryCountdown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryCountdown]);

  const mutation = useMutation<Semester, ApiError, TSemesterFormInput>({
    mutationFn: (values) => {
      const payload = {
        name: values.name.trim(),
        year: values.year,
        term: values.term,
        startDate: toIsoStartOfDay(values.startDate),
        endDate: toIsoStartOfDay(values.endDate),
        registrationStart: toIsoStartOfDay(values.registrationStart),
        registrationEnd: toIsoStartOfDay(values.registrationEnd),
      };

      if (semester) {
        return apiFetch<Semester>(`/semesters/${semester.id}`, {
          method: "PATCH",
          body: payload,
        });
      }

      return apiFetch<Semester>("/semesters", {
        method: "POST",
        body: { ...payload, status: "UPCOMING" },
      });
    },
    onSuccess: (saved) => {
      toast.success(
        isEditing
          ? `Semester "${saved.name}" updated.`
          : `Semester "${saved.name}" created.`
      );
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "semesters"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      router.refresh();
    },
    onError: (error) => {
      if (error.status === 429 && error.retryAfter) {
        setRetryCountdown(error.retryAfter);
      }
      const fieldErrors = error.getFieldErrors();
      if (fieldErrors.name) form.setError("name", { message: fieldErrors.name });
      if (fieldErrors.year) form.setError("year", { message: fieldErrors.year });
      if (fieldErrors.startDate) {
        form.setError("startDate", { message: fieldErrors.startDate });
      }
      if (fieldErrors.endDate) {
        form.setError("endDate", { message: fieldErrors.endDate });
      }
      if (fieldErrors.registrationStart) {
        form.setError("registrationStart", {
          message: fieldErrors.registrationStart,
        });
      }
      if (fieldErrors.registrationEnd) {
        form.setError("registrationEnd", {
          message: fieldErrors.registrationEnd,
        });
      }
      toast.error(error.message || "Unable to save semester.");
    },
  });

  function onSubmit(values: TSemesterFormInput) {
    if (retryCountdown > 0) return;
    mutation.mutate(values);
  }

  const selectedTerm = form.watch("term");
  const isSubmitting = mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" aria-hidden="true" />
            {isEditing ? "Edit Semester" : "Create Semester"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update academic term dates and registration windows."
              : "Schedule a new UPCOMING academic semester."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="sem-name">Semester name</Label>
            <Input
              id="sem-name"
              placeholder="e.g. Fall 2026"
              aria-invalid={Boolean(form.formState.errors.name)}
              disabled={isSubmitting}
              {...form.register("name")}
            />
            {form.formState.errors.name ? (
              <p className="text-xs text-destructive" role="alert">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sem-term">Term</Label>
              <Select
                value={selectedTerm}
                onValueChange={(value) =>
                  form.setValue("term", value as SemesterTerm, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="sem-term" className="w-full">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Spring">Spring</SelectItem>
                  <SelectItem value="Summer">Summer</SelectItem>
                  <SelectItem value="Fall">Fall</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sem-year">Academic year</Label>
              <Input
                id="sem-year"
                type="number"
                min={2000}
                max={2100}
                aria-invalid={Boolean(form.formState.errors.year)}
                disabled={isSubmitting}
                {...form.register("year", { valueAsNumber: true })}
              />
              {form.formState.errors.year ? (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.year.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sem-start">Start date</Label>
              <Input
                id="sem-start"
                type="date"
                aria-invalid={Boolean(form.formState.errors.startDate)}
                disabled={isSubmitting}
                {...form.register("startDate")}
              />
              {form.formState.errors.startDate ? (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.startDate.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sem-end">End date</Label>
              <Input
                id="sem-end"
                type="date"
                aria-invalid={Boolean(form.formState.errors.endDate)}
                disabled={isSubmitting}
                {...form.register("endDate")}
              />
              {form.formState.errors.endDate ? (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.endDate.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sem-reg-start">Registration opens</Label>
              <Input
                id="sem-reg-start"
                type="date"
                disabled={isSubmitting}
                {...form.register("registrationStart")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sem-reg-end">Registration closes</Label>
              <Input
                id="sem-reg-end"
                type="date"
                disabled={isSubmitting}
                {...form.register("registrationEnd")}
              />
            </div>
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
                "Create Semester"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
