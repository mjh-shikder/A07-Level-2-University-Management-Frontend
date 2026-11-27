import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Receipt, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Payment Cancelled",
  description:
    "Stripe Checkout session cancelled. Return to student billing to retry payment.",
});

async function PaymentCancelContent({
  searchParams,
}: {
  searchParams: Promise<{ invoice_id?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto flex min-h-[75vh] w-full max-w-xl items-center justify-center px-4 py-12">
      <Card className="glass w-full rounded-2xl border-white/10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <XCircle className="size-7" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">Checkout Cancelled</CardTitle>
          <CardDescription>
            Your Stripe payment session was cancelled. No charges were made and
            your invoice remains pending.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {params.invoice_id ? (
            <div className="rounded-xl border border-white/10 bg-background/40 p-3 text-center text-xs">
              <p className="text-muted-foreground">Invoice Reference</p>
              <p className="mt-1 font-mono font-semibold text-foreground">
                {params.invoice_id}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button asChild size="sm">
              <Link href="/student/billing">
                <Receipt className="size-4" aria-hidden="true" />
                Try Again in Billing
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/student">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ invoice_id?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[75vh] w-full max-w-xl items-center justify-center px-4">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      }
    >
      <PaymentCancelContent searchParams={searchParams} />
    </Suspense>
  );
}
