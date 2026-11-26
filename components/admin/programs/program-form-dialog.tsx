"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Loader2 } from "lucide-react";
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
  programFormSchema,
  type Department,
  type Program,
  type TProgramFormInput,
} from "@/types/api";

export interface ProgramFormDialogProps {
  program: Program | null;
  departments: Department[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProgramFormDialog({
  program,
  departments,
  open,
  onOpenChange,
}: ProgramFormDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [retryCountdown, setRetryCountdown] = useState(0);
  const isEditing = Boolean(program);

  const form = useForm<TProgramFormInput>({
    resolver: zodResolver(programFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      code: "",
      departmentId: "",
      requiredCredits: 120,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: program?.name ?? "",
      code: program?.code ?? "",
      departmentId: program?.departmentId ?? departments[0]?.id ?? "",
      requiredCredits: program?.requiredCredits ?? 120,
    });
  }, [program, departments, open, form]);

  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setRetryCountdown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryCountdown]);

  const mutation = useMutation<Program, ApiError, TProgramFormInput>({
    mutationFn: (values) => {
      const payload = {
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        departmentId: values.departmentId,
        requiredCredits: values.requiredCredits,
      };
      if (program) {
        return apiFetch<Program>(`/programs/${program.id}`, {
          method: "PATCH",
          body: payload,
        });
      }
      return apiFetch<Program>("/programs", {
        method: "POST",
        body: payload,
      });
    },
    onSuccess: (saved) => {
      toast.success(
        isEditing
          ? `Program "${saved.code}" updated.`
          : `Program "${saved.code}" created.`
      );
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "programs"] });
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      router.refresh();
    },
    onError: (error) => {
      if (error.status === 429 && error.retryAfter) {
        setRetryCountdown(error.retryAfter);
      }
      const fieldErrors = error.getFieldErrors();
      if (fieldErrors.name) {
        form.setError("name", { message: fieldErrors.name });
      }
      if (fieldErrors.code) {
        form.setError("code", { message: fieldErrors.code });
      }
      if (fieldErrors.departmentId) {
        form.setError("departmentId", { message: fieldErrors.departmentId });
      }
      if (fieldErrors.requiredCredits) {
        form.setError("requiredCredits", {
          message: fieldErrors.requiredCredits,
        });
      }
      toast.error(error.message || "Unable to save program.");
    },
  });

  function onSubmit(values: TProgramFormInput) {
    if (retryCountdown > 0) return;
    mutation.mutate(values);
  }

  const selectedDeptId = form.watch("departmentId");
  const isSubmitting = mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="size-5 text-primary" aria-hidden="true" />
            {isEditing ? "Edit Degree Program" : "Create Degree Program"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update program title, code, required credits, or parent department."
              : "Add a new degree program linked to an academic department."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prog-code">Program code</Label>
              <Input
                id="prog-code"
                placeholder="e.g. BSC-CSE"
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
              <Label htmlFor="prog-credits">Required credits</Label>
              <Input
                id="prog-credits"
                type="number"
                min={1}
                max={300}
                aria-invalid={Boolean(form.formState.errors.requiredCredits)}
                disabled={isSubmitting}
                {...form.register("requiredCredits", { valueAsNumber: true })}
              />
              {form.formState.errors.requiredCredits ? (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.requiredCredits.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prog-name">Program title</Label>
            <Input
              id="prog-name"
              placeholder="e.g. BSc in Computer Science & Engineering"
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

          <div className="space-y-2">
            <Label htmlFor="prog-dept">Department</Label>
            <Select
              value={selectedDeptId}
              onValueChange={(value) =>
                form.setValue("departmentId", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              disabled={isSubmitting || departments.length === 0}
            >
              <SelectTrigger id="prog-dept" className="w-full">
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.code} — {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.departmentId ? (
              <p className="text-xs text-destructive" role="alert">
                {form.formState.errors.departmentId.message}
              </p>
            ) : null}
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
                "Create Program"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
