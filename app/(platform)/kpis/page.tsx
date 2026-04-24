import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { BarChart3, TrendingUp, TrendingDown, Minus, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "KPI Library" };

// ─── KPI definitions (formula + target stay static; actuals computed from DB) ─

type KPI = {
  id: string;
  name: string;
  category: string;
  description: string;
  formula: string;
  target: string;
  actual: string | null;   // computed from DB — null = no data yet
  trend: "up" | "down" | "neutral" | null;
  unit: string;
  isGood: boolean | null;  // true = actual meets/beats target
};

const CATEGORIES = ["All", "Financial", "Operational", "Audit Quality", "Client Satisfaction"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Financial: "bg-green-500/10 text-green-500 border-green-500/20",
  Operational: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "Audit Quality": "bg-purple-500/10 text-purple-500 border-purple-500/20",
  "Client Satisfaction": "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

export default async function KPIsPage() {
  const user = await requireUser();

  // ── Compute actuals from real DB data ──────────────────────────────────────

  const now = new Date();
  void now; // used for future date calculations

  const [
    invoiceTotals,
    paidTotals,
    activeClients,
    totalAudits,
    completedAudits,
    openFindings,
    criticalFindings,
    totalFindings,
    closedFindings,
    totalChecklistItems,
    itemsWithEvidence,
    surveyCount,
    completedAuditDates,
  ] = await Promise.all([
    // Revenue
    db.invoice.aggregate({ _sum: { total: true }, where: { orgId: user.orgId } }),
    db.invoice.aggregate({ _sum: { total: true }, where: { orgId: user.orgId, status: "PAID" } }),

    // Active clients
    db.client.count({ where: { orgId: user.orgId, isActive: true, deletedAt: null } }),

    // Audits
    db.audit.count({ where: { orgId: user.orgId } }),
    db.audit.count({ where: { orgId: user.orgId, status: "COMPLETED" } }),

    // Findings
    db.auditFinding.count({ where: { audit: { orgId: user.orgId }, status: { notIn: ["CLOSED", "REMEDIATED", "ACCEPTED_RISK"] } } }),
    db.auditFinding.count({ where: { audit: { orgId: user.orgId }, severity: { in: ["CRITICAL", "HIGH"] } } }),
    db.auditFinding.count({ where: { audit: { orgId: user.orgId } } }),
    db.auditFinding.count({ where: { audit: { orgId: user.orgId }, status: { in: ["REMEDIATED", "CLOSED"] } } }),

    // Evidence coverage (audit checklist items vs those with evidence)
    db.auditChecklistItem.count({ where: { section: { audit: { orgId: user.orgId } } } }),
    db.auditChecklistItem.count({ where: { section: { audit: { orgId: user.orgId } }, evidence: { some: {} } } }),

    // Survey responses
    db.surveyResponse.count({ where: { audit: { orgId: user.orgId } } }),

    // Avg days from audit start to completion (completed audits only)
    db.audit.findMany({
      where: {
        orgId: user.orgId,
        status: "COMPLETED",
        planningStartDate: { not: null },
        completedAt: { not: null },
      },
      select: { planningStartDate: true, completedAt: true },
      take: 20,
    }) as Promise<{ planningStartDate: Date; completedAt: Date }[]>,
  ]);

  // Computed values
  const totalRevenue = invoiceTotals._sum.total ?? 0;
  const collectedRevenue = paidTotals._sum.total ?? 0;
  const revenuePerClient = activeClients > 0 ? Math.round(totalRevenue / activeClients) : null;
  const collectionRate = totalRevenue > 0 ? Math.round((collectedRevenue / totalRevenue) * 100) : null;
  const findingCloseRate = totalFindings > 0 ? Math.round((closedFindings / totalFindings) * 100) : null;
  const criticalFindingRate = totalFindings > 0 ? Math.round((criticalFindings / totalFindings) * 100) : null;
  const evidencePct = totalChecklistItems > 0 ? Math.round((itemsWithEvidence / totalChecklistItems) * 100) : null;

  // Avg cycle time (days from planningStart to completedAt)
  const cycleTimeDays = (() => {
    if (!completedAuditDates.length) return null;
    const days = completedAuditDates.map((a: { planningStartDate: Date; completedAt: Date }) =>
      Math.round((a.completedAt.getTime() - a.planningStartDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    if (!days.length) return null;
    return Math.round(days.reduce((s: number, d: number) => s + d, 0) / days.length);
  })();

  const onTimeRate = totalAudits > 0 ? Math.round((completedAudits / totalAudits) * 100) : null;

  // ── Build KPI array with actuals ─────────────────────────────────────────────

  const KPIS: KPI[] = [
    // Financial
    {
      id: "revenue-per-client",
      name: "Revenue per Client",
      category: "Financial",
      description: "Average total revenue generated per active client",
      formula: "Total Revenue / Active Clients",
      target: "$85,000",
      actual: revenuePerClient !== null ? `$${revenuePerClient.toLocaleString()}` : null,
      trend: revenuePerClient !== null ? (revenuePerClient >= 85000 ? "up" : "down") : null,
      unit: "$",
      isGood: revenuePerClient !== null ? revenuePerClient >= 85000 : null,
    },
    {
      id: "invoice-collection-rate",
      name: "Invoice Collection Rate",
      category: "Financial",
      description: "Percentage of invoiced revenue collected",
      formula: "Paid Revenue / Total Invoiced × 100",
      target: "95%",
      actual: collectionRate !== null ? `${collectionRate}%` : null,
      trend: collectionRate !== null ? (collectionRate >= 95 ? "up" : collectionRate >= 80 ? "neutral" : "down") : null,
      unit: "%",
      isGood: collectionRate !== null ? collectionRate >= 95 : null,
    },
    {
      id: "total-revenue",
      name: "Total Revenue (All-time)",
      category: "Financial",
      description: "Sum of all invoices issued",
      formula: "Sum of invoice totals",
      target: "—",
      actual: totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : null,
      trend: totalRevenue > 0 ? "up" : "neutral",
      unit: "$",
      isGood: null,
    },

    // Operational
    {
      id: "audit-cycle-time",
      name: "Audit Cycle Time",
      category: "Operational",
      description: "Average days from audit planning start to completion",
      formula: "Avg(Completed Date - Planning Start)",
      target: "< 60 days",
      actual: cycleTimeDays !== null ? `${cycleTimeDays} days` : null,
      trend: cycleTimeDays !== null ? (cycleTimeDays <= 60 ? "up" : cycleTimeDays <= 90 ? "neutral" : "down") : null,
      unit: "days",
      isGood: cycleTimeDays !== null ? cycleTimeDays <= 60 : null,
    },
    {
      id: "audit-completion-rate",
      name: "Audit Completion Rate",
      category: "Operational",
      description: "Percentage of audits that have been completed",
      formula: "Completed Audits / Total Audits × 100",
      target: "75%+",
      actual: onTimeRate !== null ? `${onTimeRate}%` : null,
      trend: onTimeRate !== null ? (onTimeRate >= 75 ? "up" : onTimeRate >= 50 ? "neutral" : "down") : null,
      unit: "%",
      isGood: onTimeRate !== null ? onTimeRate >= 75 : null,
    },
    {
      id: "active-clients",
      name: "Active Clients",
      category: "Operational",
      description: "Number of currently active clients",
      formula: "Count of active, non-deleted clients",
      target: "—",
      actual: activeClients > 0 ? String(activeClients) : null,
      trend: activeClients > 0 ? "up" : "neutral",
      unit: "",
      isGood: null,
    },

    // Audit Quality
    {
      id: "finding-close-rate",
      name: "Finding Close Rate",
      category: "Audit Quality",
      description: "Percentage of audit findings that have been remediated or closed",
      formula: "Closed/Remediated Findings / Total Findings × 100",
      target: "80%",
      actual: findingCloseRate !== null ? `${findingCloseRate}%` : null,
      trend: findingCloseRate !== null ? (findingCloseRate >= 80 ? "up" : findingCloseRate >= 60 ? "neutral" : "down") : null,
      unit: "%",
      isGood: findingCloseRate !== null ? findingCloseRate >= 80 : null,
    },
    {
      id: "critical-finding-rate",
      name: "Critical Finding Rate",
      category: "Audit Quality",
      description: "Percentage of findings rated Critical or High severity",
      formula: "Critical/High Findings / Total Findings × 100",
      target: "< 15%",
      actual: criticalFindingRate !== null ? `${criticalFindingRate}%` : null,
      trend: criticalFindingRate !== null ? (criticalFindingRate <= 15 ? "up" : criticalFindingRate <= 30 ? "neutral" : "down") : null,
      unit: "%",
      isGood: criticalFindingRate !== null ? criticalFindingRate <= 15 : null,
    },
    {
      id: "open-findings",
      name: "Open Findings",
      category: "Audit Quality",
      description: "Total number of findings not yet resolved",
      formula: "Findings with status not CLOSED/REMEDIATED",
      target: "< 20",
      actual: String(openFindings),
      trend: openFindings <= 20 ? "up" : openFindings <= 50 ? "neutral" : "down",
      unit: "",
      isGood: openFindings <= 20,
    },
    {
      id: "evidence-coverage",
      name: "Evidence Coverage",
      category: "Audit Quality",
      description: "Percentage of audit checklist items with at least one evidence file",
      formula: "Items with Evidence / Total Checklist Items × 100",
      target: "100%",
      actual: evidencePct !== null ? `${evidencePct}%` : null,
      trend: evidencePct !== null ? (evidencePct >= 90 ? "up" : evidencePct >= 70 ? "neutral" : "down") : null,
      unit: "%",
      isGood: evidencePct !== null ? evidencePct >= 90 : null,
    },

    // Client Satisfaction
    {
      id: "survey-responses",
      name: "Survey Responses",
      category: "Client Satisfaction",
      description: "Total number of client survey responses collected across all audits",
      formula: "Count of SurveyResponse records",
      target: "10+ per quarter",
      actual: String(surveyCount),
      trend: surveyCount >= 10 ? "up" : surveyCount >= 5 ? "neutral" : "down",
      unit: "",
      isGood: surveyCount >= 10,
    },
    {
      id: "active-audits",
      name: "Active Audits",
      category: "Client Satisfaction",
      description: "Audits currently in progress (Planning, Fieldwork, Review, Reporting)",
      formula: "Audits with status not DRAFT/COMPLETED/ARCHIVED",
      target: "—",
      actual: String(totalAudits - completedAudits),
      trend: "neutral",
      unit: "",
      isGood: null,
    },
  ];

  const grouped = CATEGORIES.filter((c) => c !== "All").map((cat) => ({
    category: cat,
    kpis: KPIS.filter((k) => k.category === cat),
  }));

  const dataCount = KPIS.filter((k) => k.actual !== null).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="KPI Library"
        subtitle="Live performance indicators computed from your platform data"
        icon={BarChart3}
        iconBg="bg-gold/10 border-gold/20"
        iconColor="text-gold"
      />

      {/* Live data badge */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl w-fit">
        <CheckCircle2 size={14} className="text-green-500" />
        <p className="text-xs text-foreground">
          <span className="font-semibold text-green-600">{dataCount}/{KPIS.length} KPIs</span> computed from live platform data
        </p>
      </div>

      {grouped.map(({ category, kpis }) => (
        <section key={category}>
          <div className="flex items-center gap-2 mb-3">
            <span className={cn("text-xs font-medium px-2 py-1 rounded-md border", CATEGORY_COLORS[category])}>
              {category}
            </span>
            <span className="text-xs text-muted-foreground">{kpis.length} indicators</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-green-600">{kpis.filter((k) => k.actual !== null).length} with live data</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {kpis.map((kpi) => (
              <div key={kpi.id} className="section-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-foreground leading-snug">{kpi.name}</h3>
                  {kpi.trend === "up" && <TrendingUp size={14} className={cn("flex-shrink-0 ml-2 mt-0.5", kpi.isGood === false ? "text-red-500" : "text-green-500")} />}
                  {kpi.trend === "down" && <TrendingDown size={14} className={cn("flex-shrink-0 ml-2 mt-0.5", kpi.isGood === false ? "text-red-500" : "text-green-500")} />}
                  {kpi.trend === "neutral" && <Minus size={14} className="text-muted-foreground flex-shrink-0 ml-2 mt-0.5" />}
                </div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{kpi.description}</p>
                <div className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1.5 rounded mb-3 leading-relaxed">
                  {kpi.formula}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Current</p>
                    {kpi.actual !== null ? (
                      <p className={cn("text-lg font-bold", kpi.isGood === true ? "text-green-500" : kpi.isGood === false ? "text-red-500" : "text-foreground")}>
                        {kpi.actual}
                      </p>
                    ) : (
                      <p className="text-lg font-bold text-muted-foreground/40">—</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p className="text-sm font-semibold text-foreground">{kpi.target}</p>
                  </div>
                </div>
                {kpi.actual === null && (
                  <p className="text-[10px] text-muted-foreground/60 mt-2">No data yet — will populate as you use the platform</p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
