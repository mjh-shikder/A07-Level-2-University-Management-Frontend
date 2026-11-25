"use client";

import { BarChart3, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/shared/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

export interface DepartmentDistributionPoint {
  department: string;
  departmentName: string;
  students: number;
}

export interface InvoiceTrendPoint {
  month: string;
  paid: number;
  pending: number;
}

export interface AdminDashboardChartsProps {
  departmentDistribution: DepartmentDistributionPoint[];
  invoiceTrends: InvoiceTrendPoint[];
  totalRevenue: number;
  totalInvoiced: number;
}

function DepartmentTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DepartmentDistributionPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/10 bg-[oklch(0.13_0_0/0.92)] px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
      <p className="font-semibold text-foreground">{item.departmentName}</p>
      <p className="mt-0.5 text-muted-foreground">
        Students:{" "}
        <span className="font-semibold text-primary tabular-nums">
          {item.students}
        </span>
      </p>
    </div>
  );
}

function InvoiceTrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[oklch(0.13_0_0/0.92)] px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
      <p className="font-semibold text-foreground">{label}</p>
      <div className="mt-1 space-y-0.5">
        {payload.map((entry) => (
          <p key={entry.name} className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold text-foreground tabular-nums">
              {formatCurrency(entry.value ?? 0)}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboardCharts({
  departmentDistribution,
  invoiceTrends,
  totalRevenue,
  totalInvoiced,
}: AdminDashboardChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Student Distribution per Department */}
      <Card className="glass rounded-2xl border-white/10">
        <CardHeader className="min-h-[76px] pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="size-4 text-primary" aria-hidden="true" />
                Students per Department
              </CardTitle>
              <CardDescription>
                Active student distribution across departments.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {departmentDistribution.length === 0 ? (
            <EmptyState
              title="No department enrollment data"
              description="Student counts will appear once students are assigned to department programs."
              className="border-0 bg-transparent py-10"
            />
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentDistribution}
                  margin={{ top: 10, right: 12, left: -12, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.08)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="department"
                    interval={0}
                    tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
                    tickFormatter={(val: string) =>
                      val.length > 10 ? `${val.slice(0, 9)}…` : val
                    }
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<DepartmentTooltip />}
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  />
                  <Bar
                    dataKey="students"
                    fill="#a3e635"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Payment Trends */}
      <Card className="glass rounded-2xl border-white/10">
        <CardHeader className="min-h-[76px] pb-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-4 text-primary" aria-hidden="true" />
                Invoice Payment Trends
              </CardTitle>
              <CardDescription>
                Monthly paid revenue vs pending tuition balances.
              </CardDescription>
            </div>
            <div className="text-right text-xs">
              <p className="text-muted-foreground">
                Collected:{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {formatCurrency(totalRevenue)}
                </span>
              </p>
              <p className="text-muted-foreground">
                Invoiced:{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {formatCurrency(totalInvoiced)}
                </span>
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {invoiceTrends.length === 0 ? (
            <EmptyState
              title="No invoice activity yet"
              description="Payment trends will appear once student tuition invoices are generated."
              className="border-0 bg-transparent py-10"
            />
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={invoiceTrends}
                  margin={{ top: 10, right: 12, left: 4, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a3e635" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.08)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val: number) => `$${val}`}
                  />
                  <Tooltip content={<InvoiceTrendTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="paid"
                    name="Paid"
                    stroke="#a3e635"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#a3e635", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                    fillOpacity={1}
                    fill="url(#paidGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="pending"
                    name="Pending"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                    fillOpacity={1}
                    fill="url(#pendingGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
