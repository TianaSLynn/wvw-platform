"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, UserPlus, CheckCircle, Circle, Clock, AlertCircle,
  Plus, X, Users, Building2, GraduationCap,
  BookOpen, Shield, Cpu, Smile, FileCheck, SkipForward,
  Loader2, RefreshCw, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type EntityType = "EMPLOYEE" | "CLIENT" | "STUDENT";
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
  blockedByStepId?: string | null;
  assignedTo?: { firstName: string; lastName: string } | null;
};

type Workflow = {
  id: string;
  type: WorkflowType;
  entityType: EntityType;
  status: string;
  startDate: string;
  targetDate?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  studentName?: string | null;
  employee?: { id: string; firstName: string; lastName: string; title?: string | null; department?: string | null; employmentStatus: string } | null;
  client?: { id: string; name: string; industry?: string | null } | null;
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

type Client = { id: string; name: string; industry?: string | null };

// ─── Config ───────────────────────────────────────────────────────────────────

const ENTITY_CONFIG: Record<EntityType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  EMPLOYEE: { label: "Employee",  icon: Users,          color: "text-blue-600",    bg: "bg-blue-500/10" },
  CLIENT:   { label: "Client",    icon: Building2,      color: "text-gold",        bg: "bg-gold/10" },
  STUDENT:  { label: "Student",   icon: GraduationCap,  color: "text-violet-600",  bg: "bg-violet-500/10" },
};

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

type CreateForm = {
  entityType: EntityType;
  employeeId: string;
  clientId: string;
  studentName: string;
  studentEmail: string;
  type: "ONBOARDING" | "OFFBOARDING";
  targetDate: string;
  notes: string;
  useTemplate: boolean;
};

const DEFAULT_FORM: CreateForm = {
  entityType: "EMPLOYEE", employeeId: "", clientId: "",
  studentName: "", studentEmail: "",
  type: "ONBOARDING", targetDate: "", notes: "", useTemplate: true,
};

export default function OnboardingWorkflowPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients]     = useState<Client[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeId, setActiveId]   = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"ONBOARDING" | "OFFBOARDING" | "all">("all");
  const [creating, setCreating]   = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(DEFAULT_FORM);
  const [saving, setSaving]       = useState(false);
  const [createError, setCreateError] = useState("");
  const [updatingStep, setUpdatingStep] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, eRes, cRes] = await Promise.all([
        fetch(`/api/onboarding${typeFilter !== "all" ? `?type=${typeFilter}` : ""}`),
        fetch("/api/workforce"),
        fetch("/api/clients"),
      ]);
      if (wRes.ok) setWorkflows((await wRes.json()).data);
      if (eRes.ok) setEmployees((await eRes.json()).data);
      if (cRes.ok) setClients((await cRes.json()).data);
    } finally { setLoading(false); }
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  const active = workflows.find((w) => w.id === activeId) ?? workflows[0] ?? null;

  function workflowLabel(wf: Workflow) {
    if (wf.entityType === "EMPLOYEE" && wf.employee) return `${wf.employee.firstName} ${wf.employee.lastName}`;
    if (wf.entityType === "CLIENT" && wf.client) return wf.client.name;
    if (wf.entityType === "STUDENT") return wf.studentName ?? "Student";
    return "Workflow";
  }

  function workflowSubLabel(wf: Workflow) {
    if (wf.entityType === "EMPLOYEE" && wf.employee) return wf.employee.title ?? "";
    if (wf.entityType === "CLIENT" && wf.client) return wf.client.industry ?? "";
    return "";
  }

  async function handleCreate() {
    const { entityType, employeeId, clientId, studentName, studentEmail, type, targetDate, notes, useTemplate } = createForm;
    if (entityType === "EMPLOYEE" && !employeeId) return setCreateError("Select an employee.");
    if (entityType === "CLIENT" && !clientId) return setCreateError("Select a client.");
    if (entityType === "STUDENT" && !studentName) return setCreateError("Enter student name.");
    setSaving(true);
    setCreateError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          employeeId:   employeeId  || undefined,
          clientId:     clientId    || undefined,
          studentName:  studentName || undefined,
          studentEmail: studentEmail || undefined,
          type,
          targetDate:  targetDate || null,
          notes:       notes || null,
          useTemplate,
        }),
      });
      if (res.ok) {
        const { data: wf } = await res.json() as { data: Workflow };
        setCreating(false);
        setCreateForm(DEFAULT_FORM);
        await load();
        setActiveId(wf.id);
      } else {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setCreateError(d.error ?? "Failed to create workflow.");
      }
    } finally { setSaving(false); }
  }

  async function updateStep(workflowId: string, stepId: string, status: StepStatus) {
    setUpdatingStep(stepId);
    setStepError(null);
    try {
      const res = await fetch(`/api/onboarding/${workflowId}/steps`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, status }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setStepError(d.error ?? "Could not update step.");
        setTimeout(() => setStepError(null), 5000);
      } else {
        await load();
      }
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
              const isActiveWf = wf.id === (activeId ?? workflows[0]?.id);
              const eCfg = ENTITY_CONFIG[wf.entityType] ?? ENTITY_CONFIG.EMPLOYEE;
              const EntityIcon = eCfg.icon;
              const label = workflowLabel(wf);
              const sub = workflowSubLabel(wf);
              const blockedCount = wf.steps.filter(s => s.status === "BLOCKED").length;
              return (
                <button
                  key={wf.id}
                  type="button"
                  onClick={() => setActiveId(wf.id)}
                  className={cn(
                    "w-full text-left section-card p-3 transition-all hover:shadow-md",
                    isActiveWf && "ring-2 ring-gold/40"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0", eCfg.bg)}>
                      <EntityIcon size={13} className={eCfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{label}</p>
                      <p className="text-[10px] text-muted-foreground">{eCfg.label} · {wf.type === "ONBOARDING" ? "Onboarding" : "Offboarding"}</p>
                    </div>
                    {wf.status === "COMPLETED"
                      ? <CheckCircle size={12} className="text-emerald-600 flex-shrink-0" />
                      : blockedCount > 0
                        ? <span className="text-[9px] font-medium text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">{blockedCount} blocked</span>
                        : null}
                  </div>
                  {sub && <p className="text-[10px] text-muted-foreground truncate mb-1.5">{sub}</p>}
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
              {/* Step error banner */}
              {stepError && (
                <div className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-600 flex items-center gap-2">
                  <Lock size={12} /> {stepError}
                </div>
              )}

              {/* Workflow header */}
              <div className="section-card p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-base font-semibold">{workflowLabel(active)}</h2>
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                        active.type === "ONBOARDING"
                          ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
                          : "text-red-600 bg-red-500/10 border-red-500/20"
                      )}>
                        {ENTITY_CONFIG[active.entityType]?.label ?? active.entityType} · {active.type === "ONBOARDING" ? "Onboarding" : "Offboarding"}
                      </span>
                      {active.status === "COMPLETED" && (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-0.5">
                          <CheckCircle size={9} /> Complete
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{workflowSubLabel(active)}</p>
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
                        const isBlocked = step.status === "BLOCKED";
                        return (
                          <div key={step.id} className={cn(
                            "flex items-start gap-3 px-4 py-3 transition-colors",
                            step.status === "COMPLETED" && "bg-emerald-500/5",
                            step.status === "SKIPPED" && "opacity-50",
                            isBlocked && "opacity-60 bg-red-500/5",
                          )}>
                            {/* Status toggle — disabled when BLOCKED */}
                            <button
                              type="button"
                              disabled={isUpdating || isBlocked}
                              onClick={() => {
                                if (isBlocked) return;
                                const next: StepStatus =
                                  step.status === "PENDING"     ? "IN_PROGRESS"
                                  : step.status === "IN_PROGRESS" ? "COMPLETED"
                                  : step.status === "COMPLETED"   ? "PENDING"
                                  : "PENDING";
                                updateStep(active.id, step.id, next);
                              }}
                              aria-label={isBlocked ? "Step is blocked" : `Mark step ${step.status === "COMPLETED" ? "pending" : "complete"}`}
                              className={cn(
                                "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all",
                                !isBlocked && "hover:scale-110",
                                isBlocked ? "cursor-not-allowed" : "cursor-pointer",
                                cfg.bg
                              )}
                            >
                              {isUpdating
                                ? <Loader2 size={11} className="animate-spin text-muted-foreground" />
                                : isBlocked
                                  ? <Lock size={10} className="text-red-500" />
                                  : <StatusIcon size={11} className={cfg.color} />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-medium leading-snug", step.status === "COMPLETED" && "line-through text-muted-foreground")}>{step.title}</p>
                              {isBlocked && (
                                <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1">
                                  <Lock size={9} /> Complete the previous step to unlock this
                                </p>
                              )}
                              {!isBlocked && step.description && (
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
                              )}
                              {step.notes && (
                                <p className="text-[11px] text-blue-600 mt-1 italic">{step.notes}</p>
                              )}
                            </div>

                            {/* Quick actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!isBlocked && step.status !== "SKIPPED" && step.status !== "COMPLETED" && (
                                <button
                                  type="button"
                                  onClick={() => updateStep(active.id, step.id, "SKIPPED")}
                                  aria-label="Skip step"
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
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
                  {active.employee && (
                    <Link href={`/workforce/${active.employee.id}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground p-2 rounded-lg border border-border hover:bg-muted transition-colors">
                      <Users size={12} /> Employee Profile
                    </Link>
                  )}
                  {active.client && (
                    <Link href={`/clients/${active.client.id}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground p-2 rounded-lg border border-border hover:bg-muted transition-colors">
                      <Building2 size={12} /> Client Profile
                    </Link>
                  )}
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
              <h2 className="text-base font-semibold">Start Onboarding Workflow</h2>
              <button type="button" onClick={() => { setCreating(false); setCreateForm(DEFAULT_FORM); setCreateError(""); }} aria-label="Close">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            <div className="p-6 space-y-4">

              {/* Entity type selector */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Who is this for?</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["EMPLOYEE", "CLIENT", "STUDENT"] as const).map((et) => {
                    const ec = ENTITY_CONFIG[et];
                    const EIcon = ec.icon;
                    return (
                      <button key={et} type="button" onClick={() => setCreateForm(f => ({ ...f, entityType: et }))}
                        className={cn("py-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 transition-all",
                          createForm.entityType === et
                            ? `${ec.bg} border-current ${ec.color}`
                            : "border-border text-muted-foreground hover:bg-muted"
                        )}>
                        <EIcon size={14} />
                        {ec.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Entity picker based on type */}
              {createForm.entityType === "EMPLOYEE" && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Employee *</label>
                  <select className="input-base w-full" value={createForm.employeeId} onChange={(e) => setCreateForm(f => ({ ...f, employeeId: e.target.value }))} aria-label="Select employee">
                    <option value="">Select employee…</option>
                    {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}{e.title ? ` — ${e.title}` : ""}</option>)}
                  </select>
                </div>
              )}
              {createForm.entityType === "CLIENT" && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Client *</label>
                  <select className="input-base w-full" value={createForm.clientId} onChange={(e) => setCreateForm(f => ({ ...f, clientId: e.target.value }))} aria-label="Select client">
                    <option value="">Select client…</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.industry ? ` — ${c.industry}` : ""}</option>)}
                  </select>
                </div>
              )}
              {createForm.entityType === "STUDENT" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Student Name *</label>
                    <input className="input-base w-full" placeholder="Full name" value={createForm.studentName} onChange={(e) => setCreateForm(f => ({ ...f, studentName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Student Email</label>
                    <input type="email" className="input-base w-full" placeholder="email@example.com" value={createForm.studentEmail} onChange={(e) => setCreateForm(f => ({ ...f, studentEmail: e.target.value }))} />
                  </div>
                </div>
              )}

              {/* Workflow type (employee only — clients/students always onboarding) */}
              {createForm.entityType === "EMPLOYEE" && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Workflow Type</label>
                  <div className="flex gap-2">
                    {(["ONBOARDING", "OFFBOARDING"] as const).map((t) => (
                      <button key={t} type="button" onClick={() => setCreateForm(f => ({ ...f, type: t }))}
                        className={cn("flex-1 py-2 text-xs font-medium rounded-lg border transition-all",
                          createForm.type === t
                            ? t === "ONBOARDING" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700" : "bg-red-500/10 border-red-500/30 text-red-700"
                            : "border-border text-muted-foreground hover:bg-muted")}>
                        {t === "ONBOARDING" ? "Onboarding" : "Offboarding"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Target Completion Date</label>
                <input type="date" aria-label="Target completion date" className="input-base w-full" value={createForm.targetDate} onChange={(e) => setCreateForm(f => ({ ...f, targetDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
                <textarea className="input-base w-full" rows={2} value={createForm.notes} onChange={(e) => setCreateForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special notes for this workflow…" />
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={createForm.useTemplate} onChange={(e) => setCreateForm(f => ({ ...f, useTemplate: e.target.checked }))} className="accent-gold mt-0.5 w-4 h-4" />
                <span className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Use WVW standard checklist</span><br />
                  Pre-fills sequential tasks for {createForm.entityType === "EMPLOYEE" ? (createForm.type === "ONBOARDING" ? "20-step employee onboarding" : "13-step offboarding") : createForm.entityType === "CLIENT" ? "11-step client onboarding" : "10-step student onboarding"} — steps unlock as you complete each phase
                </span>
              </label>
            </div>
            {createError && (
              <div className="mx-6 mb-0 -mt-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-600">{createError}</div>
            )}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
              <button type="button" onClick={() => { setCreating(false); setCreateForm(DEFAULT_FORM); setCreateError(""); }} className="btn-ghost px-4 py-2 text-sm rounded-lg border border-border">Cancel</button>
              <button type="button" onClick={handleCreate} disabled={saving} className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5">
                {saving ? <><Loader2 size={13} className="animate-spin" /> Creating…</> : <><Plus size={13} /> Start Workflow</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
