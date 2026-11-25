import { Suspense, type ReactNode } from "react";
import { cookies } from "next/headers";

import { PublicFooter } from "@/components/public/public-footer";
import {
  PublicNavbar,
  type PublicNavbarUser,
} from "@/components/public/public-navbar";
import { serverApiFetch } from "@/lib/api-server";
import type { UserSummary } from "@/types/api";

async function PublicNavbarWithSession() {
  let initialUser: PublicNavbarUser | null = null;

  try {
    const cookieStore = await cookies();
    const hasSession = Boolean(
      cookieStore.get("accessToken")?.value ||
        cookieStore.get("refreshToken")?.value
    );

    if (hasSession) {
      const me = await serverApiFetch<UserSummary>("/auth/me", {
        redirectOnAuthError: false,
      });
      initialUser = {
        firstName: me.firstName,
        role: me.role,
      };
    }
  } catch {
    initialUser = null;
  }

  return <PublicNavbar initialUser={initialUser} />;
}

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Suspense fallback={<PublicNavbar initialUser={null} />}>
        <PublicNavbarWithSession />
      </Suspense>
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
