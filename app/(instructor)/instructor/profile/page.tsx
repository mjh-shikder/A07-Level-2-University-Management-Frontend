import { Suspense } from "react";
import type { Metadata } from "next";

import { ProfilePageContent } from "@/components/profile/profile-page-content";
import { ProfileSkeleton } from "@/components/profile/profile-skeleton";

export const metadata: Metadata = {
  title: "Profile & Settings | Instructor | UniManage",
};

export default function InstructorProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfilePageContent />
    </Suspense>
  );
}
