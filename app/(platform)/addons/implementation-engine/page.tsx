import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Map, CheckCircle, Clock, AlertTriangle, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = { title: "Strategy & Implementation" };

const ROADMAP_PHASES = [
  {
    phase: "Phase 1: Discovery & Assessment",
    duration: "Weeks 1–2",
    status: "complete",
    tasks: [
      { task: "Kickoff meeting and scope alignment", done: true },
      { task: "Stakeholder interviews", done: true },
      { task: "Current state documentation review", done: true },
      { task: "Risk and gap analysis", done: true },
    ],
  },
  {
    phase: "Phase 2: Strategy Design",
    duration: "Weeks 3–4",
    status: "in-progress",
    tasks: [
      { task: "Framework selection and customization", done: true },
      { task: "Control design and mapping", done: true },
      { task: "Policy drafting", done: false },
      { task: "Implementation roadmap finalization", done: false },
    ],
  },
  {
    phase: "Phase 3: Implementation",
    duration: "Weeks 5–10",
    status: "upcoming",
    tasks: [
      { task: "Control implementation across business units", done: false },
      { task: "Staff training and awareness", done: false },
      { task: "System configuration and tooling", done: false },
      { task: "Evidence collection", done: false },
    ],
  },
  {
    phase: "Phase 4: Validation & Audit Readiness",
    duration: "Weeks 11–12",
    status: "upcoming",
    tasks: [
      { task: "Internal audit readiness review", done: false },
      { task: "Gap remediation", done: false },
      { task: "Final documentation package", done: false },
      { task: "Audit engagement handoff", done: false },
    ],
  },
];

const STATUS_CONFIG = {
  complete:     { label: "Complete",     color: "text-green-500",  bg: "bg-green-500",  badge: "bg-green-500/10 text-green-500" },
  "in-progress":{ label: "In Progress",  color: "text-amber-500",  bg: "bg-amber-500",  badge: "bg-amber-500/10 text-amber-500" },
  upcoming:     { label: "Upcoming",     color: "text-muted-foreground", bg: "bg-muted", badge: "bg-muted text-muted-foreground" },
};

export default async function ImplementationEnginePage() {
  const user = await requireUser();

  const [clientCount, auditCount] = await Promise.all([
    db.client.count({ where: { orgId: user.orgId, isActive: true } }),
    db.audit.count({ where: { orgId: user.orgId, status: { in: ["PLANNING", "FIELDWORK"] } } }),
  ]);

  const totalTasks = ROADMAP_PHASES.reduce((s, p) => s + p.tasks.length, 0);
  const doneTasks  = ROADMAP_PHASES.reduce((s, p) => s + p.tasks.filter((t) => t.done).length, 0);
  const pct = Math.round((doneTasks / totalTasks) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Strategy & Implementation"
        subtitle="Strategic planning and implementation roadmap management"
        icon={Map}
        iconBg="bg-blue-500/10 border-blue-500/20"
        iconColor="text-blue-500"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Overall Progress",  value: `${pct}%`,       color: "text-foreground" },
          { label: "Tasks Complete",    value: `${doneTasks}/${totalTasks}`, color: "text-green-500" },
          { label: "Active Clients",    value: clientCount,     color: "text-foreground" },
          { label: "Active Audits",     value: auditCount,      color: "text-foreground" },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="section-card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Implementation Progress</p>
          <span className="text-sm font-bold text-gold">{pct}%</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-gold to-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{doneTasks} of {totalTasks} tasks completed across all phases</p>
      </div>

      {/* Roadmap phases */}
      <div className="space-y-4 stagger-children">
        {ROADMAP_PHASES.map((phase) => {
          const cfg = STATUS_CONFIG[phase.status as keyof typeof STATUS_CONFIG];
          const doneInPhase = phase.tasks.filter((t) => t.done).length;
          return (
            <div key={phase.phase} className="section-card">
              <div className="section-card-header flex items-center gap-3">
                <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", cfg.bg)} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{phase.phase}</h3>
                  <p className="text-xs text-muted-foreground">{phase.duration}</p>
                </div>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", cfg.badge)}>
                  {cfg.label}
                </span>
                <span className="text-xs text-muted-foreground">{doneInPhase}/{phase.tasks.length}</span>
              </div>
              <div className="divide-y divide-border/60">
                {phase.tasks.map((task) => (
                  <div key={task.task} className="flex items-center gap-3 px-4 py-2.5">
                    {task.done
                      ? <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                      : <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 flex-shrink-0" />
                    }
                    <p className={cn("text-sm", task.done ? "text-muted-foreground line-through" : "text-foreground")}>{task.task}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <Link href="/audits" className="btn-gold text-xs">Go to Audit Registry →</Link>
      </div>
    </div>
  );
}
