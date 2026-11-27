import { Suspense } from "react";
import type { Metadata } from "next";

import StudentBillingLoading from "@/app/(student)/student/billing/loading";
import { StudentBillingContent } from "@/components/student/student-billing-content";

export const metadata: Metadata = {
  title: "Billing & Payments",
};

export default function StudentBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; limit?: string }>;
}) {
  return (
    <Suspense fallback={<StudentBillingLoading />}>
      <StudentBillingContent searchParams={searchParams} />
    </Suspense>
  );
}
