"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-error";
import {
  loginFormSchema,
  type Role,
  type TLoginFormInput,
} from "@/types/api";

interface DemoAccount {
  role: Role;
  label: string;
  email: string;
  password: string;
  icon: typeof ShieldCheck;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "ADMIN",
    label: "Admin",
    email: "admin@university.edu",
    password: "Admin1234!",
    icon: ShieldCheck,
  },
  {
    role: "INSTRUCTOR",
    label: "Instructor",
    email: "instructor01@university.com",
    password: "Password123!",
    icon: UserCheck,
  },
  {
    role: "STUDENT",
    label: "Student",
    email: "student03@university.com",
    password: "Password123!",
    icon: GraduationCap,
  },
];

export function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");

  const { loginMutation } = useAuth({ enabled: false });
  const [showPassword, setShowPassword] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState<Role | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<TLoginFormInput>({
    resolver: zodResolver(loginFormSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setRetryCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryCountdown]);

  const isPending = loginMutation.isPending;
  const isRateLimited = retryCountdown > 0;
  const isDisabled = isPending || isRateLimited;

  function handleMutationError(error: unknown) {
    if (error instanceof ApiError) {
      if (error.status === 429) {
        setRetryCountdown(error.retryAfter ?? 60);
      }
      const fieldErrors = error.getFieldErrors();
      for (const [field, message] of Object.entries(fieldErrors)) {
        if (field === "email" || field === "password") {
          setError(field, { type: "server", message });
        }
      }
    }
  }

  const onSubmit = handleSubmit((values) => {
    setActiveDemoRole(null);
    loginMutation.mutate(
      { credentials: values, nextPath },
      { onError: handleMutationError }
    );
  });

  function handleDemoLogin(account: DemoAccount) {
    clearErrors();
    setValue("email", account.email, { shouldValidate: true });
    setValue("password", account.password, { shouldValidate: true });
    setActiveDemoRole(account.role);

    loginMutation.mutate(
      {
        credentials: {
          email: account.email,
          password: account.password,
        },
        nextPath,
      },
      {
        onError: (err) => {
          setActiveDemoRole(null);
          handleMutationError(err);
        },
      }
    );
  }

  return (
    <div className="glass-strong rounded-2xl p-6 sm:p-8">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="text-sm text-muted-foreground">Login to your account</p>
      </div>

      {isRateLimited ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-destructive/40 bg-destructive/15 px-3.5 py-2.5 text-xs text-destructive dark:text-red-300"
        >
          Too many login attempts. Please wait{" "}
          <span className="font-semibold">{retryCountdown}s</span> before
          trying again.
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
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
          <Label htmlFor="login-password">Password</Label>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Password"
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
          {errors.password ? (
            <p className="text-xs text-destructive" role="alert">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" disabled={isDisabled}>
          {isPending && activeDemoRole === null ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Signing in...
            </>
          ) : (
            "Login"
          )}
        </Button>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Link
            href="/register"
            className="transition-colors hover:text-foreground"
          >
            Create an account
          </Link>
          <span>Contact admin for password resets</span>
        </div>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
          OR
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-3">
        <p className="text-center text-xs font-medium text-muted-foreground">
          Quick demo login
        </p>

        <div className="grid grid-cols-3 gap-2.5">
          {DEMO_ACCOUNTS.map((account) => {
            const Icon = account.icon;
            const isLoadingThis = isPending && activeDemoRole === account.role;

            return (
              <Button
                key={account.role}
                type="button"
                variant="outline"
                size="sm"
                className="h-auto flex-col gap-1.5 rounded-2xl py-2.5 px-2 text-xs font-medium hover:border-primary/50 hover:bg-primary/10"
                disabled={isDisabled}
                onClick={() => handleDemoLogin(account)}
              >
                {isLoadingThis ? (
                  <Loader2
                    className="size-4 animate-spin text-brand"
                    aria-hidden="true"
                  />
                ) : (
                  <Icon className="size-4 text-brand" aria-hidden="true" />
                )}
                <span>{account.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
