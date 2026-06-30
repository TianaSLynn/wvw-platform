"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, Circle, Lock, Clock, SkipForward, AlertCircle,
  ChevronDown, ChevronRight, FileText, Users, Cpu, BookOpen,
  Shield, Smile, GraduationCap, Mic2, Building2, RefreshCw,
  Loader2, CheckCheck, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type StepStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED" | "BLOCKED";

type Step = {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  status: StepStatus;
  sortOrder: number;
  dueDate?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  blockedByStepId?: string | null;
  documentRequired?: boolean;
  documentLabel?: string | null;
  documentCollected?: boolean;
};

type Workflow = {
  id: string;
  type: "ONBOARDING" | "OFFBOARDING";
  entityType: "EMPLOYEE" | "CLIENT" | "STUDENT" | "INSTRUCTOR";
  status: string;
  startDate: string;
  targetDate?: string | null;
  completedAt?: string | null;
  studentName?: string | null;
  employee?: { firstName: string; lastName: string; title?: string | null; department?: string | null } | null;
  steps: Step[];
};

// ─── Config ───────────────────────────────────────────────────────────────────

const ENTITY_LABEL: Record<string, string> = {
  EMPLOYEE: "Employee Onboarding",
  STUDENT: "Academy Enrollment",
  INSTRUCTOR: "Instructor Onboarding",
  CLIENT: "Client Onboarding",
};

const ENTITY_ICON: Record<string, React.ElementType> = {
  EMPLOYEE: Users,
  STUDENT: GraduationCap,
  INSTRUCTOR: Mic2,
  CLIENT: Building2,
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  HR:       { label: "HR & Admin",    icon: Users,      color: "text-blue-600" },
  IT:       { label: "IT & Access",   icon: Cpu,        color: "text-violet-600" },
  TRAINING: { label: "Training",      icon: BookOpen,   color: "text-amber-600" },
  CULTURE:  { label: "Culture",       icon: Smile,      color: "text-emerald-600" },
  LEGAL:    { label: "Legal",         icon: Shield,     color: "text-red-600" },
  GENERAL:  { label: "General",       icon: ClipboardList, color: "text-slate-600" },
};

function pct(steps: Step[]) {
  if (!steps.length) return 0;
  const done = steps.filter(s => s.status === "COMPLETED" || s.status === "SKIPPED").length;
  return Math.round((done / steps.length) * 100);
}

function groupByCategory(steps: Step[]) {
  const groups: Record<string, Step[]> = {};
  for (const step of steps) {
    const cat = step.category ?? "GENERAL";
    (groups[cat] ??= []).push(step);
  }
  return groups;
}

// ─── StepRow ─────────────────────────────────────────────────────────────────

function StepRow({
  step,
  onAction,
  updating,
}: {
  step: Step;
  onAction: (stepId: string, status: StepStatus, notes?: string) => Promise<void>;
  updating: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [noteText, setNoteText] = useState(step.notes ?? "");
  const isUpdating = updating === step.id;

  const canAct = step.status !== "BLOCKED" && step.status !== "COMPLETED" && step.status !== "SKIPPED";

  const statusIcon = () => {
    if (step.status === "COMPLETED") return <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />;
    if (step.status === "SKIPPED")   return <SkipForward  size={18} className="text-slate-400 flex-shrink-0" />;
    if (step.status === "BLOCKED")   return <Lock         size={18} className="text-red-400 flex-shrink-0" />;
    if (step.status === "IN_PROGRESS") return <Clock      size={18} className="text-blue-500 flex-shrink-0" />;
    return <Circle size={18} className="text-muted-foreground flex-shrink-0" />;
  };

  return (
    <div className={cn(
      "border border-border rounded-xl overflow-hidden transition-all duration-150",
      step.status === "COMPLETED" && "opacity-70",
      step.status === "BLOCKED" && "opacity-50",
    )}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
        aria-expanded={open}
      >
        <div className="pt-0.5">{statusIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium leading-snug", step.status === "COMPLETED" && "line-through text-muted-foreground")}>
            {step.title}
          </p>
          {step.status === "BLOCKED" && (
            <p className="text-[11px] text-red-500 mt-0.5">Complete earlier steps to unlock this one</p>
          )}
          {step.status === "IN_PROGRESS" && (
            <p className="text-[11px] text-blue-500 mt-0.5">In progress</p>
          )}
          {step.completedAt && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Completed {new Date(step.completedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        {step.documentRequired && (
          <FileText size={14} className={cn("flex-shrink-0 mt-0.5", step.documentCollected ? "text-emerald-500" : "text-amber-500")} aria-label="Document required" />
        )}
        {open ? <ChevronDown size={16} className="flex-shrink-0 text-muted-foreground mt-0.5" /> : <ChevronRight size={16} className="flex-shrink-0 text-muted-foreground mt-0.5" />}
      </button>

      {open && (
        <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-3">
          {step.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          )}
          {step.documentRequired && (
            <div className={cn(
              "flex items-start gap-2 rounded-lg px-3 py-2 text-xs",
              step.documentCollected ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700",
            )}>
              <FileText size={14} className="flex-shrink-0 mt-0.5" aria-hidden />
              <span>
                <span className="font-medium">Document needed: </span>
                {step.documentLabel ?? "Document required — your coordinator will collect this"}
              </span>
            </div>
          )}

          {/* Note input */}
          <div>
            <label htmlFor={`note-${step.id}`} className="text-xs text-muted-foreground block mb-1">Your notes (optional)</label>
            <textarea
              id={`note-${step.id}`}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              rows={2}
              placeholder="Add a note…"
              className="input-base text-xs w-full resize-none"
            />
          </div>

          {/* Actions */}
          {canAct && (
            <div className="flex flex-wrap gap-2">
              {step.status !== "IN_PROGRESS" && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => onAction(step.id, "IN_PROGRESS", noteText || undefined)}
                  className="btn-ghost text-xs flex items-center gap-1.5"
                >
                  {isUpdating ? <Loader2 size={12} className="animate-spin" aria-hidden /> : <Clock size={12} aria-hidden />}
                  Mark In Progress
                </button>
              )}
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onAction(step.id, "COMPLETED", noteText || undefined)}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                {isUpdating ? <Loader2 size={12} className="animate-spin" aria-hidden /> : <CheckCircle2 size={12} aria-hidden />}
                Mark Complete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── WorkflowCard ─────────────────────────────────────────────────────────────

function WorkflowCard({ wf, onUpdate }: { wf: Workflow; onUpdate: () => void }) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const progress = pct(wf.steps);
  const groups = groupByCategory(wf.steps);
  const Icon = ENTITY_ICON[wf.entityType] ?? ClipboardList;

  const handleAction = useCallback(async (stepId: string, status: StepStatus, notes?: string) => {
    setUpdating(stepId);
    setError("");
    try {
      const res = await fetch(`/api/onboarding/${wf.id}/steps`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, status, ...(notes ? { notes } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update step");
      } else {
        onUpdate();
      }
    } finally {
      setUpdating(null);
    }
  }, [wf.id, onUpdate]);

  const completedCount = wf.steps.filter(s => s.status === "COMPLETED" || s.status === "SKIPPED").length;
  const total = wf.steps.length;
  const done = wf.status === "COMPLETED";

  return (
    <div className="section-card">
      {/* Header */}
      <div className="section-card-header flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-navy-900 border border-gold/20 flex items-center justify-center flex-shrink-0">
            <Icon size={18} className="text-gold" aria-hidden />
          </div>
          <div>
            <h2 className="font-semibold text-sm">
              {ENTITY_LABEL[wf.entityType] ?? wf.entityType}
              {wf.type === "OFFBOARDING" && <span className="ml-2 text-red-500 text-xs">(Offboarding)</span>}
            </h2>
            <p className="text-xs text-muted-foreground">
              Started {new Date(wf.startDate).toLocaleDateString()}
              {wf.targetDate && ` · Due ${new Date(wf.targetDate).toLocaleDateString()}`}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          {done ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 text-sm font-semibold">
              <CheckCheck size={16} aria-hidden /> Complete
            </span>
          ) : (
            <span className="text-sm font-bold tabular-nums text-foreground">{progress}%</span>
          )}
          <p className="text-[11px] text-muted-foreground">{completedCount}/{total} steps</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 py-3 border-b border-border">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className={cn(
            "h-full rounded-full transition-all duration-500",
            done ? "bg-emerald-500" : "bg-gold",
            progress === 0  && "w-0",
            progress <= 10  && progress > 0  && "w-[10%]",
            progress <= 20  && progress > 10 && "w-1/5",
            progress <= 30  && progress > 20 && "w-[30%]",
            progress <= 40  && progress > 30 && "w-2/5",
            progress <= 50  && progress > 40 && "w-1/2",
            progress <= 60  && progress > 50 && "w-3/5",
            progress <= 70  && progress > 60 && "w-[70%]",
            progress <= 80  && progress > 70 && "w-4/5",
            progress <= 90  && progress > 80 && "w-[90%]",
            progress <= 99  && progress > 90 && "w-[95%]",
            progress === 100 && "w-full",
          )} />
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-3 flex items-center gap-2 bg-red-500/10 text-red-600 rounded-lg px-3 py-2 text-xs">
          <AlertCircle size={14} aria-hidden /> {error}
        </div>
      )}

      {/* Steps by category */}
      <div className="p-5 space-y-6">
        {Object.entries(groups).map(([cat, steps]) => {
          const cfg = CATEGORY_CONFIG[cat] ?? { label: cat, icon: ClipboardList, color: "text-slate-600" };
          const CatIcon = cfg.icon;
          const catDone = steps.filter(s => s.status === "COMPLETED" || s.status === "SKIPPED").length;
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <CatIcon size={14} className={cn(cfg.color, "flex-shrink-0")} aria-hidden />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{cfg.label}</span>
                <span className="text-[11px] text-muted-foreground ml-auto">{catDone}/{steps.length}</span>
              </div>
              <div className="space-y-2">
                {steps.map(step => (
                  <StepRow key={step.id} step={step} onAction={handleAction} updating={updating} />
                ))}
              </div>
            </div>
          );
        })}

        {done && (
          <div className="text-center py-4">
            <CheckCheck size={32} className="text-emerald-500 mx-auto mb-2" aria-hidden />
            <p className="text-sm font-semibold text-emerald-600">Onboarding complete!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Completed {wf.completedAt ? new Date(wf.completedAt).toLocaleDateString() : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyOnboardingPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [delegated, setDelegated] = useState<Workflow[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/onboarding/mine");
      if (res.ok) {
        const { data } = await res.json() as { data: { myWorkflows: Workflow[]; delegatedWorkflows: Workflow[] } };
        setWorkflows(data.myWorkflows ?? []);
        setDelegated(data.delegatedWorkflows ?? []);
      } else {
        setError("Failed to load your onboarding.");
      }
    } catch {
      setError("Network error. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 size={28} className="animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" aria-hidden />
        <p className="text-sm text-muted-foreground">{error}</p>
        <button type="button" onClick={load} className="btn-ghost text-sm mt-3 flex items-center gap-2 mx-auto">
          <RefreshCw size={14} aria-hidden /> Try again
        </button>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <div className="empty-state">
          <div className="empty-state-icon">
            <ClipboardList size={24} className="text-muted-foreground" aria-hidden />
          </div>
          <h2 className="text-base font-semibold mt-3">No onboarding assigned yet</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your onboarding checklist will appear here once it&apos;s set up by your coordinator.
          </p>
        </div>
      </div>
    );
  }

  const active = workflows.filter(w => w.status !== "COMPLETED" && w.status !== "CANCELLED");
  const completed = workflows.filter(w => w.status === "COMPLETED");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">My Onboarding</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Complete each step to finish your onboarding. Steps unlock in order.
          </p>
        </div>
        <button type="button" onClick={load} className="btn-ghost text-xs flex items-center gap-1.5" aria-label="Refresh">
          <RefreshCw size={14} aria-hidden /> Refresh
        </button>
      </div>

      {active.map(wf => (
        <WorkflowCard key={wf.id} wf={wf} onUpdate={load} />
      ))}

      {completed.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Completed</p>
          {completed.map(wf => (
            <WorkflowCard key={wf.id} wf={wf} onUpdate={load} />
          ))}
        </div>
      )}
    </div>
  );
}
