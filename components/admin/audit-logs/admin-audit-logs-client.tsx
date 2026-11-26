"use client";

import { useState } from "react";
import { Eye, ShieldCheck, X } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUrlState } from "@/hooks/use-url-state";
import { formatDate } from "@/lib/format";
import type { AuditLog, TPaginationMeta } from "@/types/api";

export interface AdminAuditLogsClientProps {
  logs: AuditLog[];
  meta: TPaginationMeta;
}

export function AdminAuditLogsClient({
  logs,
  meta,
}: AdminAuditLogsClientProps) {
  const { getParam, setParam, setPage, setLimit, resetParams } = useUrlState({
    defaultLimit: 20,
  });

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const entityFilter = getParam("entity", "");
  const actionFilter = getParam("action", "");
  const startDate = getParam("startDate", "");
  const endDate = getParam("endDate", "");

  const hasFilters = Boolean(
    entityFilter || actionFilter || startDate || endDate
  );

  const columns: DataTableColumn<AuditLog>[] = [
    {
      id: "createdAt",
      header: "Timestamp",
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {formatDate(row.createdAt, "MMM d, yyyy HH:mm")}
        </span>
      ),
    },
    {
      id: "actor",
      header: "Actor",
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-foreground">
            {row.actor
              ? `${row.actor.firstName} ${row.actor.lastName}`
              : "System"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {row.actor?.email ?? row.actorId}
          </p>
        </div>
      ),
    },
    {
      id: "action",
      header: "Action",
      cell: (row) => (
        <Badge variant="outline" className="font-mono text-[11px]">
          {row.action}
        </Badge>
      ),
    },
    {
      id: "entity",
      header: "Entity",
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-foreground">{row.entity}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            {row.entityId}
          </p>
        </div>
      ),
    },
    {
      id: "ip",
      header: "IP Address",
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.ip || "—"}
        </span>
      ),
    },
    {
      id: "diff",
      header: "Changes",
      cell: (row) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSelectedLog(row)}
        >
          <Eye className="size-3.5" aria-hidden="true" />
          View Diff
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          <ShieldCheck
            className="size-6 text-accent-brand"
            aria-hidden="true"
          />
          <span>System Audit Logs</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Chronological audit trail of administrative and academic mutations
          with before/after state snapshots.
        </p>
      </div>

      {/* Audit Logs Table */}
      <DataTable
        columns={columns}
        data={logs}
        getRowKey={(row) => row.id}
        meta={meta}
        onPageChange={setPage}
        onLimitChange={setLimit}
        emptyTitle="No audit logs found"
        emptyDescription={
          hasFilters
            ? "No audit events match your current filters."
            : "System activity will appear here as actions are performed."
        }
        emptyAction={
          hasFilters ? (
            <Button variant="outline" onClick={() => resetParams()}>
              Clear Filters
            </Button>
          ) : undefined
        }
        toolbar={
          <div className="glass grid grid-cols-1 gap-3 rounded-2xl border border-white/10 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Entity</Label>
              <SearchInput
                value={entityFilter}
                onValueChange={(val) => setParam("entity", val || null)}
                placeholder="e.g. Invoice, User, Section"
                ariaLabel="Filter by entity"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Action</Label>
              <SearchInput
                value={actionFilter}
                onValueChange={(val) => setParam("action", val || null)}
                placeholder="e.g. CREATE, UPDATE"
                ariaLabel="Filter by action"
              />
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="audit-startDate"
                className="text-xs text-muted-foreground"
              >
                Start Date
              </Label>
              <Input
                id="audit-startDate"
                type="date"
                value={startDate}
                onChange={(e) =>
                  setParam("startDate", e.target.value || null)
                }
              />
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="audit-endDate"
                className="text-xs text-muted-foreground"
              >
                End Date
              </Label>
              <Input
                id="audit-endDate"
                type="date"
                value={endDate}
                onChange={(e) => setParam("endDate", e.target.value || null)}
              />
            </div>

            <div className="flex items-end">
              {hasFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => resetParams()}
                  className="w-full sm:w-auto"
                >
                  <X className="size-4" aria-hidden="true" />
                  Clear Filters
                </Button>
              ) : null}
            </div>
          </div>
        }
      />

      {/* Before / After Diff Modal */}
      <Dialog
        open={Boolean(selectedLog)}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <span>Audit Event Snapshot</span>
              {selectedLog ? (
                <Badge variant="outline" className="font-mono text-xs">
                  {selectedLog.action} · {selectedLog.entity}
                </Badge>
              ) : null}
            </DialogTitle>
            <DialogDescription>
              {selectedLog
                ? `${formatDate(selectedLog.createdAt, "MMM d, yyyy HH:mm:ss")} · Actor: ${selectedLog.actor?.email ?? selectedLog.actorId}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedLog ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Before State
                </p>
                <pre className="max-h-80 overflow-auto rounded-xl border border-white/10 bg-background/60 p-3 font-mono text-xs text-muted-foreground">
                  {selectedLog.before
                    ? JSON.stringify(selectedLog.before, null, 2)
                    : "null (New record)"}
                </pre>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  After State
                </p>
                <pre className="max-h-80 overflow-auto rounded-xl border border-white/10 bg-background/60 p-3 font-mono text-xs text-foreground">
                  {selectedLog.after
                    ? JSON.stringify(selectedLog.after, null, 2)
                    : "null (Deleted / No payload)"}
                </pre>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
