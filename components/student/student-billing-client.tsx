"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ExternalLink,
  Eye,
  Loader2,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUrlState } from "@/hooks/use-url-state";
import { apiFetch } from "@/lib/api";
import type { ApiError } from "@/lib/api-error";
import { formatCurrency, formatDate, normalizeDecimal } from "@/lib/format";
import type { Invoice, TPaginationMeta } from "@/types/api";

interface CheckoutSessionResponse {
  sessionId: string;
  sessionUrl: string;
  transactionId: string;
}

export interface StudentBillingClientProps {
  invoices: Invoice[];
  meta: TPaginationMeta;
}

export function StudentBillingClient({
  invoices,
  meta,
}: StudentBillingClientProps) {
  const { page, getParam, setParam, setPage } = useUrlState({
    defaultLimit: 20,
  });
  const statusFilter = getParam("status", "all");

  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [inspectingInvoiceId, setInspectingInvoiceId] = useState<string | null>(
    null
  );

  const unpaidInvoices = invoices.filter(
    (inv) => inv.status === "PENDING" || inv.status === "OVERDUE"
  );
  const paidInvoices = invoices.filter((inv) => inv.status === "PAID");
  const totalUnpaidAmount = unpaidInvoices.reduce(
    (sum, inv) => sum + normalizeDecimal(inv.amount, 0),
    0
  );

  const payMutation = useMutation<CheckoutSessionResponse, ApiError, string>({
    mutationFn: (invoiceId) =>
      apiFetch<CheckoutSessionResponse>(`/invoices/${invoiceId}/pay`, {
        method: "POST",
      }),
    onMutate: (invoiceId) => {
      setPayingInvoiceId(invoiceId);
    },
    onSuccess: (session) => {
      if (session.sessionUrl) {
        toast.info("Redirecting to Stripe Checkout…");
        window.location.assign(session.sessionUrl);
      } else {
        toast.error("Stripe Checkout URL was not returned by the server.");
        setPayingInvoiceId(null);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Unable to initiate Stripe payment.");
      setPayingInvoiceId(null);
    },
  });

  const detailQuery = useQuery<Invoice, ApiError>({
    queryKey: ["student", "invoices", inspectingInvoiceId],
    enabled: Boolean(inspectingInvoiceId),
    queryFn: () => apiFetch<Invoice>(`/invoices/${inspectingInvoiceId}`),
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          <Receipt className="size-6 text-accent-brand" aria-hidden="true" />
          <span>Tuition Billing &amp; Payments</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          View your semester tuition invoices, inspect payment receipts, and pay
          securely with Stripe Checkout.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(totalUnpaidAmount)}
          subtitle={
            unpaidInvoices.length > 0
              ? `${unpaidInvoices.length} unpaid invoice${unpaidInvoices.length > 1 ? "s" : ""}`
              : "All invoices settled"
          }
          icon={AlertTriangle}
        />
        <StatCard
          title="Unpaid Invoices"
          value={unpaidInvoices.length}
          subtitle="Pending or overdue"
          icon={CreditCard}
        />
        <StatCard
          title="Paid Invoices"
          value={paidInvoices.length}
          subtitle="Verified via Stripe"
          icon={CheckCircle2}
        />
      </div>

      {/* Filter Toolbar */}
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 p-4">
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setParam("status", value === "all" ? null : value)
          }
        >
          <SelectTrigger
            className="w-full sm:w-52"
            aria-label="Filter invoices by status"
          >
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-xs text-muted-foreground">
          Showing {invoices.length} of {meta.total} invoice
          {meta.total === 1 ? "" : "s"}
        </span>
      </div>

      {/* Invoices Table */}
      <Card className="glass rounded-2xl border-white/10">
        <CardHeader>
          <CardTitle className="text-base">My Invoices</CardTitle>
          <CardDescription>
            Course registration is automatically unlocked once unpaid invoices
            are settled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <EmptyState
              title="No invoices found"
              description={
                statusFilter !== "all"
                  ? "No invoices match the selected status filter."
                  : "You do not have any tuition invoices issued yet."
              }
              className="border-0 bg-transparent py-8"
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Semester</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const isPayable =
                      invoice.status === "PENDING" ||
                      invoice.status === "OVERDUE";
                    const isPayingThis =
                      payMutation.isPending && payingInvoiceId === invoice.id;

                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="text-xs font-medium text-foreground">
                          {invoice.semester?.name ?? "Semester"}
                        </TableCell>
                        <TableCell className="max-w-xs text-xs text-muted-foreground">
                          {invoice.description || "Tuition & Fees"}
                        </TableCell>
                        <TableCell className="font-mono text-sm font-semibold tabular-nums text-foreground">
                          {formatCurrency(normalizeDecimal(invoice.amount, 0))}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(invoice.dueDate)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={invoice.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setInspectingInvoiceId(invoice.id)}
                            >
                              <Eye className="size-3.5" aria-hidden="true" />
                              Details
                            </Button>

                            {isPayable ? (
                              <Button
                                type="button"
                                size="sm"
                                disabled={payMutation.isPending}
                                onClick={() => payMutation.mutate(invoice.id)}
                              >
                                {isPayingThis ? (
                                  <>
                                    <Loader2
                                      className="size-3.5 animate-spin"
                                      aria-hidden="true"
                                    />
                                    Redirecting…
                                  </>
                                ) : (
                                  <>
                                    <CreditCard
                                      className="size-3.5"
                                      aria-hidden="true"
                                    />
                                    Pay with Stripe
                                    <ExternalLink
                                      className="size-3"
                                      aria-hidden="true"
                                    />
                                  </>
                                )}
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {meta.totalPages > 1 ? (
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-muted-foreground">
                  <span>
                    Page {meta.page} of {meta.totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="size-4" aria-hidden="true" />
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {/* Invoice & Payment History Detail Modal */}
      <Dialog
        open={Boolean(inspectingInvoiceId)}
        onOpenChange={(open) => {
          if (!open) setInspectingInvoiceId(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice Details &amp; Payment History</DialogTitle>
            <DialogDescription>
              Invoice ID: {inspectingInvoiceId}
            </DialogDescription>
          </DialogHeader>

          {detailQuery.isLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : detailQuery.data ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-background/40 p-3">
                <div>
                  <p className="text-muted-foreground">Semester</p>
                  <p className="font-semibold text-foreground">
                    {detailQuery.data.semester?.name ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <div className="mt-0.5">
                    <StatusBadge status={detailQuery.data.status} />
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-mono font-semibold text-foreground">
                    {formatCurrency(
                      normalizeDecimal(detailQuery.data.amount, 0)
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Due Date</p>
                  <p className="font-semibold text-foreground">
                    {formatDate(detailQuery.data.dueDate)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-foreground">
                  Payment Attempts
                </p>
                {detailQuery.data.payments &&
                detailQuery.data.payments.length > 0 ? (
                  <div className="space-y-2">
                    {detailQuery.data.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-background/30 p-3"
                      >
                        <div>
                          <p className="font-mono text-[11px] font-semibold text-foreground">
                            {payment.transactionId}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {payment.method} ·{" "}
                            {formatDate(payment.createdAt, "MMM d, yyyy HH:mm")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-semibold text-foreground">
                            {formatCurrency(
                              normalizeDecimal(payment.amount, 0)
                            )}
                          </p>
                          <StatusBadge status={payment.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No payment transactions recorded yet.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
