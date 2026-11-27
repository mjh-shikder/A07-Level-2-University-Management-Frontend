"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  UserCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { registerFormSchema } from "@/types/api";

const registerPageSchema = registerFormSchema
  .extend({
    role: z.enum(["STUDENT", "INSTRUCTOR"]),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterPageFormValues = z.infer<typeof registerPageSchema>;

function getPasswordStrength(password: string): {
  label: string;
  bars: number;
} {
  if (!password) return { label: "", bars: 0 };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { label: "Weak", bars: 1 };
  if (score === 2) return { label: "Fair", bars: 2 };
  if (score === 3) return { label: "Good", bars: 3 };
  return { label: "Strong", bars: 4 };
}

export function RegisterForm() {
  const { registerMutation } = useAuth({ enabled: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<RegisterPageFormValues>({
    resolver: zodResolver(registerPageSchema),
    mode: "onChange",
    defaultValues: {
      role: "STUDENT",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const selectedRole = useWatch({ control, name: "role" });
  const passwordValue = useWatch({ control, name: "password" });
  const strength = getPasswordStrength(passwordValue ?? "");

  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setRetryCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryCountdown]);

  const isPending = registerMutation.isPending;
  const isRateLimited = retryCountdown > 0;
  const isDisabled = isPending || isRateLimited;

  const onSubmit = handleSubmit((values) => {
    registerMutation.mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        role: values.role,
      },
      {
        onError: (error) => {
          if (error instanceof ApiError) {
            if (error.status === 429) {
              setRetryCountdown(error.retryAfter ?? 60);
            }
            const fieldErrors = error.getFieldErrors();
            for (const [field, message] of Object.entries(fieldErrors)) {
              if (
                field === "firstName" ||
                field === "lastName" ||
                field === "email" ||
                field === "password" ||
                field === "role"
              ) {
                setError(field, { type: "server", message });
              }
            }
          }
        },
      }
    );
  });

  return (
    <div className="glass-strong rounded-2xl p-6 sm:p-8">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Create account
        </h2>
        <p className="text-sm text-muted-foreground">
          Register as a Student or Instructor
        </p>
      </div>

      {isRateLimited ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-destructive/40 bg-destructive/15 px-3.5 py-2.5 text-xs text-destructive dark:text-red-300"
        >
          Too many registration attempts. Please wait{" "}
          <span className="font-semibold">{retryCountdown}s</span> before
          trying again.
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <div className="space-y-2">
          <Label>Account Role</Label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isDisabled}
              onClick={() =>
                setValue("role", "STUDENT", { shouldValidate: true })
              }
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all cursor-pointer",
                selectedRole === "STUDENT"
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
              )}
            >
              <GraduationCap className="size-4 text-brand" aria-hidden="true" />
              Student
            </button>
            <button
              type="button"
              disabled={isDisabled}
              onClick={() =>
                setValue("role", "INSTRUCTOR", { shouldValidate: true })
              }
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all cursor-pointer",
                selectedRole === "INSTRUCTOR"
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
              )}
            >
              <UserCheck className="size-4 text-brand" aria-hidden="true" />
              Instructor
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedRole === "STUDENT"
              ? "Automatically provisions a Student ID (STU-YYYY-XXXX). Program assignment is managed by an administrator."
              : "Automatically provisions an Employee ID (EMP-YYYY-XXXX). Department assignment is managed by an administrator."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="register-first-name">First name</Label>
            <Input
              id="register-first-name"
              type="text"
              autoComplete="given-name"
              placeholder="Alice"
              aria-invalid={Boolean(errors.firstName)}
              disabled={isDisabled}
              {...register("firstName")}
            />
            {errors.firstName ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.firstName.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-last-name">Last name</Label>
            <Input
              id="register-last-name"
              type="text"
              autoComplete="family-name"
              placeholder="Johnson"
              aria-invalid={Boolean(errors.lastName)}
              disabled={isDisabled}
              {...register("lastName")}
            />
            {errors.lastName ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.lastName.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            aria-invalid={Boolean(errors.email)}
            disabled={isDisabled}
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-xs text-destructive" role="alert">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-password">Password</Label>
          <div className="relative">
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              className="pr-10"
              aria-invalid={Boolean(errors.password)}
              disabled={isDisabled}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={isDisabled}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {passwordValue ? (
            <div className="space-y-1 pt-0.5">
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((bar) => (
                  <span
                    key={bar}
                    className={cn(
                      "h-1 rounded-full transition-colors",
                      bar <= strength.bars ? "bg-primary" : "bg-muted"
                    )}
                  />
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Strength: {strength.label}
              </p>
            </div>
          ) : null}
          {errors.password ? (
            <p className="text-xs text-destructive" role="alert">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-confirm-password">Confirm password</Label>
          <div className="relative">
            <Input
              id="register-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter password"
              className="pr-10"
              aria-invalid={Boolean(errors.confirmPassword)}
              disabled={isDisabled}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
              disabled={isDisabled}
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.confirmPassword ? (
            <p className="text-xs text-destructive" role="alert">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" disabled={isDisabled}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground transition-colors hover:text-brand"
          >
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
