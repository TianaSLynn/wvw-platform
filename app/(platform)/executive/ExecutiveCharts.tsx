"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#f59e0b",
  LOW: "#3b82f6",
  INFORMATIONAL: "#6b7280",
};

const TYPE_COLORS = ["#b8963e", "#1e3a5f", "#4b7c59", "#7c3aed", "#0891b2", "#db2777", "#ca8a04", "#16a34a"];

interface Props {
  velocityData: Array<{ month: string; completed: number; started: number }>;
  auditTypeData: Array<{ type: string; count: number }>;
  findingsSevData: Array<{ severity: string; count: number }>;
}

export default function ExecutiveCharts({ velocityData, auditTypeData, findingsSevData }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Audit Velocity */}
      <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
        <p className="text-sm font-semibold mb-4">Audit Velocity (6 months)</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={velocityData} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
              itemStyle={{ color: "var(--foreground)" }}
            />
            <Bar dataKey="started"   name="Started"   fill="#1e3a5f" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" name="Completed" fill="#b8963e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Open Findings by Severity */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <p className="text-sm font-semibold mb-4">Open Findings by Severity</p>
        {findingsSevData.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">No open findings</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={findingsSevData}
                dataKey="count"
                nameKey="severity"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {findingsSevData.map((entry, i) => (
                  <Cell key={i} fill={SEVERITY_COLORS[entry.severity] ?? "#6b7280"} />
                ))}
              </Pie>
              <Legend
                formatter={(value) => <span style={{ fontSize: 11 }}>{String(value).charAt(0) + String(value).slice(1).toLowerCase()}</span>}
              />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Audit Types Distribution */}
      <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-6">
        <p className="text-sm font-semibold mb-4">Audit Distribution by Type</p>
        {auditTypeData.length === 0 ? (
          <div className="flex items-center justify-center h-[120px] text-sm text-muted-foreground">No audits yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={auditTypeData} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="type" tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
              />
              <Bar dataKey="count" name="Audits" radius={[0, 4, 4, 0]}>
                {auditTypeData.map((_, i) => (
                  <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
