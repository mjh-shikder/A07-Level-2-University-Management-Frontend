"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
  createInvoiceFormSchema,
  type Invoice,
  type Semester,
  type TCreateInvoiceFormInput,
  type UserSummary,
} from "@/types/api";

export interface InvoiceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesters: Semester[];
  students: UserSummary[];
}

export function InvoiceCreateDialog({
  open,
  onOpenChange,
  semesters,
  students,
}: InvoiceCreateDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const defaultSemesterId =
    semesters.find((s) => s.status === "ACTIVE")?.id ?? semesters[0]?.id ?? "";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm<TCreateInvoiceFormInput>({
    resolver: zodResolver(createInvoiceFormSchema),
    defaultValues: {
      studentId: "",
      semesterId: defaultSemesterId,
      amount: 1200,
      dueDate: "",
      description: "",
    },
  });

  const selectedStudentId = watch("studentId");
  const selectedSemesterId = watch("semesterId");

  const createMutation = useMutation<Invoice, ApiError, TCreateInvoiceFormInput>(
    {
      mutationFn: (payload) =>
        apiFetch<Invoice>("/invoices", {
          method: "POST",
          body: {
            ...payload,
            dueDate: new Date(payload.dueDate).toISOString(),
            description: payload.description?.trim() || undefined,
          },
        }),
      onSuccess: () => {
        toast.success("Student invoice generated successfully.");
        reset({
          studentId: "",
          semesterId: defaultSemesterId,
          amount: 1200,
          dueDate: "",
          description: "",
        });
        onOpenChange(false);
        queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
        router.refresh();
      },
      onError: (error) => {
        const fieldErrors = error.getFieldErrors();
        for (const [field, message] of Object.entries(fieldErrors)) {
          if (
            field === "studentId" ||
            field === "semesterId" ||
            field === "amount" ||
            field === "dueDate" ||
            field === "description"
          ) {
            setError(field, { message });
          }
        }
        toast.error(error.message || "Unable to generate invoice.");
      },
    }
  );

  function onSubmit(values: TCreateInvoiceFormInput) {
    createMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Student Invoice</DialogTitle>
          <DialogDescription>
            Issue a tuition or fee invoice for a student and semester.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invoice-student">Student</Label>
            {students.length > 0 ? (
              <Select
                value={selectedStudentId}
                onValueChange={(val) =>
                  setValue("studentId", val, { shouldValidate: true })
                }
              >
                <SelectTrigger id="invoice-student">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem
                      key={student.id}
                      value={
                        student.studentProfile?.id ??
                        student.studentProfile?.studentId ??
                        student.id
                      }
                    >
                      {student.studentProfile?.studentId ?? "STU"} —{" "}
                      {student.firstName} {student.lastName} ({student.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="invoice-student"
                placeholder="STU-2026-0001 or Student Profile UUID"
                {...register("studentId")}
              />
            )}
            {errors.studentId ? (
              <p className="text-xs text-destructive">
                {errors.studentId.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invoice-semester">Semester</Label>
            <Select
              value={selectedSemesterId}
              onValueChange={(val) =>
                setValue("semesterId", val, { shouldValidate: true })
              }
            >
              <SelectTrigger id="invoice-semester">
                <SelectValue placeholder="Select a semester" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((semester) => (
                  <SelectItem key={semester.id} value={semester.id}>
                    {semester.name} ({semester.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.semesterId ? (
              <p className="text-xs text-destructive">
                {errors.semesterId.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="invoice-amount">Amount (USD)</Label>
              <Input
                id="invoice-amount"
                type="number"
                step="0.01"
                min="0.01"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount ? (
                <p className="text-xs text-destructive">
                  {errors.amount.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invoice-dueDate">Due Date</Label>
              <Input
                id="invoice-dueDate"
                type="date"
                {...register("dueDate")}
              />
              {errors.dueDate ? (
                <p className="text-xs text-destructive">
                  {errors.dueDate.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invoice-description">Description (Optional)</Label>
            <Input
              id="invoice-description"
              placeholder="Tuition & Lab Fees - Fall 2026"
              {...register("description")}
            />
            {errors.description ? (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                  Generating…
                </>
              ) : (
                "Generate Invoice"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
