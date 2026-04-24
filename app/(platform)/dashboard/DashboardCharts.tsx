"use client";

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

const REVENUE_DATA = [
  { month: "Oct", revenue: 42000, expenses: 18000 },
  { month: "Nov", revenue: 51000, expenses: 21000 },
  { month: "Dec", revenue: 38000, expenses: 19000 },
  { month: "Jan", revenue: 67000, expenses: 24000 },
  { month: "Feb", revenue: 74000, expenses: 26000 },
  { month: "Mar", revenue: 61000, expenses: 22000 },
  { month: "Apr", revenue: 83000, expenses: 28000 },
];

const AUDIT_DATA = [
  { month: "Oct", completed: 3, inProgress: 2 },
  { month: "Nov", completed: 5, inProgress: 3 },
  { month: "Dec", completed: 2, inProgress: 4 },
  { month: "Jan", completed: 6, inProgress: 2 },
  { month: "Feb", completed: 4, inProgress: 5 },
  { month: "Mar", completed: 7, inProgress: 3 },
  { month: "Apr", completed: 3, inProgress: 6 },
];

const TICK_STYLE = { fontSize: 11, fill: "hsl(215 16% 47%)" };
const GRID_STROKE = "rgba(255,255,255,0.04)";

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-navy-950 border border-white/10 rounded-xl px-4 py-3 shadow-xl text-xs min-w-[140px]">
      <p className="font-semibold text-white/60 mb-2 text-[10px] uppercase tracking-wider">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <span className="text-white/60">{p.name}</span>
          <span className="font-bold" style={{ color: p.color }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function AuditTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-navy-950 border border-white/10 rounded-xl px-4 py-3 shadow-xl text-xs min-w-[130px]">
      <p className="font-semibold text-white/60 mb-2 text-[10px] uppercase tracking-wider">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <span className="text-white/60">{p.name}</span>
          <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  orgId: string;
}

export function DashboardCharts({ orgId: _orgId }: Props) {
  return (
    <div className="space-y-5">
      {/* Revenue Chart */}
      <div className="section-card">
        <div className="section-card-header">
          <div>
            <h2 className="font-semibold text-sm text-foreground">Revenue vs Expenses</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Last 7 months</p>
          </div>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "#C9A84C" }} />
              Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              Expenses
            </span>
          </div>
        </div>
        <div className="h-52 px-5 pb-5 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={REVENUE_DATA} margin={{ top: 4, right: 0, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#C9A84C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="month" tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<RevenueTooltip />} cursor={{ stroke: "rgba(201,168,76,0.15)", strokeWidth: 1 }} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#C9A84C" strokeWidth={2} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4, fill: "#C9A84C", stroke: "transparent" }} />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f87171" strokeWidth={2} fill="url(#expenseGrad)" dot={false} activeDot={{ r: 4, fill: "#f87171", stroke: "transparent" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Audit velocity */}
      <div className="section-card">
        <div className="section-card-header">
          <div>
            <h2 className="font-semibold text-sm text-foreground">Audit Velocity</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Completed vs in-progress</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "#C9A84C" }} />
              In Progress
            </span>
          </div>
        </div>
        <div className="h-44 px-5 pb-5 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={AUDIT_DATA} margin={{ top: 4, right: 0, left: -20, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="month" tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <Tooltip content={<AuditTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="inProgress" name="In Progress" fill="#C9A84C" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
