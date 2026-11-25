import { apiFetch } from "@/lib/api";
import type {
  Role,
  TForgotPasswordFormInput,
  TLoginFormInput,
  TRegisterFormInput,
  TResetPasswordFormInput,
  UserSummary,
} from "@/types/api";

export const ROLE_DASHBOARD_PATHS: Record<Role, string> = {
  ADMIN: "/admin",
  INSTRUCTOR: "/instructor",
  STUDENT: "/student",
};

export function getRoleDashboardPath(role: Role): string {
  return ROLE_DASHBOARD_PATHS[role];
}

export interface AuthLoginUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface LoginResponseData {
  user: AuthLoginUser;
}

export interface RegisterInput extends TRegisterFormInput {
  role?: Role;
}

/** Authenticate user; backend sets httpOnly accessToken & refreshToken cookies. */
export async function login(
  input: TLoginFormInput
): Promise<LoginResponseData> {
  return apiFetch<LoginResponseData>("/auth/login", {
    method: "POST",
    body: input,
    skipAuthRefresh: true,
  });
}

/** Register a new account (defaults to STUDENT on backend if role omitted). */
export async function register(input: RegisterInput): Promise<UserSummary> {
  return apiFetch<UserSummary>("/auth/register", {
    method: "POST",
    body: input,
    skipAuthRefresh: true,
  });
}

/** Terminate session and clear httpOnly auth cookies. */
export async function logout(): Promise<null> {
  return apiFetch<null>("/auth/logout", {
    method: "POST",
    skipAuthRefresh: true,
  });
}

/** Fetch the currently authenticated user's profile. */
export async function getMe(): Promise<UserSummary> {
  return apiFetch<UserSummary>("/auth/me");
}

/** Request a password reset email. */
export async function forgotPassword(
  input: TForgotPasswordFormInput
): Promise<null> {
  return apiFetch<null>("/auth/forgot-password", {
    method: "POST",
    body: input,
    skipAuthRefresh: true,
  });
}

/** Complete password reset using a reset token. */
export async function resetPassword(
  input: TResetPasswordFormInput
): Promise<null> {
  return apiFetch<null>("/auth/reset-password", {
    method: "POST",
    body: input,
    skipAuthRefresh: true,
  });
}
