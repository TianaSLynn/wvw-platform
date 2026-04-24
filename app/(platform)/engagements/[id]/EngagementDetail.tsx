"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  CheckCircle2, Circle, AlertCircle, Clock,
  Plus, Users, CalendarDays, DollarSign, BarChart2,
  ChevronRight, Briefcase,
} from "lucide-react";

type Task = {
  id: string; title: string; status: string; priority: string;
  estimatedHours: number | null; dueDate: Date | null;
  assignee: { id: string; firstName: string; lastName: string } | null;
  subtasks: Array<{ id: string; title: string; status: string }>;
  _count: { timeEntries: number };
};

type Project = {
  id: string; name: string; code: string | null; status: string; type: string;
  priority: string; description: string | null; budget: number | null;
  hoursBudget: number | null; billingModel: string | null; completionPct: number;
  startDate: Date | null; targetEndDate: Date | null;
  client: { id: string; name: string; logoUrl: string | null };
  members: Array<{ role: string; user: { id: string; firstName: string; lastName: string; title: string | null } }>;
  tasks: Task[];
  milestones: Array<{ id: string; name: string; dueDate: Date | null; isCompleted: boolean }>;
  _count: { tasks: number; timeEntries: number; documents: number };
};

type TasksByStatus = Record<"BACKLOG"|"TODO"|"IN_PROGRESS"|"IN_REVIEW"|"DONE", Task[]>;

interface Props { project: Project; tasksByStatus: TasksByStatus; currentUserId: string }
type Tab = "overview" | "tasks" | "milestones" | "team";

const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: "text-red-500", HIGH: "text-orange-500", MEDIUM: "text-amber-500", LOW: "text-blue-400",
};
const STATUS_VARIANT: Record<string, Parameters<typeof Badge>[0]["variant"]> = {
  ACTIVE: "success", COMPLETED: "secondary", ON_HOLD: "warning",
  DISCOVERY: "default", PLANNING: "default", CANCELLED: "destructive",
};
const TASK_STATUS_COLS = [
  { key: "TODO",        label: "To Do",       color: "border-t-slate-400" },
  { key: "IN_PROGRESS", label: "In Progress", color: "border-t-blue-500" },
  { key: "IN_REVIEW",   label: "In Review",   color: "border-t-amber-500" },
  { key: "DONE",        label: "Done",        color: "border-t-green-500" },
] as const;

export default function EngagementDetail({ project, tasksByStatus, currentUserId }: Props) {
  const [tab, setTab] = useState<Tab>("tasks");
  const router = useRouter();

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview",   label: "Overview" },
    { id: "tasks",      label: "Tasks",      count: project._count.tasks },
    { id: "milestones", label: "Milestones", count: project.milestones.length },
    { id: "team",       label: "Team",       count: project.members.length },
  ];

  const updateTaskStatus = async (taskId: string, status: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title={project.name}
        subtitle={`${project.client.name}${project.code ? ` · ${project.code}` : ""} · ${project.type}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[project.status] ?? "secondary"}>{project.status}</Badge>
            <Link href={`/engagements/${project.id}/tasks/new`}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium bg-navy-900 text-white hover:bg-navy-800 transition-colors"
            >
              <Plus size={13} /> Add Task
            </Link>
          </div>
        }
      />

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Progress",    value: `${project.completionPct.toFixed(0)}%`, icon: BarChart2, color: "text-gold" },
          { label: "Budget",      value: project.budget ? formatCurrency(project.budget, "USD", true) : "—", icon: DollarSign, color: "text-green-500" },
          { label: "Team Size",   value: project.members.length, icon: Users, color: "text-blue-500" },
          { label: "Target Date", value: project.targetEndDate ? formatDate(project.targetEndDate, "MMM d") : "—", icon: CalendarDays, color: "text-purple-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-4 shadow-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
            <div className="flex items-center gap-2 mt-2">
              <Icon size={15} className={color} />
              <span className="text-lg font-bold">{value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-card rounded-xl border border-border px-5 py-4 shadow-card">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium">Overall Progress</span>
          <span className="text-muted-foreground">{project.completionPct.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700",
              project.completionPct >= 80 ? "bg-green-500" : "bg-gold")}
            style={{ width: `${project.completionPct}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-0 -mb-px">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5",
                tab === t.id ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="text-[10px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-fade-in">
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border p-5 shadow-card space-y-3">
              <h3 className="font-semibold text-sm">Project Details</h3>
              <dl className="space-y-2 text-sm">
                {[
                  { label: "Billing Model", value: project.billingModel },
                  { label: "Hours Budget",  value: project.hoursBudget ? `${project.hoursBudget}h` : null },
                  { label: "Start Date",    value: project.startDate ? formatDate(project.startDate) : null },
                  { label: "Target End",    value: project.targetEndDate ? formatDate(project.targetEndDate) : null },
                ].map(({ label, value }) => value ? (
                  <div key={label} className="flex justify-between">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ) : null)}
              </dl>
            </div>
            {project.description && (
              <div className="bg-card rounded-xl border border-border p-5 shadow-card">
                <h3 className="font-semibold text-sm mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </div>
            )}
          </div>
        )}

        {tab === "tasks" && (
          /* Kanban board */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
            {TASK_STATUS_COLS.map((col) => {
              const tasks = tasksByStatus[col.key] ?? [];
              return (
                <div key={col.key} className={cn("bg-muted/30 rounded-xl border-t-2 border-border p-3 min-h-48", col.color)}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{col.label}</p>
                    <span className="text-xs text-muted-foreground">{tasks.length}</span>
                  </div>
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <TaskCard key={task.id} task={task} onStatusChange={updateTaskStatus} />
                    ))}
                  </div>
                  <Link href={`/engagements/${project.id}/tasks/new?status=${col.key}`}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 p-1"
                  >
                    <Plus size={12} /> Add task
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {tab === "milestones" && (
          <div className="space-y-3">
            {project.milestones.map((m) => (
              <div key={m.id} className="bg-card rounded-xl border border-border p-4 shadow-card flex items-center gap-3">
                {m.isCompleted
                  ? <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                  : <Circle size={18} className="text-muted-foreground flex-shrink-0" />}
                <div className="flex-1">
                  <p className={cn("font-semibold text-sm", m.isCompleted && "line-through text-muted-foreground")}>{m.name}</p>
                  {m.dueDate && <p className="text-xs text-muted-foreground">Due {formatDate(m.dueDate)}</p>}
                </div>
                {!m.isCompleted && m.dueDate && new Date(m.dueDate) < new Date() && (
                  <span className="text-xs text-red-500 font-semibold flex items-center gap-1">
                    <AlertCircle size={12} /> Overdue
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "team" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {project.members.map((m) => (
              <div key={m.user.id} className="bg-card rounded-xl border border-border p-4 shadow-card flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy-900/10 dark:bg-navy-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold">{m.user.firstName[0]}{m.user.lastName[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{m.user.firstName} {m.user.lastName}</p>
                  <div className="flex items-center gap-2">
                    {m.user.title && <p className="text-xs text-muted-foreground">{m.user.title}</p>}
                    <Badge variant={m.role === "lead" ? "gold" : "secondary"} size="sm" className="capitalize">{m.role}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, onStatusChange }: { task: Task; onStatusChange: (id: string, s: string) => void }) {
  const PRIORITY_DOT: Record<string, string> = {
    CRITICAL: "bg-red-500", HIGH: "bg-orange-500", MEDIUM: "bg-amber-500", LOW: "bg-blue-400",
  };
  return (
    <div className="bg-card rounded-lg border border-border p-3 shadow-sm hover:shadow-card transition-shadow">
      <div className="flex items-start gap-2">
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5", PRIORITY_DOT[task.priority] ?? "bg-slate-400")} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground leading-snug">{task.title}</p>
          {task.assignee && (
            <p className="text-[10px] text-muted-foreground mt-1">
              → {task.assignee.firstName} {task.assignee.lastName}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            {task.dueDate && (
              <span className={cn("text-[10px]", new Date(task.dueDate) < new Date() ? "text-red-500" : "text-muted-foreground")}>
                {formatDate(task.dueDate, "MMM d")}
              </span>
            )}
            {task.estimatedHours && (
              <span className="text-[10px] text-muted-foreground">{task.estimatedHours}h</span>
            )}
            {task.subtasks.length > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {task.subtasks.filter((s) => s.status === "DONE").length}/{task.subtasks.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
