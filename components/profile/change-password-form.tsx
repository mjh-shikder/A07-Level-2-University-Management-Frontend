"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { AUTH_ME_QUERY_KEY } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { logout } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long")
      .max(100, "New password cannot exceed 100 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  barClass: string;
} {
  if (!password) {
    return { score: 0, label: "", barClass: "bg-muted" };
  }
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score, label: "Weak", barClass: "bg-destructive" };
  if (score === 2) return { score, label: "Fair", barClass: "bg-amber-500" };
  if (score === 3) return { score, label: "Good", barClass: "bg-emerald-500" };
  return { score, label: "Strong", barClass: "bg-primary" };
}

export function ChangePasswordForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearUser = useAuthStore((state) => state.clearUser);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setRetryCountdown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryCountdown]);

  const changePasswordMutation = useMutation<
    null,
    ApiError,
    { currentPassword: string; newPassword: string }
  >({
    mutationFn: (payload) =>
      apiFetch<null>("/users/me/password", {
        method: "PATCH",
        body: payload,
      }),
    onSuccess: async () => {
      form.reset();
      toast.success("Password changed successfully. Please sign in again.");
      try {
        await logout();
      } catch {
        // Refresh tokens are already revoked server-side on password change.
      }
      clearUser();
      queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY });
      router.replace("/login");
      router.refresh();
    },
    onError: (error) => {
      if (error.status === 429 && error.retryAfter) {
        setRetryCountdown(error.retryAfter);
      }
      const fieldErrors = error.getFieldErrors();
      if (fieldErrors.currentPassword) {
        form.setError("currentPassword", { message: fieldErrors.currentPassword });
      } else if (error.status === 401) {
        form.setError("currentPassword", {
          message: error.message || "Incorrect current password",
        });
      }
      if (fieldErrors.newPassword) {
        form.setError("newPassword", { message: fieldErrors.newPassword });
      }
      toast.error(error.message || "Unable to update password.");
    },
  });

  function onSubmit(values: ChangePasswordValues) {
    if (retryCountdown > 0) return;
    changePasswordMutation.mutate({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  }

  const newPasswordValue = form.watch("newPassword");
  const strength = getPasswordStrength(newPasswordValue);
  const isSubmitting = changePasswordMutation.isPending;

  return (
    <Card className="glass rounded-2xl border-white/10">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <KeyRound className="size-4" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-lg">Security &amp; Password</CardTitle>
            <CardDescription>
              Update your password to keep your university account secure.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-200">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden="true" />
          <p>
            Changing your password revokes all active sessions. You will be signed out
            and prompted to log in again.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                autoComplete="current-password"
                aria-invalid={Boolean(form.formState.errors.currentPassword)}
                disabled={isSubmitting}
                className="pr-10"
                {...form.register("currentPassword")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 size-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowCurrent((v) => !v)}
                aria-label={showCurrent ? "Hide current password" : "Show current password"}
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
            {form.formState.errors.currentPassword ? (
              <p className="text-xs text-destructive" role="alert">
                {form.formState.errors.currentPassword.message}
              </p>
            ) : null}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={Boolean(form.formState.errors.newPassword)}
                disabled={isSubmitting}
                className="pr-10"
                {...form.register("newPassword")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 size-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? "Hide new password" : "Show new password"}
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>

            {newPasswordValue ? (
              <div className="space-y-1.5">
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={cn(
                        "h-1.5 rounded-full transition-colors",
                        step <= strength.score ? strength.barClass : "bg-muted"
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Strength: <span className="font-medium text-foreground">{strength.label}</span>
                </p>
              </div>
            ) : null}

            {form.formState.errors.newPassword ? (
              <p className="text-xs text-destructive" role="alert">
                {form.formState.errors.newPassword.message}
              </p>
            ) : null}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={Boolean(form.formState.errors.confirmPassword)}
                disabled={isSubmitting}
                className="pr-10"
                {...form.register("confirmPassword")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 size-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
            {form.formState.errors.confirmPassword ? (
              <p className="text-xs text-destructive" role="alert">
                {form.formState.errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting || retryCountdown > 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Updating…
                </>
              ) : retryCountdown > 0 ? (
                `Retry in ${retryCountdown}s`
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
