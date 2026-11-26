"use client";

import { useState } from "react";
import { Plus, Receipt, X } from "lucide-react";

import { InvoiceCreateDialog } from "@/components/admin/invoices/invoice-form-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUrlState } from "@/hooks/use-url-state";
import { formatCurrency, formatDate, normalizeDecimal } from "@/lib/format";
import type {
  Invoice,
  Semester,
  TPaginationMeta,
  UserSummary,
} from "@/types/api";

export interface AdminInvoicesClientProps {
  invoices: Invoice[];
  meta: TPaginationMeta;
  semesters: Semester[];
  students: UserSummary[];
}

export function AdminInvoicesClient({
  invoices,
  meta,
  semesters,
  students,
}: AdminInvoicesClientProps) {
  const {
    sortBy,
    order,
    getParam,
    setParam,
    setPage,
    setLimit,
    toggleSort,
    resetParams,
  } = useUrlState({ defaultLimit: 10 });

  const [createOpen, setCreateOpen] = useState(false);

  const statusFilter = getParam("status", "all");
  const semesterFilter = getParam("semesterId", "all");
  const hasFilters =
    (statusFilter && statusFilter !== "all") ||
    (semesterFilter && semesterFilter !== "all");

  const columns: DataTableColumn<Invoice>[] = [
    {
      id: "student",
      header: "Student",
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">
            {row.student?.user
              ? `${row.student.user.firstName} ${row.student.user.lastName}`
              : "Student"}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {row.student?.studentId ?? row.studentId}
          </p>
        </div>
      ),
    },
    {
      id: "semester",
      header: "Semester",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.semester?.name ?? "—"}
        </span>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      sortKey: "amount",
      cell: (row) => (
        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
          {formatCurrency(normalizeDecimal(row.amount, 0))}
        </span>
      ),
    },
    {
      id: "dueDate",
      header: "Due Date",
      sortKey: "dueDate",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.dueDate)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "description",
      header: "Description",
      cell: (row) => (
        <span className="line-clamp-1 max-w-xs text-xs text-muted-foreground">
          {row.description || "—"}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Issued",
      sortKey: "createdAt",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <Receipt className="size-6 text-accent-brand" aria-hidden="true" />
            <span>Billing &amp; Tuition Invoices</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Generate semester tuition invoices and monitor payment statuses
            across students.
          </p>
        </div>

        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden="true" />
          Generate Invoice
        </Button>
      </div>

      {/* Invoices Table */}
      <DataTable
        columns={columns}
        data={invoices}
        getRowKey={(row) => row.id}
        sortBy={sortBy}
        order={order}
        onSortChange={toggleSort}
        meta={meta}
        onPageChange={setPage}
        onLimitChange={setLimit}
        emptyTitle="No invoices found"
        emptyDescription={
          hasFilters
            ? "No invoices match the selected filters."
            : "Generate a student semester invoice to get started."
        }
        emptyAction={
          hasFilters ? (
            <Button variant="outline" onClick={() => resetParams()}>
              Clear Filters
            </Button>
          ) : (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Generate Invoice
            </Button>
          )
        }
        toolbar={
          <div className="glass flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 p-4">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setParam("status", value === "all" ? null : value)
              }
            >
              <SelectTrigger
                className="w-full sm:w-44"
                aria-label="Filter by invoice status"
              >
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={semesterFilter}
              onValueChange={(value) =>
                setParam("semesterId", value === "all" ? null : value)
              }
            >
              <SelectTrigger
                className="w-full sm:w-64"
                aria-label="Filter by semester"
              >
                <SelectValue placeholder="All Semesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {semesters.map((semester) => (
                  <SelectItem key={semester.id} value={semester.id}>
                    {semester.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => resetParams()}
              >
                <X className="size-4" aria-hidden="true" />
                Clear
              </Button>
            ) : null}
          </div>
        }
      />

      <InvoiceCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        semesters={semesters}
        students={students}
      />
    </div>
  );
}
