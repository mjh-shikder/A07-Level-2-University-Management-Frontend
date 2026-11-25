"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "@/lib/api-error";
import {
  getMe,
  getRoleDashboardPath,
  login,
  logout,
  register,
  type LoginResponseData,
  type RegisterInput,
} from "@/lib/auth";
import { useAuthStore } from "@/stores/auth-store";
import type { TLoginFormInput, UserSummary } from "@/types/api";

export const AUTH_ME_QUERY_KEY = ["auth", "me"] as const;

function getSafeRedirectPath(
  nextPath: string | null | undefined,
  fallback: string
): string {
  if (!nextPath) return fallback;
  // Prevent open redirects by allowing only relative app paths.
  if (nextPath.startsWith("/") && !nextPath.startsWith("//")) {
    return nextPath;
  }
  return fallback;
}

export interface UseAuthOptions {
  /** Set to false on public/auth pages to skip automatic /auth/me fetch. */
  enabled?: boolean;
}

export function useAuth(options: UseAuthOptions = {}) {
  const { enabled = true } = options;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: storeUser, isInitialized, setUser, clearUser } = useAuthStore();

  const meQuery = useQuery<UserSummary, ApiError>({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: getMe,
    enabled,
    staleTime: 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data);
    } else if (meQuery.isError) {
      clearUser();
    }
  }, [meQuery.data, meQuery.isError, setUser, clearUser]);

  const loginMutation = useMutation<
    LoginResponseData,
    ApiError,
    { credentials: TLoginFormInput; nextPath?: string | null }
  >({
    mutationFn: ({ credentials }) => login(credentials),
    onSuccess: async (data, variables) => {
      try {
        const fullUser = await queryClient.fetchQuery({
          queryKey: AUTH_ME_QUERY_KEY,
          queryFn: getMe,
        });
        setUser(fullUser);
      } catch {
        // Fallback to minimal login user if /auth/me fails transiently.
        await queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY });
      }

      toast.success(`Welcome back, ${data.user.firstName}!`);
      const destination = getSafeRedirectPath(
        variables.nextPath,
        getRoleDashboardPath(data.user.role)
      );
      router.replace(destination);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Unable to sign in. Please check your credentials.");
    },
  });

  const registerMutation = useMutation<UserSummary, ApiError, RegisterInput>({
    mutationFn: register,
    onSuccess: () => {
      toast.success("Account created successfully. Please sign in.");
      router.push("/login");
    },
    onError: (error) => {
      toast.error(error.message || "Registration failed. Please try again.");
    },
  });

  const logoutMutation = useMutation<null, ApiError, void>({
    mutationFn: logout,
    onSuccess: () => {
      clearUser();
      queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY });
      toast.success("Signed out successfully.");
      router.replace("/login");
      router.refresh();
    },
    onError: (error) => {
      // Clear local session state even if server cookie was already invalid.
      clearUser();
      queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY });
      toast.error(error.message || "Signed out locally.");
      router.replace("/login");
      router.refresh();
    },
  });

  const activeUser = meQuery.data ?? storeUser;

  return {
    user: activeUser,
    isLoading: enabled ? meQuery.isLoading : false,
    isInitialized,
    isAuthenticated: Boolean(activeUser),
    loginMutation,
    registerMutation,
    logoutMutation,
    refetchSession: meQuery.refetch,
  };
}
