import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { MapPin, CheckCircle2, Circle, BookOpen, Users, Calendar, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Onboarding Hub" };

const RESOURCES = [
  { icon: BookOpen, title: "Company Handbook", desc: "Policies, values, and how we work" },
  { icon: Users, title: "Team Directory", desc: "Who does what and how to reach them" },
  { icon: Calendar, title: "Key Dates", desc: "Team meetings, all-hands, and events" },
  { icon: Zap, title: "Platform Guide", desc: "How to use WVW Intelligence" },
];

export default async function OnboardingHubPage() {
  const user = await requireUser();

  const workflows = await db.onboardingWorkflow.findMany({
    where: { orgId: user.orgId, status: { not: "CANCELLED" } },
    include: {
      employee: { select: { firstName: true, lastName: true } },
      steps: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const activeWorkflow = workflows.find((w) => w.status === "ACTIVE") ?? workflows[0] ?? null;
  const totalSteps = activeWorkflow?.steps.length ?? 0;
  const completedSteps = activeWorkflow?.steps.filter((s) => s.status === "COMPLETED").length ?? 0;
  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Onboarding Hub"
        subtitle={`Welcome to WVW, ${user.firstName}! Your team's onboarding journeys.`}
        icon={MapPin}
        iconBg="bg-green-500/10 border-green-500/20"
        iconColor="text-green-500"
      />

      {activeWorkflow ? (
        <>
          {/* Progress overview */}
          <div className="section-card p-5 bg-gradient-to-br from-green-500/5 to-sage/5 border-green-500/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {activeWorkflow.employee.firstName} {activeWorkflow.employee.lastName} — Onboarding
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Started {activeWorkflow.startDate.toLocaleDateString()}
                  {activeWorkflow.targetDate && ` · Target: ${activeWorkflow.targetDate.toLocaleDateString()}`}
                </p>
              </div>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                activeWorkflow.status === "COMPLETED" ? "bg-green-500/10 text-green-500" : "bg-gold/10 text-gold"
              )}>
                {activeWorkflow.status === "COMPLETED" ? "Complete" : "In Progress"}
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden mb-2">
              <div className="h-full bg-green-500 rounded-full transition-all [width:var(--prog)]" style={{ "--prog": `${progressPct}%` } as React.CSSProperties} />
            </div>
            <p className="text-xs text-muted-foreground">{completedSteps} of {totalSteps} steps completed · {progressPct}%</p>
          </div>

          {/* Steps */}
          {activeWorkflow.steps.length > 0 && (
            <div className="section-card">
              <div className="section-card-header flex items-center gap-2">
                <MapPin size={15} className="text-green-500" />
                <h2 className="text-sm font-semibold">Onboarding Steps</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{activeWorkflow.steps.length}</span>
              </div>
              <div className="divide-y divide-border">
                {activeWorkflow.steps.map((step) => {
                  const done = step.status === "COMPLETED";
                  return (
                    <div key={step.id} className="flex items-center gap-3 px-4 py-3">
                      {done
                        ? <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                        : <Circle size={16} className="text-muted-foreground/40 flex-shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm", done ? "text-muted-foreground line-through" : "text-foreground")}>{step.title}</p>
                        {step.description && <p className="text-xs text-muted-foreground">{step.description}</p>}
                      </div>
                      {step.dueDate && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {step.dueDate.toLocaleDateString()}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{step.category}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Other workflows */}
          {workflows.length > 1 && (
            <div className="section-card">
              <div className="section-card-header flex items-center gap-2">
                <Users size={15} className="text-muted-foreground" />
                <h2 className="text-sm font-semibold">All Active Onboarding</h2>
              </div>
              <div className="divide-y divide-border">
                {workflows.map((w) => {
                  const tot = w.steps.length;
                  const comp = w.steps.filter((s) => s.status === "COMPLETED").length;
                  return (
                    <div key={w.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{w.employee.firstName} {w.employee.lastName}</p>
                        <p className="text-xs text-muted-foreground">Started {w.startDate.toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{comp}/{tot} steps</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon"><MapPin size={28} className="text-muted-foreground/40" /></div>
          <p className="text-sm font-medium">No active onboarding workflows</p>
          <p className="text-xs text-muted-foreground mt-1">Onboarding workflows are created from the People section when a new employee joins</p>
        </div>
      )}

      {/* Quick Resources */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Quick Resources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {RESOURCES.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.title} className="section-card p-4 text-center hover:shadow-md transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-2">
                  <Icon size={18} className="text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">{r.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
