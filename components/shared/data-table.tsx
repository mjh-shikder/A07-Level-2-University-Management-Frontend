"use client";

import type { ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
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
import type { SortOrder } from "@/hooks/use-url-state";
import { cn } from "@/lib/utils";
import type { TPaginationMeta } from "@/types/api";

export interface DataTableColumn<TData> {
  id: string;
  header: ReactNode;
  /** Backend `sortBy` field name. When provided, header becomes sortable. */
  sortKey?: string;
  cell: (row: TData) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

export interface DataTableProps<TData> {
  columns: DataTableColumn<TData>[];
  data: TData[];
  getRowKey: (row: TData) => string;
  isLoading?: boolean;
  skeletonRows?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  emptyAction?: ReactNode;
  sortBy?: string;
  order?: SortOrder;
  onSortChange?: (sortKey: string) => void;
  meta?: TPaginationMeta;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  pageSizeOptions?: number[];
  onRowClick?: (row: TData) => void;
  toolbar?: ReactNode;
  className?: string;
}

function SortIcon({
  active,
  order,
}: {
  active: boolean;
  order?: SortOrder;
}) {
  if (!active) {
    return <ArrowUpDown className="size-3.5 opacity-50" aria-hidden="true" />;
  }
  return order === "asc" ? (
    <ArrowUp className="size-3.5 text-primary" aria-hidden="true" />
  ) : (
    <ArrowDown className="size-3.5 text-primary" aria-hidden="true" />
  );
}

export function DataTable<TData>({
  columns,
  data,
  getRowKey,
  isLoading = false,
  skeletonRows = 5,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your search or filter criteria.",
  emptyIcon,
  emptyAction,
  sortBy,
  order = "desc",
  onSortChange,
  meta,
  onPageChange,
  onLimitChange,
  pageSizeOptions = [10, 20, 50],
  onRowClick,
  toolbar,
  className,
}: DataTableProps<TData>) {
  const showEmpty = !isLoading && data.length === 0;

  const startItem =
    meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0;
  const endItem =
    meta && meta.total > 0 ? Math.min(meta.page * meta.limit, meta.total) : 0;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {toolbar ? <div>{toolbar}</div> : null}

      {showEmpty ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon={emptyIcon}
          action={emptyAction}
        />
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columns.map((column) => {
                  const isSortable = Boolean(column.sortKey && onSortChange);
                  const isActiveSort = Boolean(
                    column.sortKey && sortBy === column.sortKey
                  );

                  return (
                    <TableHead
                      key={column.id}
                      className={column.headerClassName}
                      aria-sort={
                        isActiveSort
                          ? order === "asc"
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                    >
                      {isSortable && column.sortKey ? (
                        <button
                          type="button"
                          onClick={() => onSortChange?.(column.sortKey as string)}
                          className="inline-flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                        >
                          <span>{column.header}</span>
                          <SortIcon active={isActiveSort} order={order} />
                        </button>
                      ) : (
                        column.header
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading
                ? Array.from({ length: skeletonRows }, (_, idx) => `skeleton-${idx}`).map(
                    (rowKey) => (
                      <TableRow key={rowKey} className="hover:bg-transparent">
                        {columns.map((column) => (
                          <TableCell key={`${rowKey}-${column.id}`}>
                            <Skeleton className="h-4 w-full max-w-[160px]" />
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  )
                : data.map((row) => {
                    const rowKey = getRowKey(row);
                    return (
                      <TableRow
                        key={rowKey}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        className={onRowClick ? "cursor-pointer" : undefined}
                      >
                        {columns.map((column) => (
                          <TableCell
                            key={`${rowKey}-${column.id}`}
                            className={column.cellClassName}
                          >
                            {column.cell(row)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>

          {meta ? (
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {meta.total > 0 ? (
                  <>
                    Showing <span className="font-medium text-foreground">{startItem}</span>
                    –<span className="font-medium text-foreground">{endItem}</span> of{" "}
                    <span className="font-medium text-foreground">{meta.total}</span>{" "}
                    results
                  </>
                ) : (
                  "0 results"
                )}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                {onLimitChange ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Rows</span>
                    <Select
                      value={String(meta.limit)}
                      onValueChange={(value) => onLimitChange(Number(value))}
                    >
                      <SelectTrigger
                        size="sm"
                        className="w-[72px]"
                        aria-label="Rows per page"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {pageSizeOptions.map((size) => (
                          <SelectItem key={size} value={String(size)}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                {onPageChange ? (
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={isLoading || meta.page <= 1}
                      onClick={() => onPageChange(meta.page - 1)}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="size-4" aria-hidden="true" />
                    </Button>
                    <span className="min-w-[76px] text-center text-xs text-muted-foreground">
                      Page <span className="font-medium text-foreground">{meta.page}</span> of{" "}
                      <span className="font-medium text-foreground">
                        {Math.max(1, meta.totalPages)}
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={isLoading || meta.page >= meta.totalPages}
                      onClick={() => onPageChange(meta.page + 1)}
                      aria-label="Next page"
                    >
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
