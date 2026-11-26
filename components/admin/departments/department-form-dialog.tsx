"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2 } from "lucide-react";
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
import {
  departmentFormSchema,
  type Department,
  type TDepartmentFormInput,
} from "@/types/api";

export interface DepartmentFormDialogProps {
  department: Department | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DepartmentFormDialog({
  department,
  open,
  onOpenChange,
}: DepartmentFormDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [retryCountdown, setRetryCountdown] = useState(0);
  const isEditing = Boolean(department);

  const form = useForm<TDepartmentFormInput>({
    resolver: zodResolver(departmentFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      code: "",
      description: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: department?.name ?? "",
      code: department?.code ?? "",
      description: department?.description ?? "",
    });
  }, [department, open, form]);

  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setRetryCountdown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryCountdown]);

  const mutation = useMutation<Department, ApiError, TDepartmentFormInput>({
    mutationFn: (values) => {
      const payload = {
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        description: values.description?.trim() || undefined,
      };
      if (department) {
        return apiFetch<Department>(`/departments/${department.id}`, {
          method: "PATCH",
          body: payload,
        });
      }
      return apiFetch<Department>("/departments", {
        method: "POST",
        body: payload,
      });
    },
    onSuccess: (saved) => {
      toast.success(
        isEditing
          ? `Department "${saved.code}" updated.`
          : `Department "${saved.code}" created.`
      );
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "departments"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
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
      if (fieldErrors.description) {
        form.setError("description", { message: fieldErrors.description });
      }
      toast.error(error.message || "Unable to save department.");
    },
  });

  function onSubmit(values: TDepartmentFormInput) {
    if (retryCountdown > 0) return;
    mutation.mutate(values);
  }

  const isSubmitting = mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" aria-hidden="true" />
            {isEditing ? "Edit Department" : "Create Department"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the academic department code, name, or description."
              : "Add a new academic department to organize degree programs."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="dept-code">Department code</Label>
            <Input
              id="dept-code"
              placeholder="e.g. CSE"
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
            <Label htmlFor="dept-name">Department name</Label>
            <Input
              id="dept-name"
              placeholder="e.g. Computer Science & Engineering"
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
            <Label htmlFor="dept-description">Description (optional)</Label>
            <textarea
              id="dept-description"
              rows={3}
              placeholder="Brief overview of the department..."
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
                "Create Department"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
