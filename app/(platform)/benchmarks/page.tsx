import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { TrendingUp, TrendingDown, BarChart3, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Benchmarks" };

const INDUSTRY_BENCHMARKS = [
  { metric: "Audit Cycle Time", wvwLabel: "WVW Avg", industry: 72, industryLabel: "Industry Avg (days)", unit: "days", lowerIsBetter: true },
  { metric: "Finding Close Rate", wvwLabel: "WVW Rate", industry: 68, industryLabel: "Industry Avg (%)", unit: "%", lowerIsBetter: false },
  { metric: "Staff Utilization", wvwLabel: "WVW Rate", industry: 72, industryLabel: "Industry Avg (%)", unit: "%", lowerIsBetter: false },
  { metric: "Client Retention Rate", wvwLabel: "WVW Rate", industry: 82, industryLabel: "Industry Avg (%)", unit: "%", lowerIsBetter: false },
  { metric: "Revenue per Client", wvwLabel: "WVW Avg", industry: 72000, industryLabel: "Industry Avg ($)", unit: "$", lowerIsBetter: false },
  { metric: "On-Time Delivery", wvwLabel: "WVW Rate", industry: 78, industryLabel: "Industry Avg (%)", unit: "%", lowerIsBetter: false },
  { metric: "QA First-Pass Rate", wvwLabel: "WVW Rate", industry: 88, industryLabel: "Industry Avg (%)", unit: "%", lowerIsBetter: false },
  { metric: "AR Days Outstanding", wvwLabel: "WVW Avg", industry: 52, industryLabel: "Industry Avg (days)", unit: "days", lowerIsBetter: true },
];

function formatMetricValue(value: number, unit: string): string {
  if (unit === "$") return `$${value.toLocaleString()}`;
  if (unit === "%") return `${value}%`;
  return `${value} ${unit}`;
}

export default async function BenchmarksPage() {
  const user = await requireUser();

  // Real WVW calculations
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  const [completedAudits, openFindings, closedFindings, timeThisMonth, teamCount] = await Promise.all([
    db.audit.findMany({
      where: { orgId: user.orgId, status: "COMPLETED", reportDueDate: { gte: sixMonthsAgo } },
      select: { fieldworkStartDate: true, reportDueDate: true },
    }),
    db.auditFinding.count({
      where: { audit: { orgId: user.orgId }, status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
    db.auditFinding.count({
      where: { audit: { orgId: user.orgId }, status: "CLOSED" },
    }),
    db.timeEntry.aggregate({
      where: {
        project: { orgId: user.orgId },
        date: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        status: { in: ["SUBMITTED", "APPROVED"] },
      },
      _sum: { hours: true },
    }),
    db.user.count({ where: { orgId: user.orgId, status: "ACTIVE", deletedAt: null } }),
  ]);

  const avgCycleTime = completedAudits.length > 0
    ? Math.round(completedAudits.reduce((sum, a) => {
        if (!a.fieldworkStartDate || !a.reportDueDate) return sum;
        return sum + (a.reportDueDate.getTime() - a.fieldworkStartDate.getTime()) / (1000 * 60 * 60 * 24);
      }, 0) / completedAudits.length)
    : null;

  const totalFindings = openFindings + closedFindings;
  const findingCloseRate = totalFindings > 0 ? Math.round((closedFindings / totalFindings) * 100) : null;

  const totalHours = timeThisMonth._sum.hours ?? 0;
  const targetHours = teamCount * 160;
  const utilization = targetHours > 0 ? Math.round((totalHours / targetHours) * 100) : null;

  const WVW_VALUES: Record<string, number | null> = {
    "Audit Cycle Time": avgCycleTime,
    "Finding Close Rate": findingCloseRate,
    "Staff Utilization": utilization,
    "Client Retention Rate": null,
    "Revenue per Client": null,
    "On-Time Delivery": null,
    "QA First-Pass Rate": null,
    "AR Days Outstanding": null,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Benchmarks"
        subtitle="Compare WVW performance against industry averages across key metrics"
        icon={BarChart3}
        iconBg="bg-gold/10 border-gold/20"
        iconColor="text-gold"
      />

      <div className="flex items-center gap-4 p-4 section-card">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gold" />
          <span className="text-xs font-medium text-foreground">WVW Performance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted-foreground/40" />
          <span className="text-xs text-muted-foreground">Industry Average</span>
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <Award size={13} />
          Benchmarks sourced from AICPA, IIA, and industry reports
        </div>
      </div>

      <div className="space-y-4">
        {INDUSTRY_BENCHMARKS.map((bm) => {
          const wvwValue = WVW_VALUES[bm.metric];
          const hasData = wvwValue !== null && wvwValue !== undefined;

          let wvwPct = 50;
          let industryPct = 50;
          let isAhead = false;

          if (hasData && wvwValue !== null) {
            const max = Math.max(wvwValue, bm.industry) * 1.2;
            wvwPct = Math.round((wvwValue / max) * 100);
            industryPct = Math.round((bm.industry / max) * 100);
            isAhead = bm.lowerIsBetter ? wvwValue < bm.industry : wvwValue > bm.industry;
          }

          return (
            <div key={bm.metric} className="section-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">{bm.metric}</h3>
                {hasData && (
                  <div className={cn("flex items-center gap-1 text-xs font-medium", isAhead ? "text-green-500" : "text-amber-500")}>
                    {isAhead ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {isAhead ? "Above average" : "Below average"}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {/* WVW bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground">WVW</span>
                    <span className="text-xs font-bold text-foreground">
                      {hasData && wvwValue !== null ? formatMetricValue(wvwValue, bm.unit) : "No data yet"}
                    </span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", hasData ? "bg-gold" : "bg-muted-foreground/20")}
                      style={{ width: hasData ? `${wvwPct}%` : "0%" }}
                    />
                  </div>
                </div>

                {/* Industry bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Industry Average</span>
                    <span className="text-xs text-muted-foreground">{formatMetricValue(bm.industry, bm.unit)}</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-muted-foreground/40 rounded-full transition-all"
                      style={{ width: `${industryPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {!hasData && (
                <p className="text-xs text-muted-foreground mt-3">Connect your data to see this metric calculated automatically</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
