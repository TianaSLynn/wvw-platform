"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, UserPlus, CheckCircle, Circle, Clock, AlertCircle,
  Plus, ChevronDown, ChevronRight, X, Users, Building2,
  BookOpen, Shield, Cpu, Smile, FileCheck, SkipForward,
  Loader2, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type StepStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED" | "BLOCKED";
type WorkflowType = "ONBOARDING" | "OFFBOARDING";

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
  assignedTo?: { firstName: string; lastName: string } | null;
};

type Workflow = {
  id: string;
  type: WorkflowType;
  status: string;
  startDate: string;
  targetDate?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  employee: { id: string; firstName: string; lastName: string; title?: string | null; department?: string | null; employmentStatus: string };
  steps: Step[];
};

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  title?: string | null;
  department?: string | null;
  employmentStatus: string;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const STEP_STATUS_CONFIG: Record<StepStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PENDING:     { label: "Pending",     color: "text-muted-foreground", bg: "bg-muted",          icon: Circle },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-600",         bg: "bg-blue-500/10",    icon: Clock },
  COMPLETED:   { label: "Done",        color: "text-emerald-600",      bg: "bg-emerald-500/10", icon: CheckCircle },
  SKIPPED:     { label: "Skipped",     color: "text-slate-500",        bg: "bg-slate-500/10",   icon: SkipForward },
  BLOCKED:     { label: "Blocked",     color: "text-red-600",          bg: "bg-red-500/10",     icon: AlertCircle },
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  HR:       { label: "HR & Admin",   icon: Users,     color: "text-blue-600" },
  IT:       { label: "IT & Access",  icon: Cpu,       color: "text-violet-600" },
  TRAINING: { label: "Training",     icon: BookOpen,  color: "text-amber-600" },
  CULTURE:  { label: "Culture",      icon: Smile,     color: "text-emerald-600" },
  LEGAL:    { label: "Legal",        icon: Shield,    color: "text-red-600" },
  INTRO:    { label: "Intro",        icon: Users,     color: "text-sky-600" },
  GENERAL:  { label: "General",      icon: FileCheck, color: "text-slate-600" },
};

const CATEGORY_ORDER = ["HR", "IT", "TRAINING", "CULTURE", "LEGAL", "INTRO", "GENERAL"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingWorkflowPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeId, setActiveId]   = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<WorkflowType | "all">("all");
  const [creating, setCreating]   = useState(false);
  const [createForm, setCreateForm] = useState({ employeeId: "", type: "ONBOARDING" as WorkflowType, targetDate: "", notes: "", useTemplate: true });
  const [saving, setSaving]       = useState(false);
  const [updatingStep, setUpdatingStep] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, eRes] = await Promise.all([
        fetch(`/api/onboarding${typeFilter !== "all" ? `?type=${typeFilter}` : ""}`),
        fetch("/api/workforce"),
      ]);
      if (wRes.ok) setWorkflows((await wRes.json()).data);
      if (eRes.ok) setEmployees((await eRes.json()).data);
    } finally { setLoading(false); }
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  const active = workflows.find((w) => w.id === activeId) ?? workflows[0] ?? null;

  async function handleCreate() {
    if (!createForm.employeeId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId:  createForm.employeeId,
          type:        createForm.type,
          targetDate:  createForm.targetDate || null,
          notes:       createForm.notes || null,
          useTemplate: createForm.useTemplate,
        }),
      });
      if (res.ok) {
        const { data: wf } = await res.json() as { data: Workflow };
        setCreating(false);
        await load();
        setActiveId(wf.id);
      }
    } finally { setSaving(false); }
  }

  async function updateStep(workflowId: string, stepId: string, status: StepStatus) {
    setUpdatingStep(stepId);
    try {
      await fetch(`/api/onboarding/${workflowId}/steps`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, status }),
      });
      await load();
    } finally { setUpdatingStep(null); }
  }

  function progress(wf: Workflow) {
    const done = wf.steps.filter((s) => s.status === "COMPLETED" || s.status === "SKIPPED").length;
    return wf.steps.length > 0 ? Math.round((done / wf.steps.length) * 100) : 0;
  }

  // Group steps by category
  function groupedSteps(steps: Step[]) {
    const grouped: Record<string, Step[]> = {};
    for (const s of [...steps].sort((a, b) => a.sortOrder - b.sortOrder)) {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category]!.push(s);
    }
    return CATEGORY_ORDER.filter((c) => grouped[c]?.length).map((c) => ({ category: c, steps: grouped[c]! }));
  }

  // ── Category status summary ───────────────────────────────────────────────
  function catSummary(steps: Step[]) {
    const total = steps.length;
    const done  = steps.filter((s) => s.status === "COMPLETED" || s.status === "SKIPPED").length;
    if (done === total) return "done";
    if (done > 0) return "partial";
    return "pending";
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link href="/workforce" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft size={12} /> Back to Workforce
        </Link>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <UserPlus size={18} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Onboarding & Offboarding</h1>
              <p className="text-xs text-muted-foreground">Step-by-step workflows for every hire and departure</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(["all", "ONBOARDING", "OFFBOARDING"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTypeFilter(t)}
                  className={cn("px-3 py-1.5 text-xs font-medium", typeFilter === t ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}>
                  {t === "all" ? "All" : t === "ONBOARDING" ? "Onboarding" : "Offboarding"}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setCreating(true)} className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-sm">
              <Plus size={14} /> New Workflow
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="section-card p-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" /> Loading workflows…
        </div>
      ) : workflows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><UserPlus size={28} className="text-muted-foreground/40" /></div>
          <p className="text-sm font-medium">No workflows yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create a workflow for any employee to get a pre-built step checklist</p>
          <button type="button" onClick={() => setCreating(true)} className="btn-primary mt-4 text-sm px-4 py-2 flex items-center gap-1.5 mx-auto">
            <Plus size={14} /> New Workflow
          </button>
        </div>
      ) : (
        <div className="flex gap-4 items-start">
          {/* Left: workflow list */}
          <div className="w-72 flex-shrink-0 space-y-2">
            {workflows.map((wf) => {
              const pct = progress(wf);
              const isActive = wf.id === (activeId ?? workflows[0]?.id);
              const isOnboarding = wf.type === "ONBOARDING";
              return (
                <button
                  key={wf.id}
                  type="button"
                  onClick={() => setActiveId(wf.id)}
                  className={cn(
                    "w-full text-left section-card p-3 transition-all hover:shadow-md",
                    isActive && "ring-2 ring-gold/40"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0", isOnboarding ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700")}>
                      {wf.employee.firstName[0]}{wf.employee.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{wf.employee.firstName} {wf.employee.lastName}</p>
                      <p className="text-[10px] text-muted-foreground">{isOnboarding ? "Onboarding" : "Offboarding"}</p>
                    </div>
                    {wf.status === "COMPLETED" && <CheckCircle size={12} className="text-emerald-600 flex-shrink-0" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{wf.steps.filter((s) => s.status === "COMPLETED" || s.status === "SKIPPED").length}/{wf.steps.length} steps</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-emerald-500" : "bg-gold")} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: active workflow detail */}
          {active && (
            <div className="flex-1 min-w-0 space-y-4">
              {/* Workflow header */}
              <div className="section-card p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-base font-semibold">
                        {active.employee.firstName} {active.employee.lastName}
                      </h2>
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                        active.type === "ONBOARDING"
                          ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
                          : "text-red-600 bg-red-500/10 border-red-500/20"
                      )}>
                        {active.type === "ONBOARDING" ? "Onboarding" : "Offboarding"}
                      </span>
                      {active.status === "COMPLETED" && (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-0.5">
                          <CheckCircle size={9} /> Complete
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {active.employee.title ?? ""}
                      {active.employee.department ? ` · ${active.employee.department}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Started {new Date(active.startDate).toLocaleDateString()}</span>
                    {active.targetDate && <span>Target: {new Date(active.targetDate).toLocaleDateString()}</span>}
                    <button type="button" onClick={load} aria-label="Refresh" className="p-1 rounded hover:bg-muted">
                      <RefreshCw size={12} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{active.steps.filter((s) => s.status === "COMPLETED" || s.status === "SKIPPED").length} of {active.steps.length} steps complete</span>
                    <span>{progress(active)}% done</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", progress(active) === 100 ? "bg-emerald-500" : "bg-gold")} style={{ width: `${progress(active)}%` }} />
                  </div>
                </div>
              </div>

              {/* Steps by category */}
              {groupedSteps(active.steps).map(({ category, steps }) => {
                const catCfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG["GENERAL"]!;
                const CatIcon = catCfg.icon;
                const summary = catSummary(steps);
                return (
                  <div key={category} className="section-card overflow-hidden">
                    <div className="section-card-header flex items-center gap-2">
                      <CatIcon size={14} className={catCfg.color} />
                      <h3 className="text-sm font-semibold">{catCfg.label}</h3>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{steps.length}</span>
                      <div className="ml-auto flex items-center gap-1">
                        {summary === "done" && <span className="flex items-center gap-0.5 text-[10px] text-emerald-600"><CheckCircle size={10} /> Done</span>}
                        {summary === "partial" && <span className="text-[10px] text-amber-600">{steps.filter((s) => s.status === "COMPLETED" || s.status === "SKIPPED").length}/{steps.length}</span>}
                      </div>
                    </div>
                    <div className="divide-y divide-border/60">
                      {steps.map((step) => {
                        const cfg = STEP_STATUS_CONFIG[step.status];
                        const StatusIcon = cfg.icon;
                        const isUpdating = updatingStep === step.id;
                        return (
                          <div key={step.id} className={cn("flex items-start gap-3 px-4 py-3 transition-colors", step.status === "COMPLETED" && "bg-emerald-500/5", step.status === "SKIPPED" && "opacity-50")}>
                            {/* Status toggle */}
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => {
                                const next: StepStatus =
                                  step.status === "PENDING"     ? "IN_PROGRESS"
                                  : step.status === "IN_PROGRESS" ? "COMPLETED"
                                  : step.status === "COMPLETED"   ? "PENDING"
                                  : step.status === "BLOCKED"     ? "PENDING"
                                  : "PENDING";
                                updateStep(active.id, step.id, next);
                              }}
                              aria-label={`Mark step as ${step.status === "COMPLETED" ? "pending" : "complete"}`}
                              className={cn("mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-110", cfg.bg)}
                            >
                              {isUpdating ? <Loader2 size={11} className="animate-spin text-muted-foreground" /> : <StatusIcon size={11} className={cfg.color} />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-medium leading-snug", step.status === "COMPLETED" && "line-through text-muted-foreground")}>{step.title}</p>
                              {step.description && (
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
                              )}
                              {step.notes && (
                                <p className="text-[11px] text-blue-600 mt-1 italic">{step.notes}</p>
                              )}
                            </div>

                            {/* Quick actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {step.status !== "SKIPPED" && step.status !== "COMPLETED" && (
                                <button
                                  type="button"
                                  onClick={() => updateStep(active.id, step.id, "SKIPPED")}
                                  aria-label="Skip step"
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  title="Skip"
                                >
                                  <SkipForward size={11} />
                                </button>
                              )}
                              <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", cfg.color, cfg.bg)}>
                                {cfg.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Links to related platform areas */}
              <div className="section-card p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Connected Areas</p>
                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/workforce/${active.employee.id}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground p-2 rounded-lg border border-border hover:bg-muted transition-colors">
                    <Users size={12} /> Employee Profile
                  </Link>
                  <Link href="/academy/courses" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground p-2 rounded-lg border border-border hover:bg-muted transition-colors">
                    <BookOpen size={12} /> Assign Training
                  </Link>
                  <Link href="/policies" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground p-2 rounded-lg border border-border hover:bg-muted transition-colors">
                    <Shield size={12} /> Policy Acknowledgements
                  </Link>
                  <Link href="/community/announcements" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground p-2 rounded-lg border border-border hover:bg-muted transition-colors">
                    <Smile size={12} /> Post Announcement
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold">Start Workflow</h2>
              <button type="button" onClick={() => setCreating(false)} aria-label="Close"><X size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Employee *</label>
                <select className="input-base w-full" value={createForm.employeeId} onChange={(e) => setCreateForm((f) => ({ ...f, employeeId: e.target.value }))} aria-label="Select employee">
                  <option value="">Select employee…</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}{e.title ? ` — ${e.title}` : ""}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Workflow Type</label>
                <div className="flex gap-2">
                  {(["ONBOARDING", "OFFBOARDING"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setCreateForm((f) => ({ ...f, type: t }))}
                      className={cn("flex-1 py-2 text-xs font-medium rounded-lg border transition-all", createForm.type === t ? (t === "ONBOARDING" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700" : "bg-red-500/10 border-red-500/30 text-red-700") : "border-border text-muted-foreground hover:bg-muted")}>
                      {t === "ONBOARDING" ? "Onboarding" : "Offboarding"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Target Completion Date</label>
                <input type="date" className="input-base w-full" value={createForm.targetDate} onChange={(e) => setCreateForm((f) => ({ ...f, targetDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
                <textarea className="input-base w-full" rows={2} value={createForm.notes} onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any special notes for this workflow…" />
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={createForm.useTemplate} onChange={(e) => setCreateForm((f) => ({ ...f, useTemplate: e.target.checked }))} className="accent-gold mt-0.5 w-4 h-4" />
                <span className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Use WVW standard checklist</span><br />
                  Pre-fills {createForm.type === "ONBOARDING" ? "20" : "13"} steps covering HR, IT, training, culture & legal
                </span>
              </label>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
              <button type="button" onClick={() => setCreating(false)} className="btn-ghost px-4 py-2 text-sm rounded-lg border border-border">Cancel</button>
              <button type="button" onClick={handleCreate} disabled={saving || !createForm.employeeId} className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5">
                {saving ? <><Loader2 size={13} className="animate-spin" /> Creating…</> : <><Plus size={13} /> Start Workflow</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
