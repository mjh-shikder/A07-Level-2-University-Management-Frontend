import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  DollarSign,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  AdminDashboardCharts,
  type DepartmentDistributionPoint,
  type InvoiceTrendPoint,
} from "@/components/admin/admin-dashboard-charts";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { serverApiFetch } from "@/lib/api-server";
import { formatCurrency, formatDate, normalizeDecimal } from "@/lib/format";
import type {
  AuditLog,
  DashboardStats,
  Department,
  Invoice,
  Program,
  UserSummary,
} from "@/types/api";

function buildDepartmentDistribution(
  departments: Department[],
  programs: Program[],
  students: UserSummary[]
): DepartmentDistributionPoint[] {
  const deptById = new Map<string, Department>();
  for (const dept of departments) {
    deptById.set(dept.id, dept);
  }

  const programToDept = new Map<string, Department>();
  for (const program of programs) {
    if (program.department) {
      programToDept.set(program.id, program.department);
    } else if (deptById.has(program.departmentId)) {
      const dept = deptById.get(program.departmentId);
      if (dept) programToDept.set(program.id, dept);
    }
  }

  const counts = new Map<string, DepartmentDistributionPoint>();
  for (const dept of departments) {
    counts.set(dept.id, {
      department: dept.code,
      departmentName: dept.name,
      students: 0,
    });
  }

  for (const student of students) {
    const programId = student.studentProfile?.program?.id;
    if (!programId) continue;
    const dept = programToDept.get(programId);
    if (!dept) continue;

    const existing = counts.get(dept.id) ?? {
      department: dept.code,
      departmentName: dept.name,
      students: 0,
    };
    existing.students += 1;
    counts.set(dept.id, existing);
  }

  return Array.from(counts.values());
}

function buildInvoiceTrends(invoices: Invoice[]): InvoiceTrendPoint[] {
  const byMonth = new Map<string, InvoiceTrendPoint>();

  for (const invoice of invoices) {
    const monthLabel = formatDate(invoice.createdAt, "MMM yyyy");
    if (monthLabel === "—") continue;

    const entry = byMonth.get(monthLabel) ?? {
      month: monthLabel,
      paid: 0,
      pending: 0,
    };

    const amount = normalizeDecimal(invoice.amount, 0);
    if (invoice.status === "PAID") {
      entry.paid += amount;
    } else if (invoice.status === "PENDING" || invoice.status === "OVERDUE") {
      entry.pending += amount;
    }

    byMonth.set(monthLabel, entry);
  }

  return Array.from(byMonth.values());
}

export async function AdminDashboardContent() {
  const stats = await serverApiFetch<DashboardStats>("/admin/dashboard");

  const [studentsRes, programsRes, departmentsRes, invoicesRes, auditLogsRes] =
    await Promise.allSettled([
      serverApiFetch<UserSummary[]>("/admin/users", {
        params: { role: "STUDENT", limit: 100 },
      }),
      serverApiFetch<Program[]>("/programs", {
        params: { limit: 100 },
      }),
      serverApiFetch<Department[]>("/departments", {
        params: { limit: 50 },
      }),
      serverApiFetch<Invoice[]>("/invoices", {
        params: { limit: 100, sortBy: "createdAt", order: "asc" },
      }),
      serverApiFetch<AuditLog[]>("/admin/audit-logs", {
        params: { limit: 5, sortBy: "createdAt", order: "desc" },
      }),
    ]);

  const students =
    studentsRes.status === "fulfilled" ? studentsRes.value : [];
  const programs =
    programsRes.status === "fulfilled" ? programsRes.value : [];
  const departments =
    departmentsRes.status === "fulfilled" ? departmentsRes.value : [];
  const invoices =
    invoicesRes.status === "fulfilled" ? invoicesRes.value : [];
  const recentAuditLogs =
    stats.recentAuditLogs && stats.recentAuditLogs.length > 0
      ? stats.recentAuditLogs
      : auditLogsRes.status === "fulfilled"
        ? auditLogsRes.value
        : [];

  const departmentDistribution = buildDepartmentDistribution(
    departments,
    programs,
    students
  );
  const paidInvoicesCount =
    typeof stats.financials.paidInvoicesCount === "number"
      ? stats.financials.paidInvoicesCount
      : invoices.filter((inv) => inv.status === "PAID").length;
  const pendingInvoicesCount =
    typeof stats.financials.pendingInvoicesCount === "number"
      ? stats.financials.pendingInvoicesCount
      : invoices.filter(
          (inv) => inv.status === "PENDING" || inv.status === "OVERDUE"
        ).length;

  const nonZeroDepartmentDistribution = departmentDistribution.filter(
    (d) => d.students > 0
  );
  const chartDepartmentDistribution =
    nonZeroDepartmentDistribution.length > 0
      ? nonZeroDepartmentDistribution.sort((a, b) => b.students - a.students)
      : departmentDistribution.slice(0, 8);

  const invoiceTrends = buildInvoiceTrends(invoices);
  const activeSemester = stats.academics.activeSemester;

  return (
    <div className="flex flex-col gap-6">
      {/* Header + Active Semester Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <LayoutDashboard className="size-6 text-accent-brand" aria-hidden="true" />
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            University-wide enrollment, academic catalog, and financial overview.
          </p>
        </div>

        <div className="glass flex items-center gap-3 rounded-2xl border-white/10 px-4 py-2.5">
          <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden="true" />
          {activeSemester ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground">
                {activeSemester.name}
              </span>
              <StatusBadge status="ACTIVE" />
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              No active semester configured
            </span>
          )}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.users.total}
          subtitle={`${stats.users.byRole.STUDENT} students · ${stats.users.byRole.INSTRUCTOR} faculty · ${stats.users.byRole.ADMIN} admin`}
          icon={Users}
          badge={
            <StatusBadge
              status="ACTIVE"
              label={`${stats.users.byStatus.ACTIVE} active`}
            />
          }
        />

        <StatCard
          title="Active Courses"
          value={stats.academics.coursesCount}
          subtitle={`${stats.academics.programsCount} programs across ${stats.academics.departmentsCount} depts`}
          icon={BookOpen}
        />

        <StatCard
          title="Active Enrollments"
          value={stats.enrollments.totalActiveEnrollments}
          subtitle={`${stats.enrollments.activeSemesterEnrollments} in current semester`}
          icon={GraduationCap}
        />

        <StatCard
          title="Tuition Revenue"
          value={formatCurrency(stats.financials.totalRevenue)}
          subtitle={`${formatCurrency(stats.financials.totalInvoiced)} invoiced · ${paidInvoicesCount} paid`}
          icon={DollarSign}
          badge={
            pendingInvoicesCount > 0 ? (
              <StatusBadge
                status="PENDING"
                label={`${pendingInvoicesCount} pending`}
              />
            ) : undefined
          }
        />
      </div>

      {/* Recharts Visualizations */}
      <AdminDashboardCharts
        departmentDistribution={chartDepartmentDistribution}
        invoiceTrends={invoiceTrends}
        totalRevenue={normalizeDecimal(stats.financials.totalRevenue, 0)}
        totalInvoiced={normalizeDecimal(stats.financials.totalInvoiced, 0)}
      />

      {/* Recent Audit Activity */}
      <Card className="glass rounded-2xl border-white/10">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              Recent Audit Activity
            </CardTitle>
            <CardDescription>
              Latest administrative mutations recorded across the platform.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/audit-logs">
              View all
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </CardHeader>

        <CardContent>
          {recentAuditLogs.length === 0 ? (
            <EmptyState
              title="No audit events recorded yet"
              description="System actions such as role changes, semester transitions, and invoices will appear here."
              className="border-0 bg-transparent py-8"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAuditLogs.slice(0, 5).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(log.createdAt, "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="max-w-[240px] whitespace-normal">
                      {log.actor ? (
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {log.actor.firstName} {log.actor.lastName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {log.actor.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {log.actorId}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status="ACTIVE" label={log.action} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.entity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
