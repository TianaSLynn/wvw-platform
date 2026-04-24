import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import FinancialsCharts from "./FinancialsCharts";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { DollarSign, TrendingUp, TrendingDown, Clock, AlertCircle, CheckCircle } from "lucide-react";

export const metadata: Metadata = { title: "Financial Intelligence" };

export default async function FinancialsPage() {
  const user = await requireUser();

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [invoices, timeEntries, expenses] = await Promise.all([
    db.invoice.findMany({
      where: { orgId: user.orgId },
      select: {
        id: true, invoiceNumber: true, status: true, total: true,
        subtotal: true, taxAmount: true, dueDate: true, paidDate: true, createdAt: true,
        client: { select: { name: true } },
        payments: { select: { amount: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.timeEntry.findMany({
      where: { orgId: user.orgId, createdAt: { gte: startOfYear } },
      select: { hours: true, billableRate: true, isBillable: true, createdAt: true },
    }),
    db.expense.findMany({
      where: { orgId: user.orgId, createdAt: { gte: startOfYear } },
      select: { amount: true, category: true, createdAt: true, isBillable: true },
    }),
  ]);

  // Revenue metrics
  const paidAmt = (inv: { payments: Array<{ amount: number }> }) =>
    inv.payments.reduce((s, p) => s + Number(p.amount), 0);
  const ytdInvoices      = invoices.filter((i) => i.createdAt >= startOfYear);
  const totalBilled      = ytdInvoices.reduce((s, i) => s + Number(i.total), 0);
  const totalCollected   = ytdInvoices.filter((i) => i.status === "PAID").reduce((s, i) => s + paidAmt(i), 0);
  const outstanding      = invoices.filter((i) => i.status === "SENT").reduce((s, i) => s + Number(i.total) - paidAmt(i), 0);
  const overdue          = invoices.filter((i) => i.status === "OVERDUE").reduce((s, i) => s + Number(i.total) - paidAmt(i), 0);

  // Utilization
  const billableHours    = timeEntries.filter((t) => t.isBillable).reduce((s, t) => s + Number(t.hours), 0);
  const totalHours       = timeEntries.reduce((s, t) => s + Number(t.hours), 0);
  const utilization      = totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0;
  const billableRevenue  = timeEntries.filter((t) => t.isBillable).reduce((s, t) => s + Number(t.hours) * Number(t.billableRate ?? 0), 0);

  // Expenses
  const totalExpenses    = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const billableExpenses = expenses.filter((e) => e.isBillable).reduce((s, e) => s + Number(e.amount), 0);

  // Monthly revenue trend (last 6 months)
  const monthlyTrend: Array<{ month: string; billed: number; collected: number; expenses: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextD = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    monthlyTrend.push({
      month:     d.toLocaleString("en-US", { month: "short" }),
      billed:    invoices.filter((inv) => inv.createdAt >= d && inv.createdAt < nextD).reduce((s, i) => s + Number(i.total), 0),
      collected: invoices.filter((inv) => inv.paidDate && new Date(inv.paidDate) >= d && new Date(inv.paidDate) < nextD).reduce((s, i) => s + paidAmt(i), 0),
      expenses:  expenses.filter((e) => e.createdAt >= d && e.createdAt < nextD).reduce((s, e) => s + Number(e.amount), 0),
    });
  }

  // AR Aging
  const arAging = {
    current:  invoices.filter((i) => i.status === "SENT" && i.dueDate && new Date(i.dueDate) >= now).reduce((s, i) => s + Number(i.total) - paidAmt(i), 0),
    past30:   invoices.filter((i) => i.status === "OVERDUE" && i.dueDate && dateDiffDays(now, new Date(i.dueDate)) <= 30).reduce((s, i) => s + Number(i.total) - paidAmt(i), 0),
    past60:   invoices.filter((i) => i.status === "OVERDUE" && i.dueDate && dateDiffDays(now, new Date(i.dueDate)) > 30 && dateDiffDays(now, new Date(i.dueDate)) <= 60).reduce((s, i) => s + Number(i.total) - paidAmt(i), 0),
    past90:   invoices.filter((i) => i.status === "OVERDUE" && i.dueDate && dateDiffDays(now, new Date(i.dueDate)) > 60).reduce((s, i) => s + Number(i.total) - paidAmt(i), 0),
  };

  // Expense categories
  const expenseByCategory: Record<string, number> = {};
  for (const e of expenses) {
    expenseByCategory[e.category ?? "Other"] = (expenseByCategory[e.category ?? "Other"] ?? 0) + Number(e.amount);
  }
  const expenseCategoryData = Object.entries(expenseByCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Recent invoices for table
  const recentInvoices = invoices.slice(0, 10);

  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Financial Intelligence</h1>
        <p className="text-muted-foreground text-sm mt-1">Revenue, utilization, AR aging, and expense analysis</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "YTD Billed",
            value: formatCurrency(totalBilled),
            sub: `${collectionRate}% collection rate`,
            icon: DollarSign, iconBg: "bg-green-50 dark:bg-green-950/20", iconColor: "text-green-600",
          },
          {
            label: "Outstanding AR",
            value: formatCurrency(outstanding),
            sub: formatCurrency(overdue) + " overdue",
            icon: overdue > 0 ? AlertCircle : CheckCircle,
            iconBg: overdue > 0 ? "bg-red-50 dark:bg-red-950/20" : "bg-green-50 dark:bg-green-950/20",
            iconColor: overdue > 0 ? "text-red-600" : "text-green-600",
          },
          {
            label: "Billable Utilization",
            value: `${utilization}%`,
            sub: `${billableHours.toFixed(1)}h of ${totalHours.toFixed(1)}h`,
            icon: TrendingUp, iconBg: "bg-blue-50 dark:bg-blue-950/20", iconColor: "text-blue-600",
          },
          {
            label: "YTD Expenses",
            value: formatCurrency(totalExpenses),
            sub: `${formatCurrency(billableExpenses)} billable`,
            icon: TrendingDown, iconBg: "bg-orange-50 dark:bg-orange-950/20", iconColor: "text-orange-600",
          },
        ].map(({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5 shadow-card">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconBg)}>
                <Icon size={15} className={iconColor} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <FinancialsCharts
        monthlyTrend={monthlyTrend}
        arAging={arAging}
        expenseCategoryData={expenseCategoryData}
      />

      {/* Billable revenue card */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Billable Revenue (time)", value: formatCurrency(billableRevenue), sub: `${billableHours.toFixed(1)}h billed` },
          { label: "Avg Invoice Size",        value: ytdInvoices.length > 0 ? formatCurrency(totalBilled / ytdInvoices.length) : "—", sub: `${ytdInvoices.length} invoices YTD` },
          { label: "Net Margin (est.)",       value: totalBilled > 0 ? `${Math.round(((totalBilled - totalExpenses) / totalBilled) * 100)}%` : "—", sub: formatCurrency(totalBilled - totalExpenses) + " net" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Recent Invoices */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Clock size={16} className="text-gold" /> Recent Invoices
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Invoice #", "Client", "Amount", "Paid", "Status", "Due Date"].map((h) => (
                  <th key={h} className={cn("py-2 px-3 text-xs text-muted-foreground font-medium", h === "Amount" || h === "Paid" ? "text-right" : "text-left")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{inv.invoiceNumber}</td>
                  <td className="py-2.5 px-3 font-medium">{inv.client.name}</td>
                  <td className="py-2.5 px-3 text-right">{formatCurrency(Number(inv.total))}</td>
                  <td className="py-2.5 px-3 text-right">{inv.payments.length > 0 ? formatCurrency(paidAmt(inv)) : "—"}</td>
                  <td className="py-2.5 px-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium border",
                      inv.status === "PAID"    ? "bg-green-50 dark:bg-green-950/30 text-green-600 border-green-200 dark:border-green-800" :
                      inv.status === "OVERDUE" ? "bg-red-50 dark:bg-red-950/30 text-red-600 border-red-200 dark:border-red-800" :
                      inv.status === "SENT"    ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 border-blue-200 dark:border-blue-800" :
                      "bg-muted text-muted-foreground border-border"
                    )}>
                      {inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground text-xs">
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function dateDiffDays(a: Date, b: Date) {
  return Math.abs(Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24)));
}
