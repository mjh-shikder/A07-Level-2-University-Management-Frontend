"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Check, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import {
  courseFormSchema,
  type Course,
  type Program,
  type TCourseFormInput,
} from "@/types/api";

export interface CourseFormDialogProps {
  course: Course | null;
  programs: Program[];
  availableCourses?: Course[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CourseFormDialog({
  course,
  programs,
  availableCourses = [],
  open,
  onOpenChange,
}: CourseFormDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [selectedPrereqIds, setSelectedPrereqIds] = useState<string[]>([]);
  const isEditing = Boolean(course);

  const form = useForm<TCourseFormInput>({
    resolver: zodResolver(courseFormSchema),
    mode: "onChange",
    defaultValues: {
      code: "",
      title: "",
      credits: 3,
      programId: "",
      description: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      code: course?.code ?? "",
      title: course?.title ?? "",
      credits: course?.credits ?? 3,
      programId: course?.programId ?? programs[0]?.id ?? "",
      description: course?.description ?? "",
    });
    setSelectedPrereqIds([]);
  }, [course, programs, open, form]);

  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setRetryCountdown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryCountdown]);

  const mutation = useMutation<Course, ApiError, TCourseFormInput>({
    mutationFn: async (values) => {
      const payload = {
        code: values.code.trim().toUpperCase(),
        title: values.title.trim(),
        credits: values.credits,
        programId: values.programId,
        description: values.description?.trim() || undefined,
      };

      if (course) {
        return apiFetch<Course>(`/courses/${course.id}`, {
          method: "PATCH",
          body: payload,
        });
      }

      const created = await apiFetch<Course>("/courses", {
        method: "POST",
        body: payload,
      });

      if (selectedPrereqIds.length > 0) {
        await Promise.allSettled(
          selectedPrereqIds.map((prerequisiteId) =>
            apiFetch(`/courses/${created.id}/prerequisites`, {
              method: "POST",
              body: { prerequisiteId },
            })
          )
        );
      }

      return created;
    },
    onSuccess: (saved) => {
      toast.success(
        isEditing
          ? `Course "${saved.code}" updated.`
          : `Course "${saved.code}" created.`
      );
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      router.refresh();
    },
    onError: (error) => {
      if (error.status === 429 && error.retryAfter) {
        setRetryCountdown(error.retryAfter);
      }
      const fieldErrors = error.getFieldErrors();
      if (fieldErrors.code) {
        form.setError("code", { message: fieldErrors.code });
      }
      if (fieldErrors.title) {
        form.setError("title", { message: fieldErrors.title });
      }
      if (fieldErrors.credits) {
        form.setError("credits", { message: fieldErrors.credits });
      }
      if (fieldErrors.programId) {
        form.setError("programId", { message: fieldErrors.programId });
      }
      if (fieldErrors.description) {
        form.setError("description", { message: fieldErrors.description });
      }
      toast.error(error.message || "Unable to save course.");
    },
  });

  function togglePrereq(id: string) {
    setSelectedPrereqIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function onSubmit(values: TCourseFormInput) {
    if (retryCountdown > 0) return;
    mutation.mutate(values);
  }

  const selectedProgramId = form.watch("programId");
  const isSubmitting = mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" aria-hidden="true" />
            {isEditing ? "Edit Course" : "Add Course"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update course title, code, credit hours, or syllabus summary."
              : "Create a new course under an academic program and optionally link prerequisites."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="course-code">Course code</Label>
              <Input
                id="course-code"
                placeholder="e.g. CSE202"
                aria-invalid={Boolean(form.formState.errors.code)}
                disabled={isSubmitting}
                {...form.register("code")}
              />
              {form.formState.errors.code ? (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.code.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-credits">Credits (1–10)</Label>
              <Input
                id="course-credits"
                type="number"
                min={1}
                max={10}
                aria-invalid={Boolean(form.formState.errors.credits)}
                disabled={isSubmitting}
                {...form.register("credits", { valueAsNumber: true })}
              />
              {form.formState.errors.credits ? (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.credits.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-title">Course title</Label>
            <Input
              id="course-title"
              placeholder="e.g. Algorithms & Data Structures"
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

          <div className="space-y-2">
            <Label htmlFor="course-program">Program / Department</Label>
            <Select
              value={selectedProgramId}
              onValueChange={(value) =>
                form.setValue("programId", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              disabled={isSubmitting || programs.length === 0}
            >
              <SelectTrigger id="course-program" className="w-full">
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.code} — {program.name}
                    {program.department ? ` (${program.department.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.programId ? (
              <p className="text-xs text-destructive" role="alert">
                {form.formState.errors.programId.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-description">
              Syllabus &amp; description (optional)
            </Label>
            <textarea
              id="course-description"
              rows={3}
              placeholder="Key topics, learning outcomes, and syllabus summary..."
              disabled={isSubmitting}
              className="border-input bg-secondary/40 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/40 flex w-full rounded-xl border px-3.5 py-2.5 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <p className="text-xs text-destructive" role="alert">
                {form.formState.errors.description.message}
              </p>
            ) : null}
          </div>

          {!isEditing && availableCourses.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Prerequisites (optional)</Label>
                {selectedPrereqIds.length > 0 ? (
                  <Badge variant="secondary" className="text-xs">
                    {selectedPrereqIds.length} selected
                  </Badge>
                ) : null}
              </div>
              <div className="max-h-36 overflow-y-auto rounded-xl border border-border/70 bg-secondary/25 p-2">
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {availableCourses.map((item) => {
                    const checked = selectedPrereqIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => togglePrereq(item.id)}
                        disabled={isSubmitting}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer",
                          checked
                            ? "border-primary/40 bg-primary/15 text-foreground"
                            : "border-transparent bg-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground"
                        )}
                      >
                        <span className="truncate">
                          <span className="font-semibold">{item.code}</span>{" "}
                          {item.title}
                        </span>
                        {checked ? (
                          <Check className="size-3.5 shrink-0 text-primary" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

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
                "Add Course"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
