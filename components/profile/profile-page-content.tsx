import { UserCog } from "lucide-react";

import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { ProfileInfoForm } from "@/components/profile/profile-info-form";
import { serverApiFetch } from "@/lib/api-server";
import type { UserSummary } from "@/types/api";

export async function ProfilePageContent() {
  const user = await serverApiFetch<UserSummary>("/users/me");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          <UserCog className="size-6 text-accent-brand" aria-hidden="true" />
          Profile &amp; Account Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your personal details and manage your account password.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <ProfileInfoForm initialUser={user} />
        <ChangePasswordForm />
      </div>
    </div>
  );
}
