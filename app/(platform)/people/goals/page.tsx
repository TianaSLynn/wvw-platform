import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Target, Plus, CheckCircle2, Clock, TrendingUp, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import GoalsClient from "./GoalsClient";

export const metadata: Metadata = { title: "Goals & OKRs" };

export default async function GoalsPage() {
  const user = await requireUser();

  const goals = await db.employeeGoal.findMany({
    where: { orgId: user.orgId, status: { not: "ARCHIVED" } },
    include: { keyResults: true },
    orderBy: [{ status: "asc" }, { quarter: "desc" }, { createdAt: "desc" }],
  });

  // Compute stats
  const activeGoals = goals.filter((g) => g.status === "ACTIVE");
  const completedGoals = goals.filter((g) => g.status === "COMPLETED");
  const avgProgress = activeGoals.length
    ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length)
    : 0;
  const allKRs = goals.flatMap((g) => g.keyResults);
  const completedKRs = allKRs.filter((kr) => kr.progress >= 100);

  const canAdmin = ["SUPER_ADMIN", "ADMIN", "PARTNER", "MANAGER"].includes(user.role);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Goals & OKRs"
        subtitle="Organizational objectives and key results"
        icon={Target}
        iconBg="bg-green-500/10 border-green-500/20"
        iconColor="text-green-500"
        breadcrumbs={[{ label: "People", href: "/people" }, { label: "Goals & OKRs" }]}
        actions={
          canAdmin ? (
            <button id="add-goal-btn" className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              Add Objective
            </button>
          ) : null
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="section-card p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{activeGoals.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Active Objectives</p>
        </div>
        <div className="section-card p-4 text-center">
          <p className={cn("text-3xl font-bold", avgProgress >= 80 ? "text-green-500" : avgProgress >= 50 ? "text-gold" : "text-amber-500")}>
            {avgProgress}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Avg Progress</p>
        </div>
        <div className="section-card p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{completedKRs.length}/{allKRs.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Key Results Done</p>
        </div>
        <div className="section-card p-4 text-center">
          <p className="text-3xl font-bold text-green-500">{completedGoals.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Completed</p>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Target size={28} className="text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-foreground">No objectives set yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Set organizational objectives and key results to track progress across your team
          </p>
          {canAdmin && (
            <button id="add-goal-btn-empty" className="btn-primary mt-4 text-xs flex items-center gap-1.5 mx-auto">
              <Plus size={14} />
              Add First Objective
            </button>
          )}
        </div>
      ) : (
        <GoalsClient goals={goals} canAdmin={canAdmin} />
      )}

      {/* Link to KPI Library */}
      <div className="section-card p-4 flex items-center gap-3 bg-blue-500/5 border-blue-500/20">
        <TrendingUp size={16} className="text-blue-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-foreground">
            Connect goals to your <strong>KPI Library</strong> for data-driven progress tracking
          </p>
        </div>
        <Link href="/kpis" className="btn-ghost text-xs flex items-center gap-1">
          <BookOpen size={12} />
          View KPIs
        </Link>
      </div>
    </div>
  );
}
