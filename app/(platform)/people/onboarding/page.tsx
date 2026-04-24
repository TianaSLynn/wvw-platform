import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { UserPlus, CheckCircle2, Circle, Clock } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Employee Onboarding" };

const ONBOARDING_CHECKLIST = [
  { task: "Welcome email & system access", category: "Day 1", required: true },
  { task: "Workstation & equipment setup", category: "Day 1", required: true },
  { task: "Benefits enrollment", category: "Week 1", required: true },
  { task: "HR policy acknowledgement", category: "Week 1", required: true },
  { task: "Security awareness training", category: "Week 1", required: true },
  { task: "Platform & tools training", category: "Week 2", required: true },
  { task: "Client confidentiality agreement", category: "Week 1", required: true },
  { task: "Mentor assignment", category: "Week 1", required: false },
  { task: "30-day check-in scheduled", category: "Week 2", required: false },
  { task: "Audit methodology review", category: "Week 2-4", required: true },
];

export default async function OnboardingPage() {
  const user = await requireUser();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newHires = await db.user.findMany({
    where: {
      orgId: user.orgId,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const allStaff = await db.user.count({ where: { orgId: user.orgId, status: "ACTIVE", deletedAt: null } });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Employee Onboarding"
        subtitle="Track new hire onboarding progress and ensure a smooth start"
        icon={UserPlus}
        iconBg="bg-green-500/10 border-green-500/20"
        iconColor="text-green-500"
        breadcrumbs={[{ label: "People", href: "/people" }, { label: "Onboarding" }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="section-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{newHires.length}</p>
          <p className="text-xs text-muted-foreground">New Hires (Last 30 Days)</p>
        </div>
        <div className="section-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{allStaff}</p>
          <p className="text-xs text-muted-foreground">Total Team Members</p>
        </div>
        <div className="section-card p-4 text-center">
          <p className="text-2xl font-bold text-green-500">100%</p>
          <p className="text-xs text-muted-foreground">Onboarding Completion Rate</p>
        </div>
      </div>

      {/* New Hires */}
      <div className="section-card">
        <div className="section-card-header flex items-center gap-2">
          <UserPlus size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">Recent New Hires</h2>
        </div>
        {newHires.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No new hires in the last 30 days</div>
        ) : (
          <div className="divide-y divide-border">
            {newHires.map((hire) => {
              const daysIn = Math.floor((new Date().getTime() - hire.createdAt.getTime()) / (1000 * 60 * 60 * 24));
              const onboardingPct = Math.min(Math.round((daysIn / 30) * 100), 100);
              return (
                <div key={hire.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-green-500">{hire.firstName[0]}{hire.lastName[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{hire.firstName} {hire.lastName}</p>
                    <p className="text-xs text-muted-foreground">{hire.role} · Started {formatDate(hire.createdAt)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[100px]">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${onboardingPct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{onboardingPct}% complete · Day {daysIn}/30</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={12} />
                    Day {daysIn}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Onboarding Checklist */}
      <div className="section-card">
        <div className="section-card-header flex items-center gap-2">
          <CheckCircle2 size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">Standard Onboarding Checklist</h2>
        </div>
        <div className="divide-y divide-border">
          {["Day 1", "Week 1", "Week 2", "Week 2-4"].map((cat) => {
            const items = ONBOARDING_CHECKLIST.filter(i => i.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat}</p>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                      <span className="text-xs text-foreground">{item.task}</span>
                      {item.required && (
                        <span className="text-xs text-red-500 ml-auto">Required</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
