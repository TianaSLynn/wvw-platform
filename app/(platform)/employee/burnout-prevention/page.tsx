import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Flame, Clock, Heart, TrendingDown, BarChart2 } from "lucide-react";

export const metadata: Metadata = { title: "Burnout Prevention" };

const PREVENTION_STRATEGIES = [
  { strategy: "Energy Management", tip: "Schedule high-focus work in your peak energy hours (often morning). Protect this time fiercely.", icon: Flame },
  { strategy: "Hard Stop Practice", tip: "Set a daily hard stop time and honour it. Your brain needs recovery time to perform at its best.", icon: Clock },
  { strategy: "Regular Recovery", tip: "Schedule at least one week-long break per quarter. Planned recovery prevents unplanned collapse.", icon: Heart },
  { strategy: "Saying No Skillfully", tip: "Learn to say no (or \"not now\") gracefully. Every yes to something is a no to something else.", icon: TrendingDown },
];

export default async function BurnoutPreventionPage() {
  const user = await requireUser();

  // Workload: average hours logged per week over the last 4 weeks
  const fourWeeksAgo = new Date(Date.now() - 28 * 86400000);
  const timeEntries = await db.timeEntry.findMany({
    where: { orgId: user.orgId, userId: user.id, date: { gte: fourWeeksAgo } },
    select: { hours: true, date: true },
  });

  const totalHours = timeEntries.reduce((s, e) => s + e.hours, 0);
  const avgWeeklyHours = timeEntries.length > 0 ? Math.round((totalHours / 4) * 10) / 10 : null;

  const workloadStatus =
    avgWeeklyHours === null ? null :
    avgWeeklyHours > 50 ? "High" :
    avgWeeklyHours > 40 ? "Moderate" :
    "Healthy";

  const workloadColor =
    workloadStatus === "High" ? "text-red-500" :
    workloadStatus === "Moderate" ? "text-amber-500" :
    "text-green-500";

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Burnout Prevention"
        subtitle="Proactive tools and insights to maintain sustainable high performance"
        icon={Flame}
        iconBg="bg-amber-500/10 border-amber-500/20"
        iconColor="text-amber-500"
      />

      {/* Workload snapshot */}
      {avgWeeklyHours !== null ? (
        <div className="section-card p-5 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full border-4 border-amber-500/40 flex items-center justify-center flex-shrink-0">
            <span className={`text-xl font-bold ${workloadColor}`}>{avgWeeklyHours}h</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">Avg Weekly Hours (last 4 wks)</p>
            <p className={`text-2xl font-bold ${workloadColor}`}>{workloadStatus} Workload</p>
            <p className="text-xs text-muted-foreground mt-1">
              {workloadStatus === "High" && "Consider discussing workload with your manager."}
              {workloadStatus === "Moderate" && "Within range — keep an eye on sustainable pace."}
              {workloadStatus === "Healthy" && "Hours are within a healthy range. Keep it up."}
            </p>
          </div>
          <div className="ml-auto text-right flex-shrink-0 hidden sm:block">
            <p className="text-xs text-muted-foreground">Total logged</p>
            <p className="text-lg font-semibold text-foreground">{Math.round(totalHours)}h</p>
            <p className="text-xs text-muted-foreground">last 28 days</p>
          </div>
        </div>
      ) : (
        <div className="section-card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <BarChart2 size={18} className="text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No time entries found</p>
            <p className="text-xs text-muted-foreground">Log your hours to see workload insights here.</p>
          </div>
        </div>
      )}

      {/* Prevention strategies */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Prevention Strategies</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
          {PREVENTION_STRATEGIES.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.strategy} className="section-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Icon size={16} className="text-amber-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{s.strategy}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.tip}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Burnout signals info card */}
      <div className="section-card p-5 bg-amber-500/5 border-amber-500/20">
        <p className="text-sm font-semibold text-foreground mb-1">Recognising Early Warning Signs</p>
        <ul className="space-y-1 text-xs text-muted-foreground leading-relaxed list-disc list-inside">
          <li>Persistent fatigue even after rest</li>
          <li>Increasing cynicism or detachment from work</li>
          <li>Reduced concentration and productivity</li>
          <li>Skipping breaks or working outside normal hours regularly</li>
          <li>Feeling ineffective regardless of output</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-3">If you recognise these signs, speak to your manager or use the Employee Assistance Programme (EAP) available through Benefits.</p>
      </div>
    </div>
  );
}
