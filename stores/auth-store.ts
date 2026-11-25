"use client";

import { create } from "zustand";

import type { UserSummary } from "@/types/api";

interface AuthState {
  user: UserSummary | null;
  isInitialized: boolean;
  setUser: (user: UserSummary | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isInitialized: false,
  setUser: (user) => set({ user, isInitialized: true }),
  clearUser: () => set({ user: null, isInitialized: true }),
}));
