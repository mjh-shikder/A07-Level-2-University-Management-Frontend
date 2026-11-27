import { Suspense } from "react";
import type { Metadata } from "next";

import StudentBillingLoading from "@/app/(student)/student/billing/loading";
import { StudentBillingContent } from "@/components/student/student-billing-content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Billing & Payments",
  description:
    "View semester tuition invoices, inspect payment history, and pay online via Stripe.",
});

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
