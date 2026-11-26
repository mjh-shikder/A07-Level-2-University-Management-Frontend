"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  GraduationCap,
  Printer,
  Users,
  X,
} from "lucide-react";

import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUrlState } from "@/hooks/use-url-state";
import { formatDate } from "@/lib/format";
import type { Enrollment, Section, TPaginationMeta } from "@/types/api";

export interface RosterEnrollment extends Enrollment {
  student?: NonNullable<Enrollment["student"]> & {
    program?: {
      id: string;
      name: string;
      code: string;
    } | null;
  };
}

export interface SectionRosterClientProps {
  section: Section;
  enrollments: RosterEnrollment[];
  meta?: TPaginationMeta;
}

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function SectionRosterClient({
  section,
  enrollments,
  meta,
}: SectionRosterClientProps) {
  const {
    q,
    sortBy,
    order,
    getParam,
    setParam,
    setPage,
    setLimit,
    setSearch,
    toggleSort,
    resetParams,
  } = useUrlState({
    defaultLimit: 20,
    defaultSortBy: "enrolledAt",
    defaultOrder: "desc",
  });

  const statusFilter = getParam("status", "all");
  const hasFilters = Boolean(q || (statusFilter && statusFilter !== "all"));

  const filteredEnrollments = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return enrollments;

    return enrollments.filter((item) => {
      const studentId = item.student?.studentId?.toLowerCase() ?? "";
      const first = item.student?.user?.firstName?.toLowerCase() ?? "";
      const last = item.student?.user?.lastName?.toLowerCase() ?? "";
      const fullName = `${first} ${last}`.trim();
      const email = item.student?.user?.email?.toLowerCase() ?? "";
      const programCode = item.student?.program?.code?.toLowerCase() ?? "";
      const programName = item.student?.program?.name?.toLowerCase() ?? "";

      return (
        studentId.includes(query) ||
        fullName.includes(query) ||
        email.includes(query) ||
        programCode.includes(query) ||
        programName.includes(query)
      );
    });
  }, [enrollments, q]);

  function handleExportCsv() {
    const headers = [
      "Student ID",
      "Full Name",
      "Email",
      "Program",
      "Status",
      "Enrolled At",
    ];
    const rows = filteredEnrollments.map((row) => {
      const fullName = row.student
        ? `${row.student.user.firstName} ${row.student.user.lastName}`
        : "Unknown";
      const program = row.student?.program
        ? `${row.student.program.code} - ${row.student.program.name}`
        : "N/A";
      return [
        escapeCsvCell(row.student?.studentId ?? ""),
        escapeCsvCell(fullName),
        escapeCsvCell(row.student?.user?.email ?? ""),
        escapeCsvCell(program),
        escapeCsvCell(row.status),
        escapeCsvCell(formatDate(row.enrolledAt)),
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const code = section.course?.code ?? "section";
    link.href = url;
    link.download = `roster-${code}-sec-${section.sectionNumber}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const columns: DataTableColumn<RosterEnrollment>[] = [
    {
      id: "studentId",
      header: "Student ID",
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {row.student?.studentId ?? "—"}
        </span>
      ),
    },
    {
      id: "name",
      header: "Student Name",
      cell: (row) =>
        row.student ? (
          <div className="min-w-0 max-w-[240px] whitespace-normal">
            <p className="truncate font-medium text-foreground">
              {row.student.user.firstName} {row.student.user.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {row.student.user.email}
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      id: "program",
      header: "Program",
      cell: (row) =>
        row.student?.program ? (
          <div className="text-xs">
            <p className="font-medium text-foreground">
              {row.student.program.code}
            </p>
            <p className="max-w-[200px] truncate text-muted-foreground">
              {row.student.program.name}
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      id: "status",
      header: "Status",
      sortKey: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "enrolledAt",
      header: "Enrolled",
      sortKey: "enrolledAt",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.enrolledAt)}
        </span>
      ),
    },
  ];

  const toolbar = (
    <div className="glass flex flex-col gap-3 rounded-2xl border-white/10 p-4 lg:flex-row lg:items-center print:hidden">
      <SearchInput
        value={q}
        onValueChange={setSearch}
        placeholder="Search roster by STU ID, name, email, or program..."
        ariaLabel="Search student roster"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setParam("status", value === "all" ? null : value)
          }
        >
          <SelectTrigger
            className="w-full sm:w-44"
            aria-label="Filter by enrollment status"
          >
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ENROLLED">Enrolled</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="DROPPED">Dropped</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => resetParams(["q", "status", "page"])}
          >
            <X className="size-4" aria-hidden="true" />
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Top Navigation + Export Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button variant="outline" size="sm" asChild>
              <Link href="/instructor">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to Sections
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/instructor/sections/${section.id}/attendance`}>
                <ClipboardCheck className="size-4" aria-hidden="true" />
                Attendance
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/instructor/sections/${section.id}/exams`}>
                <FileSpreadsheet className="size-4" aria-hidden="true" />
                Exams
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/instructor/sections/${section.id}/results`}>
                <GraduationCap className="size-4" aria-hidden="true" />
                Gradebook
              </Link>
            </Button>
          </div>

          <h1 className="flex flex-wrap items-center gap-2 pt-1 text-2xl font-bold tracking-tight text-foreground">
            <Users className="size-6 text-accent-brand" aria-hidden="true" />
            <span>
              {section.course?.code ?? "Course"} · Sec {section.sectionNumber}{" "}
              Roster
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {section.course?.title}
            {section.semester ? ` · ${section.semester.name}` : ""} ·{" "}
            {section.enrolledCount} / {section.capacity} seats filled
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Badge variant="outline" className="px-3 py-1.5 text-xs tabular-nums">
            {filteredEnrollments.length} shown
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredEnrollments.length === 0}
          >
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => window.print()}
            disabled={filteredEnrollments.length === 0}
          >
            <Printer className="size-4" aria-hidden="true" />
            Print Roster
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredEnrollments}
        getRowKey={(row) => row.id}
        toolbar={toolbar}
        sortBy={sortBy}
        order={order}
        onSortChange={toggleSort}
        meta={q ? undefined : meta}
        onPageChange={setPage}
        onLimitChange={setLimit}
        emptyTitle="No students in roster"
        emptyDescription={
          hasFilters
            ? "No students match your current search or enrollment status filter."
            : "No students have enrolled in this section yet."
        }
        emptyAction={
          hasFilters ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => resetParams(["q", "status", "page"])}
            >
              Reset filters
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
