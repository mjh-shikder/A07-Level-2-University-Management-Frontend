"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, GraduationCap, IdCard, Loader2, Mail, Save, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AUTH_ME_QUERY_KEY } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { formatDate } from "@/lib/format";
import { useAuthStore } from "@/stores/auth-store";
import type { UserSummary } from "@/types/api";

const profileFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name cannot exceed 100 characters"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Last name cannot exceed 100 characters"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export interface ProfileInfoFormProps {
  initialUser: UserSummary;
}

export function ProfileInfoForm({ initialUser }: ProfileInfoFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const [user, setLocalUser] = useState<UserSummary>(initialUser);
  const [retryCountdown, setRetryCountdown] = useState<number>(0);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onChange",
    defaultValues: {
      firstName: initialUser.firstName,
      lastName: initialUser.lastName,
    },
  });

  useEffect(() => {
    setLocalUser(initialUser);
    form.reset({
      firstName: initialUser.firstName,
      lastName: initialUser.lastName,
    });
  }, [initialUser, form]);

  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setRetryCountdown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryCountdown]);

  const updateProfileMutation = useMutation<UserSummary, ApiError, ProfileFormValues>({
    mutationFn: (values) =>
      apiFetch<UserSummary>("/users/me", {
        method: "PATCH",
        body: values,
      }),
    onSuccess: (updated) => {
      setLocalUser(updated);
      setUser(updated);
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, updated);
      form.reset({
        firstName: updated.firstName,
        lastName: updated.lastName,
      });
      toast.success("Profile updated successfully.");
      router.refresh();
    },
    onError: (error) => {
      if (error.status === 429 && error.retryAfter) {
        setRetryCountdown(error.retryAfter);
      }
      const fieldErrors = error.getFieldErrors();
      if (fieldErrors.firstName) {
        form.setError("firstName", { message: fieldErrors.firstName });
      }
      if (fieldErrors.lastName) {
        form.setError("lastName", { message: fieldErrors.lastName });
      }
      toast.error(error.message || "Unable to update profile.");
    },
  });

  function onSubmit(values: ProfileFormValues) {
    if (retryCountdown > 0) return;
    updateProfileMutation.mutate(values);
  }

  const isDirty = form.formState.isDirty;
  const isSubmitting = updateProfileMutation.isPending;

  return (
    <Card className="glass rounded-2xl border-white/10">
      <CardHeader className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <User className="size-4" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-lg">Personal Information</CardTitle>
              <CardDescription>
                Manage your display name and review your academic profile.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={user.role} />
            <StatusBadge status={user.status} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Read-only academic / account metadata */}
        <div className="grid gap-3 rounded-xl border border-border/70 bg-secondary/30 p-4 sm:grid-cols-2">
          <div className="flex items-start gap-2.5">
            <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email Address</p>
              <p className="truncate text-sm font-medium text-foreground">{user.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <IdCard className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(user.createdAt)}
              </p>
            </div>
          </div>

          {user.studentProfile ? (
            <>
              <div className="flex items-start gap-2.5">
                <IdCard className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Student ID</p>
                  <p className="text-sm font-medium text-foreground">
                    {user.studentProfile.studentId}
                  </p>
                </div>
              </div>
              {user.studentProfile.program ? (
                <div className="flex items-start gap-2.5">
                  <GraduationCap
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Program</p>
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.studentProfile.program.code} — {user.studentProfile.program.name}
                    </p>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {user.instructorProfile ? (
            <>
              <div className="flex items-start gap-2.5">
                <IdCard className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Employee ID</p>
                  <p className="text-sm font-medium text-foreground">
                    {user.instructorProfile.employeeId}
                  </p>
                </div>
              </div>
              {user.instructorProfile.department ? (
                <div className="flex items-start gap-2.5">
                  <Building2
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.instructorProfile.department.code} —{" "}
                      {user.instructorProfile.department.name}
                    </p>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        <Separator />

        {/* Editable personal details */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-firstName">First name</Label>
              <Input
                id="profile-firstName"
                autoComplete="given-name"
                aria-invalid={Boolean(form.formState.errors.firstName)}
                disabled={isSubmitting}
                {...form.register("firstName")}
              />
              {form.formState.errors.firstName ? (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.firstName.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-lastName">Last name</Label>
              <Input
                id="profile-lastName"
                autoComplete="family-name"
                aria-invalid={Boolean(form.formState.errors.lastName)}
                disabled={isSubmitting}
                {...form.register("lastName")}
              />
              {form.formState.errors.lastName ? (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.lastName.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {isDirty ? (
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting}
                onClick={() =>
                  form.reset({
                    firstName: user.firstName,
                    lastName: user.lastName,
                  })
                }
              >
                Reset
              </Button>
            ) : null}
            <Button
              type="submit"
              disabled={!isDirty || isSubmitting || retryCountdown > 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : retryCountdown > 0 ? (
                `Retry in ${retryCountdown}s`
              ) : (
                <>
                  <Save className="size-4" aria-hidden="true" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
