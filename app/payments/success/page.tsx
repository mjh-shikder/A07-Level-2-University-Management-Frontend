import { Suspense } from "react";
import type { Metadata } from "next";

import { PaymentSuccessClient } from "@/components/payments/payment-success-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Payment Confirmation",
};

async function PaymentSuccessWrapper({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; invoice_id?: string }>;
}) {
  const params = await searchParams;
  return (
    <PaymentSuccessClient
      sessionId={params.session_id}
      invoiceId={params.invoice_id}
    />
  );
}

export default function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; invoice_id?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[75vh] w-full max-w-xl items-center justify-center px-4">
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      }
    >
      <PaymentSuccessWrapper searchParams={searchParams} />
    </Suspense>
  );
}
