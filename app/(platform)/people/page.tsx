import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
import { Users, Clock, Target, Award, TrendingUp, ChevronRight } from "lucide-react";

export const metadata: Metadata = { title: "People & Culture" };

export default async function PeoplePage() {
  const user = await requireUser();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [members, timeEntriesThisMonth] = await Promise.all([
    db.user.findMany({
      where: { orgId: user.orgId, deletedAt: null },
      select: {
        id: true, firstName: true, lastName: true, email: true, title: true,
        role: true, department: true, avatarUrl: true, billableRate: true,
        targetUtilization: true, status: true, createdAt: true,
        skills: { select: { skill: true, proficiency: true, category: true } },
        _count: { select: { auditAssignments: true, timeEntries: true, assignedTasks: true } },
      },
      orderBy: [{ department: "asc" }, { firstName: "asc" }],
    }),
    db.timeEntry.groupBy({
      by: ["userId"],
      where: { orgId: user.orgId, createdAt: { gte: startOfMonth } },
      _sum: { hours: true },
    }),
  ]);

  const hoursMap = Object.fromEntries(
    timeEntriesThisMonth.map((t) => [t.userId, Number(t._sum.hours ?? 0)])
  );

  // Department breakdown
  const departments = Array.from(new Set(members.map((m) => m.department ?? "General"))).sort();
  const deptCounts = Object.fromEntries(
    departments.map((d) => [d, members.filter((m) => (m.department ?? "General") === d).length])
  );

  const activeCount   = members.filter((m) => m.status === "ACTIVE").length;
  const avgBillRate   = members.filter((m) => m.billableRate).reduce((s, m, _, a) => s + (m.billableRate! / a.filter((x) => x.billableRate).length), 0);
  const totalHoursThisMonth = timeEntriesThisMonth.reduce((s, t) => s + Number(t._sum.hours ?? 0), 0);

  const QUICK_LINKS = [
    { href: "/people/staff",       icon: Users,      label: "Staff Directory",  desc: `${members.length} members` },
    { href: "/people/time",        icon: Clock,      label: "Time Tracking",    desc: `${totalHoursThisMonth.toFixed(0)}h this month` },
    { href: "/people/capacity",    icon: Target,     label: "Capacity",         desc: "Allocation & availability" },
    { href: "/people/performance", icon: Award,      label: "Performance",      desc: "Goals & reviews" },
    { href: "/people/goals",       icon: TrendingUp, label: "Goals & OKRs",     desc: "Team objectives" },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900 to-navy-700 border border-gold/20 flex items-center justify-center">
          <Users size={18} className="text-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">People & Culture</h1>
          <p className="text-muted-foreground text-sm">Team management, capacity, and performance</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Members",    value: activeCount,                           color: "text-blue-500" },
          { label: "Avg Billable Rate", value: avgBillRate > 0 ? formatCurrency(avgBillRate) : "—", color: "text-gold" },
          { label: "Hours This Month",  value: totalHoursThisMonth.toFixed(0) + "h",  color: "text-green-500" },
          { label: "Departments",       value: departments.length,                    color: "text-purple-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5">
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {QUICK_LINKS.map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-gold/20 hover:bg-muted/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900/10 to-navy-700/10 border border-border group-hover:border-gold/20 flex items-center justify-center flex-shrink-0 transition-colors">
              <Icon size={18} className="text-gold" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <ChevronRight size={15} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ))}
      </div>

      {/* Department breakdown */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-4">By Department</h2>
        <div className="space-y-2">
          {departments.map((dept) => {
            const count = deptCounts[dept] ?? 0;
            const pct   = Math.round((count / members.length) * 100);
            return (
              <div key={dept} className="flex items-center gap-3">
                <span className="w-36 text-sm text-muted-foreground truncate">{dept}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-navy-900 to-navy-700 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-14 text-right text-xs text-muted-foreground">{count} · {pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team roster preview */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Team Roster</h2>
          <Link href="/people/staff" className="text-xs text-gold hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {members.slice(0, 6).map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border">
              <div className="w-8 h-8 rounded-lg bg-navy-900 border border-gold/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-gold">{m.firstName[0]}{m.lastName[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{m.firstName} {m.lastName}</p>
                <p className="text-xs text-muted-foreground truncate">{m.title ?? m.role.replace(/_/g, " ")}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-muted-foreground">{hoursMap[m.id]?.toFixed(1) ?? "0"}h</p>
                <p className="text-xs text-muted-foreground">this month</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
