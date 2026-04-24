import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Briefcase, TrendingUp, CheckCircle2, Star, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Manager Health" };

const MANAGER_BEHAVIORS = [
  { behavior: "Regular 1:1 meetings", score: 88, desc: "Consistent weekly check-ins with direct reports" },
  { behavior: "Clear goal-setting", score: 82, desc: "Communicates clear expectations and priorities" },
  { behavior: "Recognition & appreciation", score: 76, desc: "Acknowledges contributions and celebrates wins" },
  { behavior: "Development support", score: 79, desc: "Invests in team member growth and career paths" },
  { behavior: "Transparency", score: 85, desc: "Shares context and communicates organizational decisions" },
  { behavior: "Psychological safety", score: 80, desc: "Creates an environment where people can speak up" },
];

const DEVELOPMENT_RESOURCES = [
  { title: "Manager Fundamentals", type: "Course", duration: "4h", desc: "Core people management skills" },
  { title: "Difficult Conversations", type: "Workshop", duration: "2h", desc: "Navigate challenging feedback and conflicts" },
  { title: "Coaching for Performance", type: "Course", duration: "3h", desc: "Move from telling to coaching" },
  { title: "Managing Remote Teams", type: "Guide", duration: "1h", desc: "Best practices for distributed team leadership" },
];

export default async function ManagerHealthPage() {
  const user = await requireUser();

  const managers = await db.user.findMany({
    where: {
      orgId: user.orgId,
      role: { in: ["MANAGER", "PARTNER", "ADMIN", "SUPER_ADMIN"] },
      status: "ACTIVE", deletedAt: null,
    },
    select: { id: true, firstName: true, lastName: true, role: true },
    orderBy: { lastName: "asc" },
  });

  const overallScore = Math.round(MANAGER_BEHAVIORS.reduce((s, b) => s + b.score, 0) / MANAGER_BEHAVIORS.length);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Manager Health"
        subtitle="Track manager effectiveness and provide development resources"
        icon={Briefcase}
        iconBg="bg-blue-500/10 border-blue-500/20"
        iconColor="text-blue-500"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="section-card p-5 text-center">
          <p className="text-4xl font-bold text-foreground">{overallScore}</p>
          <p className="text-xs text-muted-foreground">Avg Manager Score</p>
          <p className="text-xs text-muted-foreground">out of 100</p>
        </div>
        <div className="section-card p-5 text-center">
          <p className="text-4xl font-bold text-foreground">{managers.length}</p>
          <p className="text-xs text-muted-foreground">People Managers</p>
        </div>
        <div className="section-card p-5 text-center">
          <p className="text-4xl font-bold text-green-500">+4</p>
          <p className="text-xs text-muted-foreground">Points vs Last Quarter</p>
        </div>
      </div>

      {/* Manager behaviors */}
      <div className="section-card">
        <div className="section-card-header flex items-center gap-2">
          <Star size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">Manager Effectiveness Dimensions</h2>
        </div>
        <div className="p-4 space-y-4">
          {MANAGER_BEHAVIORS.map((b) => (
            <div key={b.behavior}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-sm font-medium text-foreground">{b.behavior}</p>
                  <p className="text-xs text-muted-foreground">{b.desc}</p>
                </div>
                <span className={cn("text-sm font-bold ml-4", b.score >= 80 ? "text-green-500" : b.score >= 65 ? "text-amber-500" : "text-red-500")}>
                  {b.score}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full", b.score >= 80 ? "bg-green-500" : b.score >= 65 ? "bg-amber-500" : "bg-red-500")}
                  style={{ width: `${b.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Development resources */}
      <div className="section-card">
        <div className="section-card-header flex items-center gap-2">
          <TrendingUp size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">Manager Development Resources</h2>
        </div>
        <div className="divide-y divide-border">
          {DEVELOPMENT_RESOURCES.map((r) => (
            <div key={r.title} className="flex items-start gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={14} className="text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.desc} · {r.type} · {r.duration}</p>
              </div>
              <button className="btn-ghost text-xs flex-shrink-0">Start</button>
            </div>
          ))}
        </div>
      </div>

      {/* 360 Feedback CTA */}
      <div className="section-card p-4 flex items-center gap-3 bg-blue-500/5 border-blue-500/20">
        <MessageCircle size={16} className="text-blue-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">360 Feedback Collection</p>
          <p className="text-xs text-muted-foreground">Quarterly 360 feedback for managers — Q1 2026 closes March 31</p>
        </div>
        <button className="btn-primary text-xs">Give Feedback</button>
      </div>
    </div>
  );
}
