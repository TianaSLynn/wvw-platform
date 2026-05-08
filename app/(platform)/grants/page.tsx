"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Trophy, Plus, Search, Edit2, Trash2, X, DollarSign,
  Clock, User, ChevronDown, AlertCircle, CheckCircle,
  FileText, Filter, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type GrantStatus = "RESEARCHING" | "DRAFTING" | "SUBMITTED" | "UNDER_REVIEW" | "AWARDED" | "REJECTED" | "WITHDRAWN";

type Grant = {
  id: string;
  name: string;
  funder: string;
  programName?: string | null;
  description?: string | null;
  status: GrantStatus;
  amount?: number | null;
  amountAwarded?: number | null;
  deadline?: string | null;
  submittedAt?: string | null;
  decisionAt?: string | null;
  reportDueAt?: string | null;
  requirements?: string | null;
  notes?: string | null;
  assignedTo?: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<GrantStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  RESEARCHING:  { label: "Researching",   color: "text-slate-600",   bg: "bg-slate-500/10",   border: "border-slate-500/20",   icon: Search },
  DRAFTING:     { label: "Drafting",      color: "text-blue-600",    bg: "bg-blue-500/10",    border: "border-blue-500/20",    icon: FileText },
  SUBMITTED:    { label: "Submitted",     color: "text-amber-600",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   icon: Clock },
  UNDER_REVIEW: { label: "Under Review",  color: "text-purple-600",  bg: "bg-purple-500/10",  border: "border-purple-500/20",  icon: ChevronDown },
  AWARDED:      { label: "Awarded",       color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle },
  REJECTED:     { label: "Rejected",      color: "text-red-600",     bg: "bg-red-500/10",     border: "border-red-500/20",     icon: AlertCircle },
  WITHDRAWN:    { label: "Withdrawn",     color: "text-muted-foreground", bg: "bg-muted",      border: "border-border",         icon: X },
};

const PIPELINE_ORDER: GrantStatus[] = ["RESEARCHING","DRAFTING","SUBMITTED","UNDER_REVIEW","AWARDED","REJECTED","WITHDRAWN"];

const EMPTY_FORM = {
  name: "", funder: "", programName: "", description: "", status: "RESEARCHING" as GrantStatus,
  amount: "", deadline: "", decisionAt: "", reportDueAt: "", requirements: "", notes: "",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GrantsPage() {
  const [grants, setGrants]     = useState<Grant[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterStatus, setFilterStatus] = useState<GrantStatus | "all">("all");
  const [view, setView]         = useState<"pipeline" | "list">("pipeline");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]   = useState<Grant | null>(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/grants");
      if (res.ok) setGrants((await res.json()).data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  const filtered = useMemo(() => grants.filter((g) => {
    if (filterStatus !== "all" && g.status !== filterStatus) return false;
    if (search && !`${g.name} ${g.funder} ${g.programName ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [grants, filterStatus, search]);

  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setError(""); setModalOpen(true); }
  function openEdit(g: Grant) {
    setEditing(g);
    setForm({
      name: g.name, funder: g.funder, programName: g.programName ?? "",
      description: g.description ?? "", status: g.status,
      amount: g.amount != null ? String(g.amount) : "",
      deadline: g.deadline ? g.deadline.split("T")[0]! : "",
      decisionAt: g.decisionAt ? g.decisionAt.split("T")[0]! : "",
      reportDueAt: g.reportDueAt ? g.reportDueAt.split("T")[0]! : "",
      requirements: g.requirements ?? "", notes: g.notes ?? "",
    });
    setError(""); setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.funder.trim()) { setError("Grant name and funder are required."); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        name: form.name, funder: form.funder,
        programName: form.programName || null, description: form.description || null,
        status: form.status, amount: form.amount ? parseFloat(form.amount) : null,
        deadline: form.deadline || null, decisionAt: form.decisionAt || null,
        reportDueAt: form.reportDueAt || null,
        requirements: form.requirements || null, notes: form.notes || null,
      };
      const res = editing
        ? await fetch(`/api/grants/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/grants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); setError(d.message ?? "Save failed"); return; }
      setModalOpen(false);
      await load();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this grant?")) return;
    await fetch(`/api/grants/${id}`, { method: "DELETE" });
    await load();
  }

  async function quickStatus(id: string, status: GrantStatus) {
    await fetch(`/api/grants/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    await load();
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalAmount   = grants.reduce((s, g) => s + (g.amount ?? 0), 0);
  const totalAwarded  = grants.filter((g) => g.status === "AWARDED").reduce((s, g) => s + (g.amountAwarded ?? g.amount ?? 0), 0);
  const upcomingDeadlines = grants.filter((g) => {
    if (!g.deadline || ["AWARDED","REJECTED","WITHDRAWN"].includes(g.status)) return false;
    return new Date(g.deadline) > new Date() && new Date(g.deadline) < new Date(Date.now() + 30 * 86400 * 1000);
  }).length;

  const daysUntil = (dateStr: string) => {
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
    if (days < 0) return <span className="text-red-500 text-[10px] font-medium">Overdue</span>;
    if (days === 0) return <span className="text-red-500 text-[10px] font-medium">Due today</span>;
    if (days <= 7) return <span className="text-amber-600 text-[10px] font-medium">{days}d left</span>;
    return <span className="text-muted-foreground text-[10px]">{days}d left</span>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Trophy size={18} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Grant Tracker</h1>
            <p className="text-xs text-muted-foreground">Track grant opportunities, applications, deadlines, and awarded funding</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button type="button" onClick={() => setView("pipeline")} className={cn("px-3 py-1.5 text-xs font-medium", view === "pipeline" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}>Pipeline</button>
            <button type="button" onClick={() => setView("list")} className={cn("px-3 py-1.5 text-xs font-medium", view === "list" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}>List</button>
          </div>
          <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-sm">
            <Plus size={14} /> Add Grant
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Grants", val: grants.length, icon: Trophy, color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          { label: "Total Requested", val: `$${totalAmount.toLocaleString()}`, icon: DollarSign, color: "text-gold", bg: "bg-gold/10", border: "border-gold/20" },
          { label: "Total Awarded", val: `$${totalAwarded.toLocaleString()}`, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          { label: "Deadlines (30d)", val: upcomingDeadlines, icon: AlertCircle, color: upcomingDeadlines > 0 ? "text-amber-600" : "text-muted-foreground", bg: upcomingDeadlines > 0 ? "bg-amber-500/10" : "bg-muted", border: upcomingDeadlines > 0 ? "border-amber-500/20" : "border-border" },
        ].map(({ label, val, icon: Icon, color, bg, border }) => (
          <div key={label} className="section-card p-4 flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center border", bg, border)}>
              <Icon size={16} className={color} />
            </div>
            <div><p className="text-lg font-bold">{val}</p><p className="text-xs text-muted-foreground">{label}</p></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="input-base pl-8 text-sm w-full" placeholder="Search grants…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as GrantStatus | "all")} aria-label="Filter by status" className="input-base text-sm">
          <option value="all">All Statuses</option>
          {PIPELINE_ORDER.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="section-card p-12 text-center text-sm text-muted-foreground">Loading grants…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Trophy size={28} className="text-muted-foreground/40" /></div>
          <p className="text-sm font-medium">No grants yet</p>
          <p className="text-xs text-muted-foreground mt-1">Track grant opportunities from initial research through award</p>
          <button type="button" onClick={openCreate} className="btn-primary mt-4 text-sm px-4 py-2 flex items-center gap-1.5 mx-auto">
            <Plus size={14} /> Add Grant
          </button>
        </div>
      ) : view === "pipeline" ? (
        /* Pipeline view */
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {PIPELINE_ORDER.map((status) => {
            const cfg = STATUS_CONFIG[status];
            const StatusIcon = cfg.icon;
            const colGrants = filtered.filter((g) => g.status === status);
            return (
              <div key={status} className="space-y-2">
                <div className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded-lg border", cfg.bg, cfg.border)}>
                  <StatusIcon size={11} className={cfg.color} />
                  <span className={cn("text-[10px] font-semibold flex-1", cfg.color)}>{cfg.label}</span>
                  <span className="text-[10px] text-muted-foreground bg-background/60 px-1 py-0.5 rounded-full">{colGrants.length}</span>
                </div>
                {colGrants.map((g) => (
                  <div key={g.id} className="section-card p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(g)}>
                    <p className="text-[11px] font-semibold text-foreground leading-tight mb-1">{g.name}</p>
                    <p className="text-[10px] text-muted-foreground mb-1.5 truncate">{g.funder}</p>
                    {g.amount && <p className="text-[10px] text-gold font-medium flex items-center gap-0.5"><DollarSign size={8} />{g.amount.toLocaleString()}</p>}
                    {g.deadline && <div className="mt-1 flex items-center gap-0.5"><Calendar size={8} className="text-muted-foreground" />{daysUntil(g.deadline)}</div>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="section-card overflow-hidden">
          <div className="section-card-header flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">All Grants</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{filtered.length}</span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((g) => {
              const cfg = STATUS_CONFIG[g.status];
              const StatusIcon = cfg.icon;
              return (
                <div key={g.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border", cfg.bg, cfg.border)}>
                    <StatusIcon size={14} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{g.name}</p>
                    <p className="text-xs text-muted-foreground">{g.funder}{g.programName ? ` · ${g.programName}` : ""}</p>
                  </div>
                  {g.amount && <span className="text-xs text-gold font-medium whitespace-nowrap">${g.amount.toLocaleString()}</span>}
                  {g.deadline && <div className="text-right">{daysUntil(g.deadline)}<p className="text-[9px] text-muted-foreground">deadline</p></div>}
                  <select
                    value={g.status}
                    onChange={(e) => quickStatus(g.id, e.target.value as GrantStatus)}
                    aria-label="Update grant status"
                    className={cn("text-[10px] font-medium px-2 py-1 rounded-lg border cursor-pointer", cfg.color, cfg.bg, cfg.border)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {PIPELINE_ORDER.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                  </select>
                  <button type="button" onClick={() => openEdit(g)} aria-label="Edit grant" className="p-1.5 rounded hover:bg-muted">
                    <Edit2 size={13} className="text-muted-foreground" />
                  </button>
                  <button type="button" onClick={() => handleDelete(g.id)} aria-label="Delete grant" className="p-1.5 rounded hover:bg-red-500/10">
                    <Trash2 size={13} className="text-red-500/70" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold">{editing ? "Edit Grant" : "Add Grant Opportunity"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close"><X size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && <p className="text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Grant Name *</label>
                  <input className="input-base w-full" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Community Innovation Fund" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Funder / Organization *</label>
                  <input className="input-base w-full" value={form.funder} onChange={(e) => setForm((f) => ({ ...f, funder: e.target.value }))} placeholder="e.g. Robert Wood Johnson Foundation" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Program Name</label>
                  <input className="input-base w-full" value={form.programName} onChange={(e) => setForm((f) => ({ ...f, programName: e.target.value }))} placeholder="Specific grant program" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                  <select className="input-base w-full" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as GrantStatus }))} aria-label="Grant status">
                    {PIPELINE_ORDER.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount Requested ($)</label>
                  <input type="number" className="input-base w-full" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="50000" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Application Deadline</label>
                  <input type="date" className="input-base w-full" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Decision Expected</label>
                  <input type="date" className="input-base w-full" value={form.decisionAt} onChange={(e) => setForm((f) => ({ ...f, decisionAt: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Report Due (if awarded)</label>
                  <input type="date" className="input-base w-full" value={form.reportDueAt} onChange={(e) => setForm((f) => ({ ...f, reportDueAt: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                <textarea className="input-base w-full" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What is this grant for?" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Requirements / Eligibility</label>
                <textarea className="input-base w-full" rows={3} value={form.requirements} onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))} placeholder="Key eligibility criteria, required documents, etc." />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
                <textarea className="input-base w-full" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Internal notes, contacts, reminders…" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost px-4 py-2 text-sm rounded-lg border border-border">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} className="btn-primary px-4 py-2 text-sm">
                {saving ? "Saving…" : editing ? "Save Changes" : "Add Grant"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
