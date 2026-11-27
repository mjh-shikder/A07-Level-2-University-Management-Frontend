import { Suspense } from "react";
import type { Metadata } from "next";

import { ProfilePageContent } from "@/components/profile/profile-page-content";
import { ProfileSkeleton } from "@/components/profile/profile-skeleton";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Instructor Profile & Settings",
  description: "Manage your faculty profile information and account password.",
});

export default function InstructorProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfilePageContent />
    </Suspense>
  );
}
