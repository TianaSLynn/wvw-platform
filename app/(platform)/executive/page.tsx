import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import ExecutiveCharts from "./ExecutiveCharts";
import { formatCurrency, riskScoreLabel, riskScoreColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { TrendingUp, Users, FileSearch, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export const metadata: Metadata = { title: "Executive Dashboard" };

export default async function ExecutivePage() {
  const user = await requireUser();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo  = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const startOfYear   = new Date(now.getFullYear(), 0, 1);

  const [
    clients,
    audits,
    findings,
    invoicesYTD,
    paymentsYTD,
    recentActivity,
    auditsByType,
    findingsBySeverity,
  ] = await Promise.all([
    db.client.findMany({
      where: { orgId: user.orgId, isActive: true, deletedAt: null },
      select: {
        id: true, name: true, industry: true,
        audits: {
          where: { status: { in: ["FIELDWORK", "REVIEW", "PLANNING"] } },
          select: { id: true, overallRiskScore: true },
        },
        invoices: {
          where: { status: { in: ["SENT", "OVERDUE"] } },
          select: { total: true, status: true },
        },
      },
    }),
    db.audit.findMany({
      where: { orgId: user.orgId },
      select: {
        id: true, status: true, type: true, overallRiskScore: true,
        createdAt: true, updatedAt: true,
        fieldworkStartDate: true, fieldworkEndDate: true,
      },
    }),
    db.auditFinding.findMany({
      where: { audit: { orgId: user.orgId }, status: { in: ["OPEN", "IN_PROGRESS", "REOPENED"] } },
      select: { id: true, severity: true, riskScore: true, createdAt: true },
    }),
    db.invoice.aggregate({
      where: { orgId: user.orgId, status: { in: ["SENT", "PAID", "OVERDUE"] }, createdAt: { gte: startOfYear } },
      _sum: { total: true },
    }),
    db.payment.aggregate({
      where: { invoice: { orgId: user.orgId, createdAt: { gte: startOfYear } } },
      _sum: { amount: true },
    }),
    db.activityLog.findMany({
      where: { orgId: user.orgId, timestamp: { gte: thirtyDaysAgo } },
      select: { action: true, entityLabel: true, timestamp: true, userId: true },
      orderBy: { timestamp: "desc" },
      take: 20,
    }),
    db.audit.groupBy({
      by: ["type"],
      where: { orgId: user.orgId },
      _count: { id: true },
    }),
    db.auditFinding.groupBy({
      by: ["severity"],
      where: { audit: { orgId: user.orgId }, status: { in: ["OPEN", "IN_PROGRESS"] } },
      _count: { id: true },
    }),
  ]);

  // KPIs
  const totalRevenue     = Number(invoicesYTD._sum.total ?? 0);
  const totalCollected   = Number(paymentsYTD._sum.amount ?? 0);
  const activeAudits     = audits.filter((a) => ["FIELDWORK", "REVIEW", "PLANNING"].includes(a.status)).length;
  const completedAudits  = audits.filter((a) => a.status === "COMPLETED").length;
  const openFindingsCount = findings.length;
  const criticalCount    = findings.filter((f) => f.severity === "CRITICAL").length;

  // Client health matrix
  const clientHealth = clients.map((c) => {
    const openBalance  = c.invoices.filter((i) => i.status !== "PAID").reduce((s, i) => s + Number(i.total), 0);
    const overdueCount = c.invoices.filter((i) => i.status === "OVERDUE").length;
    const activeAuditRiskScores = c.audits.map((a) => a.overallRiskScore ?? 0);
    const avgRisk = activeAuditRiskScores.length ? Math.round(activeAuditRiskScores.reduce((a, b) => a + b, 0) / activeAuditRiskScores.length) : 0;
    return {
      id: c.id, name: c.name, industry: c.industry,
      activeAudits: c.audits.length, openBalance, overdueCount, avgRisk,
      healthScore: Math.max(0, 100 - avgRisk - overdueCount * 15),
    };
  }).sort((a, b) => a.healthScore - b.healthScore);

  // Audit velocity (completions per month, last 6 months)
  const velocityData: Array<{ month: string; completed: number; started: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextD = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    velocityData.push({
      month: d.toLocaleString("en-US", { month: "short" }),
      completed: audits.filter((a) => a.updatedAt >= d && a.updatedAt < nextD && a.status === "COMPLETED").length,
      started: audits.filter((a) => a.createdAt >= d && a.createdAt < nextD).length,
    });
  }

  const auditTypeData = auditsByType.map((t) => ({ type: t.type, count: t._count?.id ?? 0 }));
  const findingsSevData = findingsBySeverity.map((f) => ({ severity: f.severity, count: f._count?.id ?? 0 }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Org-wide KPIs, client health, and audit performance</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {[
          {
            label: "YTD Revenue",
            value: formatCurrency(totalRevenue),
            sub: `${formatCurrency(totalCollected)} collected`,
            icon: TrendingUp, iconColor: "text-green-500",
            iconBg: "bg-green-500/10 border-green-500/20",
          },
          {
            label: "Active Clients",
            value: clients.length,
            sub: `${completedAudits} audits completed`,
            icon: Users, iconColor: "text-blue-500",
            iconBg: "bg-blue-500/10 border-blue-500/20",
          },
          {
            label: "Active Audits",
            value: activeAudits,
            sub: `${audits.length} total`,
            icon: FileSearch, iconColor: "text-gold",
            iconBg: "bg-gold/10 border-gold/20",
          },
          {
            label: "Open Findings",
            value: openFindingsCount,
            sub: `${criticalCount} critical`,
            icon: criticalCount > 0 ? AlertTriangle : CheckCircle,
            iconColor: criticalCount > 0 ? "text-red-500" : "text-green-500",
            iconBg: criticalCount > 0 ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20",
          },
        ].map(({ label, value, sub, icon: Icon, iconColor, iconBg }) => (
          <div key={label} className="stat-card group">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest">{label}</p>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 transition-all group-hover:scale-105", iconBg)}>
                <Icon size={18} className={iconColor} />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground tabular-nums leading-none">{value}</p>
            <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <ExecutiveCharts
        velocityData={velocityData}
        auditTypeData={auditTypeData}
        findingsSevData={findingsSevData}
      />

      {/* Client Health Matrix */}
      <div className="section-card">
        <div className="section-card-header">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-gold" />
            <h2 className="font-semibold text-sm">Client Health Matrix</h2>
          </div>
        </div>
        {clientHealth.length === 0 ? (
          <div className="empty-state py-8">
            <p className="text-sm text-muted-foreground">No active clients</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  {["Client", "Industry", "Audits", "Risk", "Open Balance", "Overdue", "Health"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientHealth.map((c) => (
                  <tr key={c.id}>
                    <td className="font-semibold">{c.name}</td>
                    <td className="text-muted-foreground text-xs">{c.industry ?? "—"}</td>
                    <td className="text-center text-muted-foreground">{c.activeAudits}</td>
                    <td>
                      {c.avgRisk > 0 ? (
                        <span className={cn("text-xs font-semibold", riskScoreColor(c.avgRisk))}>
                          {c.avgRisk} · {riskScoreLabel(c.avgRisk)}
                        </span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="text-right tabular-lining">{formatCurrency(c.openBalance)}</td>
                    <td className="text-center">
                      {c.overdueCount > 0 ? (
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full text-xs font-bold">
                          {c.overdueCount}
                        </span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", c.healthScore >= 70 ? "bg-green-500" : c.healthScore >= 40 ? "bg-amber-500" : "bg-red-500")}
                            style={{ width: `${c.healthScore}%` }}
                          />
                        </div>
                        <span className={cn("text-xs font-bold w-7 text-right", c.healthScore >= 70 ? "text-green-500" : c.healthScore >= 40 ? "text-amber-500" : "text-red-500")}>
                          {c.healthScore}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="section-card">
        <div className="section-card-header">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-muted-foreground" />
            <h2 className="font-semibold text-sm">Recent Activity (30 days)</h2>
          </div>
        </div>
        <div className="p-5">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-0.5">
              {recentActivity.slice(0, 12).map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold/50 flex-shrink-0" />
                  <p className="text-sm text-foreground flex-1 truncate">{a.entityLabel ?? a.action.replace(/\./g, " → ")}</p>
                  <p className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(a.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
