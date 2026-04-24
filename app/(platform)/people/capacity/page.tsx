import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Users, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Capacity Planning" };

export default async function CapacityPage() {
  const user = await requireUser();

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [team, timeData, projectCount] = await Promise.all([
    db.user.findMany({
      where: { orgId: user.orgId, status: "ACTIVE", deletedAt: null, role: { notIn: ["CLIENT_ADMIN", "CLIENT_USER"] } },
      select: { id: true, firstName: true, lastName: true, role: true, targetUtilization: true },
      orderBy: { lastName: "asc" },
    }),
    db.timeEntry.groupBy({
      by: ["userId"],
      where: { project: { orgId: user.orgId }, date: { gte: firstOfMonth }, status: { in: ["SUBMITTED", "APPROVED"] } },
      _sum: { hours: true },
    }),
    db.project.count({ where: { orgId: user.orgId, status: "ACTIVE", deletedAt: null } }),
  ]);

  const hoursMap: Record<string, number> = {};
  for (const t of timeData) {
    hoursMap[t.userId] = t._sum.hours ?? 0;
  }

  const staffWithCapacity = team.map((m) => {
    const logged = hoursMap[m.id] ?? 0;
    const target = (m.targetUtilization ?? 75) / 100 * 160;
    const pct = Math.round((logged / 160) * 100);
    const status = pct > 90 ? "overutilized" : pct >= (m.targetUtilization ?? 75) ? "on-target" : "underutilized";
    return { ...m, logged, target, pct, status };
  });

  const overUtil = staffWithCapacity.filter(s => s.status === "overutilized").length;
  const onTarget = staffWithCapacity.filter(s => s.status === "on-target").length;
  const underUtil = staffWithCapacity.filter(s => s.status === "underutilized").length;
  const teamAvg = staffWithCapacity.length > 0
    ? Math.round(staffWithCapacity.reduce((s, m) => s + m.pct, 0) / staffWithCapacity.length)
    : 0;

  const STATUS_STYLES: Record<string, { color: string; bg: string; icon: typeof CheckCircle2; label: string }> = {
    "overutilized": { color: "text-red-500", bg: "bg-red-500", icon: AlertTriangle, label: "Over-utilized" },
    "on-target": { color: "text-green-500", bg: "bg-green-500", icon: CheckCircle2, label: "On Target" },
    "underutilized": { color: "text-amber-500", bg: "bg-amber-500", icon: Clock, label: "Under-utilized" },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Capacity Planning"
        subtitle="Team utilization, availability, and workload balance for the current month"
        icon={Users}
        iconBg="bg-blue-500/10 border-blue-500/20"
        iconColor="text-blue-500"
        breadcrumbs={[{ label: "People", href: "/people" }, { label: "Capacity" }]}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 stagger-children">
        <div className="section-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{teamAvg}%</p>
          <p className="text-xs text-muted-foreground">Team Avg Utilization</p>
        </div>
        <div className="section-card p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{overUtil}</p>
          <p className="text-xs text-muted-foreground">Over-utilized</p>
        </div>
        <div className="section-card p-4 text-center">
          <p className="text-2xl font-bold text-green-500">{onTarget}</p>
          <p className="text-xs text-muted-foreground">On Target</p>
        </div>
        <div className="section-card p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{underUtil}</p>
          <p className="text-xs text-muted-foreground">Under-utilized</p>
        </div>
      </div>

      {overUtil > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-foreground">
            <span className="font-semibold text-red-500">{overUtil} team member{overUtil !== 1 ? "s" : ""}</span> are over-utilized this month — consider redistributing workload
          </p>
        </div>
      )}

      {/* Capacity grid */}
      <div className="section-card">
        <div className="section-card-header flex items-center gap-2">
          <Users size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">Team Capacity — {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
        </div>
        <div className="divide-y divide-border">
          {staffWithCapacity.map((member) => {
            const cfg = STATUS_STYLES[member.status] ?? STATUS_STYLES["normal"];
            const StatusIcon = cfg!.icon;
            return (
              <div key={member.id} className="flex items-center gap-4 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-muted-foreground">{member.firstName[0]}{member.lastName[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">{member.firstName} {member.lastName}</p>
                    <span className={cn("text-xs font-bold", cfg!.color)}>{member.pct}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", cfg!.bg)}
                      style={{ width: `${Math.min(member.pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-muted-foreground">{member.logged.toFixed(0)}h logged / 160h available</p>
                    <span className={cn("text-xs flex items-center gap-0.5", cfg!.color)}>
                      <StatusIcon size={10} />
                      {cfg!.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {team.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">No team members found</div>
          )}
        </div>
      </div>
    </div>
  );
}
