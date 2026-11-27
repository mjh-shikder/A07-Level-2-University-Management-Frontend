"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  RefreshCw,
  Receipt,
} from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import type { ApiError } from "@/lib/api-error";
import { formatCurrency, formatDate, normalizeDecimal } from "@/lib/format";
import type { Invoice } from "@/types/api";

export interface PaymentSuccessClientProps {
  invoiceId?: string;
  sessionId?: string;
}

export function PaymentSuccessClient({
  invoiceId,
  sessionId,
}: PaymentSuccessClientProps) {
  const invoiceQuery = useQuery<Invoice, ApiError>({
    queryKey: ["payment", "verify-invoice", invoiceId],
    enabled: Boolean(invoiceId),
    queryFn: () => apiFetch<Invoice>(`/invoices/${invoiceId}`),
    // Poll briefly while webhook settles if status is not yet PAID.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && status !== "PAID" ? 3000 : false;
    },
  });

  const invoice = invoiceQuery.data;
  const isPaid = invoice?.status === "PAID";
  const latestSuccessPayment = invoice?.payments?.find(
    (p) => p.status === "SUCCESS"
  );

  return (
    <div className="mx-auto flex min-h-[75vh] w-full max-w-xl items-center justify-center px-4 py-12">
      <Card className="glass w-full rounded-2xl border-white/10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
            {invoiceId && !isPaid ? (
              <Clock className="size-7 text-amber-400" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-7" aria-hidden="true" />
            )}
          </div>
          <CardTitle className="text-xl">
            {invoiceId && invoiceQuery.isLoading
              ? "Verifying Payment Status…"
              : invoiceId && !isPaid
                ? "Payment Received — Awaiting Confirmation"
                : "Tuition Payment Confirmed"}
          </CardTitle>
          <CardDescription>
            {invoiceId && !isPaid
              ? "Stripe Checkout succeeded. Waiting for webhook verification to finalize your invoice receipt."
              : "Your tuition payment has been verified. Course registration is unlocked."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {invoiceId && invoiceQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : invoice ? (
            <div className="space-y-3 rounded-xl border border-white/10 bg-background/40 p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Invoice Status</span>
                <StatusBadge status={invoice.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Semester</span>
                <span className="font-medium text-foreground">
                  {invoice.semester?.name ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {formatCurrency(normalizeDecimal(invoice.amount, 0))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Due Date</span>
                <span className="text-foreground">
                  {formatDate(invoice.dueDate)}
                </span>
              </div>
              {latestSuccessPayment ? (
                <div className="flex items-center justify-between border-t border-white/10 pt-2">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-[11px] font-semibold text-foreground">
                    {latestSuccessPayment.transactionId}
                  </span>
                </div>
              ) : null}
              {sessionId ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Stripe Session
                  </span>
                  <span className="max-w-[220px] truncate font-mono text-[11px] text-muted-foreground">
                    {sessionId}
                  </span>
                </div>
              ) : null}
            </div>
          ) : invoiceQuery.isError ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              {invoiceQuery.error.message ||
                "Sign in to view full invoice receipt details."}
            </div>
          ) : sessionId ? (
            <div className="rounded-xl border border-white/10 bg-background/40 p-3 text-xs">
              <p className="text-muted-foreground">Stripe Checkout Session</p>
              <p className="mt-1 break-all font-mono text-foreground">
                {sessionId}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {invoiceId && !isPaid ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => invoiceQuery.refetch()}
                disabled={invoiceQuery.isFetching}
              >
                <RefreshCw
                  className={
                    invoiceQuery.isFetching
                      ? "size-4 animate-spin"
                      : "size-4"
                  }
                  aria-hidden="true"
                />
                Refresh Status
              </Button>
            ) : null}

            <Button asChild size="sm">
              <Link href="/student/billing">
                <Receipt className="size-4" aria-hidden="true" />
                Return to Billing
              </Link>
            </Button>

            <Button variant="outline" size="sm" asChild>
              <Link href="/student/registration">
                Course Registration
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
