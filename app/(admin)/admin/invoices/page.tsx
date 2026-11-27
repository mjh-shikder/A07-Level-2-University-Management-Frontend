import { Suspense } from "react";
import type { Metadata } from "next";

import AdminInvoicesLoading from "@/app/(admin)/admin/invoices/loading";
import { AdminInvoicesContent } from "@/components/admin/invoices/admin-invoices-content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Billing & Invoices",
  description:
    "Generate student semester tuition invoices and monitor payment statuses.",
});

export default function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    semesterId?: string;
    sortBy?: string;
    order?: string;
  }>;
}) {
  return (
    <Suspense fallback={<AdminInvoicesLoading />}>
      <AdminInvoicesContent searchParams={searchParams} />
    </Suspense>
  );
}
