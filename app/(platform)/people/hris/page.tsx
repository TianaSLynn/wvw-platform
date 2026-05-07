import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Users, UserPlus, RefreshCw, Star, Building2,
  AlertTriangle, CheckCircle2, Clock, CalendarDays, Briefcase,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "HRIS Activity Hub" };

function daysFromNow(date: Date) {
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}
function daysAgo(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  ONBOARDING:  { label: "New Hire",     color: "text-purple-600", bg: "bg-purple-500/10", dot: "bg-purple-500" },
  OFFBOARDING: { label: "Departure",    color: "text-red-600",    bg: "bg-red-500/10",    dot: "bg-red-500"    },
  PROMOTION:   { label: "Promotion",    color: "text-gold",       bg: "bg-gold/10",       dot: "bg-gold"       },
  KUDOS:       { label: "Recognition",  color: "text-green-600",  bg: "bg-green-500/10",  dot: "bg-green-500"  },
  GENERAL:     { label: "Update",       color: "text-blue-600",   bg: "bg-blue-500/10",   dot: "bg-blue-500"   },
};

export default async function HrisHubPage() {
  const user = await requireUser();

  const now   = new Date();
  const in14  = new Date(now.getTime() + 14  * 86400000);
  const in30  = new Date(now.getTime() + 30  * 86400000);
  const in90  = new Date(now.getTime() + 90  * 86400000);
  const ago30 = new Date(now.getTime() - 30  * 86400000);
  const ago7  = new Date(now.getTime() - 7   * 86400000);

  const [
    startingSoon,
    inOnboarding,
    overdueSteps,
    newClients,
    recentAnnouncements,
    allActive,
    upcomingAnniversaries,
  ] = await Promise.all([
    // Starting in next 14 days
    db.employee.findMany({
      where: { orgId: user.orgId, startDate: { gte: now, lte: in14 }, employmentStatus: { not: "TERMINATED" } },
      orderBy: { startDate: "asc" },
    }),

    // Active onboarding workflows
    db.onboardingWorkflow.findMany({
      where: { orgId: user.orgId, status: "ACTIVE", type: "ONBOARDING" },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, title: true, startDate: true } },
        steps: { where: { status: { in: ["PENDING", "IN_PROGRESS"] } } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),

    // Overdue onboarding steps (pending + dueDate in the past)
    db.onboardingStep.findMany({
      where: {
        workflow: { orgId: user.orgId, status: "ACTIVE" },
        status: "PENDING",
        dueDate: { lt: now },
      },
      include: {
        workflow: {
          include: { employee: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),

    // New clients onboarded in last 30 days
    db.client.findMany({
      where: { orgId: user.orgId, onboardedAt: { gte: ago30 }, deletedAt: null },
      orderBy: { onboardedAt: "desc" },
      take: 10,
    }),

    // Recent HRIS announcements (last 7 days)
    db.communityPost.findMany({
      where: {
        space: { orgId: user.orgId },
        isAnnouncement: true,
        announcementType: { in: ["ONBOARDING", "OFFBOARDING", "PROMOTION", "KUDOS", "GENERAL"] },
        createdAt: { gte: ago7 },
      },
      include: { author: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),

    // Active employee count for summary
    db.employee.count({
      where: { orgId: user.orgId, employmentStatus: { in: ["ACTIVE", "ONBOARDING", "CONTRACT"] } },
    }),

    // Work anniversaries in next 30 days
    db.employee.findMany({
      where: { orgId: user.orgId, startDate: { not: null }, employmentStatus: { not: "TERMINATED" } },
      select: { id: true, firstName: true, lastName: true, title: true, startDate: true },
    }),
  ]);

  // Compute anniversaries in-memory
  const anniversaries = upcomingAnniversaries
    .flatMap((emp) => {
      if (!emp.startDate) return [];
      const sd = new Date(emp.startDate);
      const anniversary = new Date(now.getFullYear(), sd.getMonth(), sd.getDate());
      if (anniversary < now) anniversary.setFullYear(now.getFullYear() + 1);
      if (anniversary > in30) return [];
      const years = anniversary.getFullYear() - sd.getFullYear();
      return [{ ...emp, anniversaryDate: anniversary, years }];
    })
    .sort((a, b) => a.anniversaryDate.getTime() - b.anniversaryDate.getTime());

  const onboardingPct = inOnboarding.map((w) => {
    const total    = w.steps.length;
    const remaining = w.steps.filter((s) => s.status === "PENDING").length;
    const pct = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;
    return { ...w, pct, remaining };
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="HRIS Activity Hub"
        subtitle="New hires, onboarding progress, role changes, client starts, and work anniversaries"
        icon={Users}
        iconBg="bg-purple-500/10 border-purple-500/20"
        iconColor="text-purple-500"
        actions={
          <Link href="/workforce/new" className="btn-primary flex items-center gap-1.5 text-sm">
            <UserPlus size={14} /> Add Employee
          </Link>
        }
      />

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-children">
        {[
          { label: "Active Workforce",      value: allActive,              icon: Users,        color: "text-blue-500",   bg: "bg-blue-500/10"   },
          { label: "In Onboarding",         value: inOnboarding.length,    icon: RefreshCw,    color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "Starting in 14 days",   value: startingSoon.length,    icon: UserPlus,     color: "text-gold",       bg: "bg-gold/10"       },
          { label: "New Clients (30 days)", value: newClients.length,      icon: Building2,    color: "text-green-500",  bg: "bg-green-500/10"  },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="section-card p-4 flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", bg)}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Overdue alert */}
      {overdueSteps.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-600">{overdueSteps.length} overdue onboarding step{overdueSteps.length !== 1 ? "s" : ""}</p>
            <div className="mt-2 space-y-1">
              {overdueSteps.slice(0, 4).map((step) => (
                <p key={step.id} className="text-xs text-muted-foreground truncate">
                  <span className="font-medium text-foreground">{step.workflow.employee.firstName} {step.workflow.employee.lastName}</span>
                  {" — "}{step.title}
                  {step.dueDate && <span className="text-red-500 ml-1">({daysAgo(step.dueDate)}d overdue)</span>}
                </p>
              ))}
              {overdueSteps.length > 4 && <p className="text-xs text-muted-foreground">+{overdueSteps.length - 4} more</p>}
            </div>
          </div>
          <Link href="/workforce/onboarding" className="btn-ghost text-xs flex-shrink-0">Review →</Link>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Onboarding + Starting Soon */}
        <div className="xl:col-span-2 space-y-6">

          {/* Starting Soon */}
          {startingSoon.length > 0 && (
            <div className="section-card">
              <div className="section-card-header flex items-center gap-2">
                <CalendarDays size={14} className="text-gold" />
                <h2 className="text-sm font-semibold">Starting Soon</h2>
                <span className="ml-auto text-xs text-muted-foreground">{startingSoon.length} hire{startingSoon.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="divide-y divide-border">
                {startingSoon.map((emp) => {
                  const days = emp.startDate ? daysFromNow(emp.startDate) : null;
                  return (
                    <div key={emp.id} className="px-5 py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-muted-foreground">{emp.title ?? emp.department ?? emp.employmentType}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                        <span className={cn("font-medium", days === 0 ? "text-gold" : days !== null && days <= 3 ? "text-amber-500" : "text-muted-foreground")}>
                          {days === 0 ? "Today!" : days === 1 ? "Tomorrow" : `In ${days} days`}
                        </span>
                        <span className="text-muted-foreground">
                          {emp.startDate ? new Date(emp.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Onboarding */}
          {onboardingPct.length > 0 && (
            <div className="section-card">
              <div className="section-card-header flex items-center gap-2">
                <RefreshCw size={14} className="text-purple-500" />
                <h2 className="text-sm font-semibold">Active Onboarding</h2>
                <span className="ml-auto text-xs text-muted-foreground">{onboardingPct.length} workflow{onboardingPct.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="divide-y divide-border">
                {onboardingPct.map((w) => (
                  <Link key={w.id} href="/workforce/onboarding" className="px-5 py-3 flex items-center gap-4 hover:bg-muted/30 transition-colors block">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{w.employee.firstName} {w.employee.lastName}</p>
                      <p className="text-xs text-muted-foreground">{w.employee.title ?? "New hire"}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{ width: `${w.pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{w.pct}%</span>
                      {w.remaining > 0 && (
                        <span className="text-xs text-muted-foreground">{w.remaining} left</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* New Clients */}
          {newClients.length > 0 && (
            <div className="section-card">
              <div className="section-card-header flex items-center gap-2">
                <Building2 size={14} className="text-green-500" />
                <h2 className="text-sm font-semibold">New Clients — Last 30 Days</h2>
              </div>
              <div className="divide-y divide-border">
                {newClients.map((c) => (
                  <Link key={c.id} href={`/clients/${c.id}`} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors block">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.industry ?? "New client"}</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {c.onboardedAt ? new Date(c.onboardedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {startingSoon.length === 0 && onboardingPct.length === 0 && newClients.length === 0 && (
            <div className="empty-state py-12">
              <div className="empty-state-icon"><Users size={24} className="text-muted-foreground/40" /></div>
              <p className="text-sm font-medium">All quiet</p>
              <p className="text-xs text-muted-foreground mt-1">No new hires starting soon and no active onboarding workflows.</p>
              <Link href="/workforce/new" className="btn-primary mt-4 text-xs">Add Employee</Link>
            </div>
          )}
        </div>

        {/* Right: Announcement wall + Anniversaries */}
        <div className="space-y-5">

          {/* Anniversaries */}
          {anniversaries.length > 0 && (
            <div className="section-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Star size={14} className="text-gold" />
                <h3 className="text-sm font-semibold">Work Anniversaries</h3>
              </div>
              <div className="space-y-3">
                {anniversaries.map((emp) => {
                  const days = daysFromNow(emp.anniversaryDate);
                  return (
                    <div key={emp.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-gold">{emp.years}yr</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{emp.firstName} {emp.lastName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{emp.title ?? "Team member"}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {days === 0 ? "Today! 🎉" : `in ${days}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Announcement wall */}
          <div className="section-card">
            <div className="section-card-header flex items-center gap-2">
              <Briefcase size={14} className="text-blue-500" />
              <h3 className="text-sm font-semibold">Recent Announcements</h3>
            </div>
            {recentAnnouncements.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-xs text-muted-foreground">No announcements in the last 7 days.</p>
                <Link href="/community/announcements" className="btn-ghost text-xs mt-2">View All</Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentAnnouncements.map((post) => {
                  const cfg = TYPE_CONFIG[post.announcementType ?? "GENERAL"] ?? TYPE_CONFIG.GENERAL!;
                  return (
                    <div key={post.id} className="px-5 py-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />
                        <span className={cn("text-[10px] font-medium uppercase tracking-wide", cfg.color)}>{cfg.label}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {daysAgo(post.createdAt) === 0 ? "Today" : `${daysAgo(post.createdAt)}d ago`}
                        </span>
                      </div>
                      {post.title && <p className="text-xs font-semibold leading-snug">{post.title}</p>}
                      <p className="text-xs text-muted-foreground line-clamp-2">{post.body}</p>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="px-5 py-3 border-t border-border">
              <Link href="/community/announcements" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                View all announcements →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
