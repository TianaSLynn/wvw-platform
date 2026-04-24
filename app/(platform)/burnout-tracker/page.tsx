import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { AlertTriangle, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Burnout Tracker" };

export default async function BurnoutTrackerPage() {
  const user = await requireUser();

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const [team, timeEntries] = await Promise.all([
    db.user.findMany({
      where: { orgId: user.orgId, status: "ACTIVE", deletedAt: null, role: { notIn: ["CLIENT_ADMIN", "CLIENT_USER"] } },
      select: { id: true, firstName: true, lastName: true, role: true, targetUtilization: true },
      orderBy: { lastName: "asc" },
    }),
    db.timeEntry.groupBy({
      by: ["userId"],
      where: {
        project: { orgId: user.orgId },
        date: { gte: thirtyDaysAgo },
        status: { in: ["SUBMITTED", "APPROVED"] },
      },
      _sum: { hours: true },
      _max: { hours: true },
    }),
  ]);

  const timeMap: Record<string, { total: number; maxDay: number }> = {};
  for (const t of timeEntries) {
    timeMap[t.userId] = { total: t._sum.hours ?? 0, maxDay: t._max.hours ?? 0 };
  }

  // Calculate burnout risk scores
  const staffRisk = team.map((m) => {
    const { total = 0, maxDay = 0 } = timeMap[m.id] ?? {};
    const target = (m.targetUtilization ?? 75) / 100 * 160;
    const overWorkDays = maxDay > 10 ? 2 : maxDay > 9 ? 1 : 0;
    // Risk: high if >120% utilization or logged >10h in a day
    const pct = total / 160 * 100;
    const riskScore = Math.min(100, Math.round(pct * 0.6 + overWorkDays * 20));
    const riskLevel = riskScore >= 75 ? "HIGH" : riskScore >= 50 ? "MEDIUM" : "LOW";
    return { ...m, total, maxDay, pct: Math.round(pct), riskScore, riskLevel };
  });

  const highRisk = staffRisk.filter(s => s.riskLevel === "HIGH").length;
  const medRisk = staffRisk.filter(s => s.riskLevel === "MEDIUM").length;

  const RISK_STYLES: Record<string, string> = {
    HIGH: "bg-red-500/10 text-red-500 border-red-500/20",
    MEDIUM: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    LOW: "bg-green-500/10 text-green-500 border-green-500/20",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Burnout Tracker"
        subtitle="Monitor overwork signals and team wellbeing based on time entry data"
        icon={AlertTriangle}
        iconBg="bg-red-500/10 border-red-500/20"
        iconColor="text-red-500"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <div className={cn("section-card p-4 text-center", highRisk > 0 ? "border-red-500/30 bg-red-500/5" : "")}>
          <p className="text-2xl font-bold text-red-500">{highRisk}</p>
          <p className="text-xs text-muted-foreground">High Burnout Risk</p>
        </div>
        <div className="section-card p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{medRisk}</p>
          <p className="text-xs text-muted-foreground">Medium Risk</p>
        </div>
        <div className="section-card p-4 text-center">
          <p className="text-2xl font-bold text-green-500">{staffRisk.filter(s => s.riskLevel === "LOW").length}</p>
          <p className="text-xs text-muted-foreground">Low / Healthy</p>
        </div>
      </div>

      {highRisk > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-foreground">
            <span className="font-semibold text-red-500">{highRisk} team member{highRisk !== 1 ? "s" : ""}</span> show high burnout risk signals. Consider redistributing workload or scheduling 1:1 check-ins.
          </p>
        </div>
      )}

      <div className="section-card">
        <div className="section-card-header flex items-center gap-2">
          <Clock size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">Team Burnout Risk — Last 30 Days</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Team Member</th>
                <th>Hours Logged</th>
                <th>Utilization</th>
                <th>Max Single Day</th>
                <th>Risk Score</th>
                <th>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {staffRisk.sort((a, b) => b.riskScore - a.riskScore).map((m) => (
                <tr key={m.id}>
                  <td className="font-medium text-foreground">{m.firstName} {m.lastName}</td>
                  <td className="text-foreground">{m.total.toFixed(0)}h</td>
                  <td>
                    <span className={cn("font-medium", m.pct > 90 ? "text-red-500" : m.pct > 75 ? "text-amber-500" : "text-green-500")}>
                      {m.pct}%
                    </span>
                  </td>
                  <td className={cn("font-medium", m.maxDay > 10 ? "text-red-500" : m.maxDay > 9 ? "text-amber-500" : "text-foreground")}>
                    {m.maxDay > 0 ? `${m.maxDay.toFixed(1)}h` : "—"}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", m.riskLevel === "HIGH" ? "bg-red-500" : m.riskLevel === "MEDIUM" ? "bg-amber-500" : "bg-green-500")}
                          style={{ width: `${m.riskScore}%` }} />
                      </div>
                      <span className="text-xs text-foreground">{m.riskScore}</span>
                    </div>
                  </td>
                  <td>
                    <span className={cn("text-xs px-2 py-0.5 rounded-md border font-medium", RISK_STYLES[m.riskLevel])}>
                      {m.riskLevel}
                    </span>
                  </td>
                </tr>
              ))}
              {team.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-8">No time entry data for the last 30 days</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section-card p-4 flex items-center gap-3 bg-sage/5 border-sage/20">
        <TrendingUp size={16} className="text-sage flex-shrink-0" />
        <p className="text-sm text-foreground flex-1">Risk signals are based on hours logged vs. target — not a clinical assessment</p>
        <a href="/employee/burnout-prevention" className="btn-ghost text-xs">Prevention Resources →</a>
      </div>
    </div>
  );
}
