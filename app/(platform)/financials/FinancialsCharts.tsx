"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface Props {
  monthlyTrend: Array<{ month: string; billed: number; collected: number; expenses: number }>;
  arAging: { current: number; past30: number; past60: number; past90: number };
  expenseCategoryData: Array<{ category: string; amount: number }>;
}

const AR_COLORS = ["#3b82f6", "#f59e0b", "#f97316", "#ef4444"];
const EXP_COLORS = ["#b8963e", "#1e3a5f", "#4b7c59", "#7c3aed", "#0891b2", "#db2777", "#ca8a04", "#16a34a"];

export default function FinancialsCharts({ monthlyTrend, arAging, expenseCategoryData }: Props) {
  const arData = [
    { bucket: "Current",    amount: arAging.current },
    { bucket: "1–30 days",  amount: arAging.past30 },
    { bucket: "31–60 days", amount: arAging.past60 },
    { bucket: "60+ days",   amount: arAging.past90 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Revenue Trend */}
      <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
        <p className="text-sm font-semibold mb-4">Revenue Trend (6 months)</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyTrend}>
            <defs>
              <linearGradient id="billedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#b8963e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#b8963e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
              formatter={(v: number) => formatCurrency(v)}
            />
            <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{String(v)}</span>} />
            <Area type="monotone" dataKey="billed"    name="Billed"    stroke="#b8963e" fill="url(#billedGrad)"    strokeWidth={2} />
            <Area type="monotone" dataKey="collected" name="Collected" stroke="#1e3a5f" fill="url(#collectedGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="expenses"  name="Expenses"  stroke="#ef4444" fill="none"                strokeWidth={1.5} strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* AR Aging */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <p className="text-sm font-semibold mb-4">AR Aging</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={arData} layout="vertical" barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="bucket" tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }} axisLine={false} tickLine={false} width={70} />
            <Tooltip
              contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
              formatter={(v: number) => formatCurrency(v)}
            />
            <Bar dataKey="amount" name="Outstanding" radius={[0, 4, 4, 0]}>
              {arData.map((_, i) => <Cell key={i} fill={AR_COLORS[i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Expense breakdown */}
      {expenseCategoryData.length > 0 && (
        <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-6">
          <p className="text-sm font-semibold mb-4">Expense Breakdown by Category (YTD)</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={expenseCategoryData} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }} axisLine={false} tickLine={false} width={130} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Bar dataKey="amount" name="Amount" radius={[0, 4, 4, 0]}>
                {expenseCategoryData.map((_, i) => <Cell key={i} fill={EXP_COLORS[i % EXP_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
