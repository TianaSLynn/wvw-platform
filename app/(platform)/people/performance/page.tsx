import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Award, TrendingUp, Clock } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Performance Management" };

const RATINGS = ["Outstanding", "Exceeds Expectations", "Meets Expectations", "Needs Improvement"];
const RATING_COLORS = {
  "Outstanding": "bg-gold/10 text-gold border-gold/20",
  "Exceeds Expectations": "bg-green-500/10 text-green-500 border-green-500/20",
  "Meets Expectations": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "Needs Improvement": "bg-red-500/10 text-red-500 border-red-500/20",
};

export default async function PerformancePage() {
  const user = await requireUser();

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [team, timeData] = await Promise.all([
    db.user.findMany({
      where: { orgId: user.orgId, status: "ACTIVE", deletedAt: null },
      select: { id: true, firstName: true, lastName: true, role: true, targetUtilization: true, createdAt: true },
      orderBy: { lastName: "asc" },
    }),
    db.timeEntry.groupBy({
      by: ["userId"],
      where: { project: { orgId: user.orgId }, date: { gte: firstOfMonth }, status: { in: ["SUBMITTED", "APPROVED"] } },
      _sum: { hours: true },
    }),
  ]);

  const hoursMap: Record<string, number> = {};
  for (const t of timeData) {
    hoursMap[t.userId] = t._sum.hours ?? 0;
  }

  // Assign mock review cycle ratings
  const reviewRatings = ["Outstanding", "Exceeds Expectations", "Meets Expectations", "Meets Expectations", "Exceeds Expectations"];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Performance Management"
        subtitle="Team performance reviews, utilization, and competency tracking"
        icon={Award}
        iconBg="bg-gold/10 border-gold/20"
        iconColor="text-gold"
        breadcrumbs={[{ label: "People", href: "/people" }, { label: "Performance" }]}
      />

      <div className="section-card">
        <div className="section-card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">Team Performance Overview</h2>
          </div>
          <span className="text-xs text-muted-foreground">Current Review Cycle</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Team Member</th>
                <th>Role</th>
                <th>Hours This Month</th>
                <th>Target Utilization</th>
                <th>Actual Utilization</th>
                <th>Review Rating</th>
              </tr>
            </thead>
            <tbody>
              {team.map((member, i) => {
                const hours = hoursMap[member.id] ?? 0;
                const target = member.targetUtilization ?? 75;
                const targetHours = (target / 100) * 160;
                const actualPct = targetHours > 0 ? Math.round((hours / 160) * 100) : 0;
                const rating = reviewRatings[i % reviewRatings.length];
                return (
                  <tr key={member.id}>
                    <td className="font-medium text-foreground">{member.firstName} {member.lastName}</td>
                    <td className="text-muted-foreground text-xs">{member.role}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-medium">{hours.toFixed(0)}h</span>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(actualPct, 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="text-muted-foreground">{target}%</td>
                    <td>
                      <span className={cn("font-medium", actualPct >= target ? "text-green-500" : "text-amber-500")}>
                        {actualPct}%
                      </span>
                    </td>
                    <td>
                      <span className={cn("text-xs px-2 py-0.5 rounded-md border", RATING_COLORS[rating as keyof typeof RATING_COLORS] ?? "bg-muted text-muted-foreground border-border")}>
                        {rating}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">Upcoming Review Cycle</h2>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock size={14} />
            <span>Q2 2026 reviews due: <strong className="text-foreground">June 30, 2026</strong></span>
          </div>
          <button className="btn-primary text-xs ml-auto">Start Reviews</button>
        </div>
      </div>
    </div>
  );
}
