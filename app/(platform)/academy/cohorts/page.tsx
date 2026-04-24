"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users, Plus, Search, Edit2, Trash2, X, Calendar,
  CheckCircle2, Clock, PlayCircle, PauseCircle, ChevronDown,
  BookOpen, UserPlus, Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CohortStatus = "UPCOMING" | "ACTIVE" | "COMPLETED" | "PAUSED";

interface CohortMember {
  id: string;
  name: string | null;
  email: string | null;
  progress: number;
  status: "ENROLLED" | "COMPLETED" | "DROPPED";
  employee?: { id: string; firstName: string; lastName: string; title: string | null } | null;
}

interface Cohort {
  id: string;
  name: string;
  code: string | null;
  track: string | null;
  description: string | null;
  status: CohortStatus;
  startDate: string | null;
  endDate: string | null;
  capacity: number | null;
  courseIds: string[];
  _count: { members: number };
  completedMembers: { id: string }[];
}

interface CohortDetail extends Omit<Cohort, "completedMembers"> {
  members: CohortMember[];
  completedMembers: { id: string }[];
}

const STATUS_CONFIG: Record<CohortStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  UPCOMING:  { label: "Upcoming",  icon: Clock,        color: "text-amber-600",        bg: "bg-amber-500/10",  border: "border-amber-500/20" },
  ACTIVE:    { label: "Active",    icon: PlayCircle,   color: "text-green-600",        bg: "bg-green-500/10",  border: "border-green-500/20" },
  COMPLETED: { label: "Completed", icon: CheckCircle2, color: "text-blue-600",         bg: "bg-blue-500/10",   border: "border-blue-500/20" },
  PAUSED:    { label: "Paused",    icon: PauseCircle,  color: "text-muted-foreground", bg: "bg-muted",         border: "border-border" },
};

const EMPTY_FORM = {
  name: "", code: "", track: "", description: "",
  status: "UPCOMING" as CohortStatus,
  startDate: "", endDate: "", capacity: "",
};

export default function CohortsPage() {
  const [cohorts, setCohorts]   = useState<Cohort[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterStatus, setFilterStatus] = useState<CohortStatus | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]   = useState<Cohort | null>(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedCohort, setExpandedCohort] = useState<CohortDetail | null>(null);
  const [addMemberName, setAddMemberName]   = useState("");
  const [addMemberEmail, setAddMemberEmail] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cohorts");
      if (res.ok) {
        const data = await res.json();
        // API returns `members` (completed filter) — map to `completedMembers` for type safety
        setCohorts(data.map((c: Cohort & { members: { id: string }[] }) => ({ ...c, completedMembers: c.members })));
      }
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  const loadExpanded = async (id: string) => {
    const res = await fetch(`/api/cohorts/${id}`);
    if (res.ok) setExpandedCohort(await res.json());
  };

  const filtered = useMemo(() => cohorts.filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (search && !`${c.name} ${c.track ?? ""} ${c.code ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [cohorts, filterStatus, search]);

  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setError(""); setModalOpen(true); }
  function openEdit(c: Cohort) {
    setEditing(c);
    setForm({
      name: c.name, code: c.code ?? "", track: c.track ?? "",
      description: c.description ?? "", status: c.status,
      startDate: c.startDate ? c.startDate.split("T")[0]! : "",
      endDate:   c.endDate   ? c.endDate.split("T")[0]!   : "",
      capacity:  c.capacity != null ? String(c.capacity) : "",
    });
    setError(""); setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Cohort name is required."); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        name: form.name, code: form.code || null, track: form.track || null,
        description: form.description || null, status: form.status,
        startDate: form.startDate || null, endDate: form.endDate || null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
      };
      const res = editing
        ? await fetch(`/api/cohorts/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/cohorts",                { method: "POST",  headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); setError(d.message ?? "Save failed"); return; }
      setModalOpen(false);
      await load();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this cohort?")) return;
    await fetch(`/api/cohorts/${id}`, { method: "DELETE" });
    await load();
  }

  async function toggleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); setExpandedCohort(null); return; }
    setExpandedId(id);
    await loadExpanded(id);
  }

  async function addMember(cohortId: string) {
    if (!addMemberName.trim()) return;
    await fetch(`/api/cohorts/${cohortId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_member", name: addMemberName, email: addMemberEmail || undefined }),
    });
    setAddMemberName(""); setAddMemberEmail("");
    await loadExpanded(cohortId);
  }

  async function updateMemberProgress(cohortId: string, memberId: string, progress: number) {
    await fetch(`/api/cohorts/${cohortId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_member", memberId, progress }),
    });
    await loadExpanded(cohortId);
  }

  const totalEnrolled  = cohorts.reduce((s, c) => s + c._count.members, 0);
  const totalCompleted = cohorts.reduce((s, c) => s + c.completedMembers.length, 0);
  const activeCohorts  = cohorts.filter((c) => c.status === "ACTIVE").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Users size={18} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Cohorts</h1>
            <p className="text-xs text-muted-foreground">Manage training cohorts — track enrollment, progress, and completion</p>
          </div>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-sm">
          <Plus size={14} /> New Cohort
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Cohorts",  val: cohorts.length, icon: Users,       color: "text-purple-600", bg: "bg-purple-500/10", border: "border-purple-500/20" },
          { label: "Active",         val: activeCohorts,  icon: PlayCircle,  color: "text-green-600",  bg: "bg-green-500/10",  border: "border-green-500/20" },
          { label: "Total Enrolled", val: totalEnrolled,  icon: UserPlus,    color: "text-blue-600",   bg: "bg-blue-500/10",   border: "border-blue-500/20" },
          { label: "Completions",    val: totalCompleted, icon: Award,       color: "text-gold",       bg: "bg-gold/10",       border: "border-gold/20" },
        ].map(({ label, val, icon: Icon, color, bg, border }) => (
          <div key={label} className="section-card p-4 flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center border", bg, border)}><Icon size={16} className={color} /></div>
            <div><p className="text-lg font-bold">{val}</p><p className="text-xs text-muted-foreground">{label}</p></div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="input-base pl-8 text-sm w-full" placeholder="Search cohorts…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as CohortStatus | "all")} aria-label="Filter by status" className="input-base text-sm">
          <option value="all">All Statuses</option>
          {(["UPCOMING","ACTIVE","COMPLETED","PAUSED"] as CohortStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="section-card p-12 text-center text-sm text-muted-foreground">Loading cohorts…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={28} className="text-muted-foreground/40" /></div>
          <p className="text-sm font-medium">No cohorts yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create cohorts to group trainees by program and track their progress</p>
          <button type="button" onClick={openCreate} className="btn-primary mt-4 text-sm px-4 py-2 flex items-center gap-1.5 mx-auto">
            <Plus size={14} /> New Cohort
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((cohort) => {
            const cfg = STATUS_CONFIG[cohort.status];
            const StatusIcon = cfg.icon;
            const completionRate = cohort._count.members > 0
              ? Math.round((cohort.completedMembers.length / cohort._count.members) * 100) : 0;
            const isExpanded = expandedId === cohort.id;
            return (
              <div key={cohort.id} className="section-card overflow-hidden">
                <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => toggleExpand(cohort.id)}>
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center border flex-shrink-0", cfg.bg, cfg.border)}>
                    <StatusIcon size={16} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-semibold">{cohort.name}</p>
                      {cohort.code && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">{cohort.code}</span>}
                      <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full border", cfg.color, cfg.bg, cfg.border)}>{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {cohort.track && <span className="flex items-center gap-1"><BookOpen size={10} />{cohort.track}</span>}
                      {cohort.startDate && <span className="flex items-center gap-1"><Calendar size={10} />{new Date(cohort.startDate).toLocaleDateString()}</span>}
                      <span className="flex items-center gap-1"><Users size={10} />{cohort._count.members}{cohort.capacity ? `/${cohort.capacity}` : ""} enrolled</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-lg font-bold">{completionRate}%</p>
                    <p className="text-[10px] text-muted-foreground">completion</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(cohort); }} aria-label="Edit" className="p-1.5 rounded hover:bg-muted">
                      <Edit2 size={13} className="text-muted-foreground" />
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(cohort.id); }} aria-label="Delete" className="p-1.5 rounded hover:bg-red-500/10">
                      <Trash2 size={13} className="text-red-500/70" />
                    </button>
                    <ChevronDown size={14} className={cn("text-muted-foreground transition-transform ml-1", isExpanded && "rotate-180")} />
                  </div>
                </div>

                {cohort._count.members > 0 && (
                  <div className="px-4 pb-2">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all [width:var(--prog)]" style={{"--prog": `${completionRate}%`} as React.CSSProperties} />
                    </div>
                  </div>
                )}

                {isExpanded && expandedCohort?.id === cohort.id && (
                  <div className="border-t border-border p-4 space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Members ({expandedCohort._count.members})</h3>
                    {expandedCohort.members.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No members yet — add the first one below</p>
                    ) : (
                      <div className="space-y-2">
                        {expandedCohort.members.map((m) => {
                          const initials = m.employee
                            ? `${m.employee.firstName[0]}${m.employee.lastName[0]}`
                            : (m.name ?? "?").slice(0, 2);
                          return (
                            <div key={m.id} className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] font-bold text-purple-600">{initials.toUpperCase()}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium">
                                  {m.employee ? `${m.employee.firstName} ${m.employee.lastName}` : m.name}
                                </p>
                                <div className="h-1 bg-muted rounded-full overflow-hidden max-w-[100px] mt-0.5">
                                  <div className="h-full bg-green-500 rounded-full [width:var(--prog)]" style={{"--prog": `${m.progress}%`} as React.CSSProperties} />
                                </div>
                              </div>
                              <input
                                type="range" min={0} max={100} value={m.progress}
                                aria-label="Progress"
                                className="w-20 accent-green-500"
                                onChange={(e) => updateMemberProgress(cohort.id, m.id, parseInt(e.target.value))}
                              />
                              <span className="text-[10px] text-muted-foreground w-8 text-right">{m.progress}%</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <input className="input-base text-xs flex-1" placeholder="Member name…" value={addMemberName} onChange={(e) => setAddMemberName(e.target.value)} />
                      <input className="input-base text-xs w-36 hidden sm:block" placeholder="Email (optional)" value={addMemberEmail} onChange={(e) => setAddMemberEmail(e.target.value)} />
                      <button type="button" onClick={() => addMember(cohort.id)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 whitespace-nowrap">
                        <UserPlus size={12} /> Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold">{editing ? "Edit Cohort" : "New Cohort"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close"><X size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <p className="text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Cohort Name *</label>
                  <input className="input-base w-full" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Spring 2026 Cohort" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Code</label>
                  <input className="input-base w-full font-mono" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="SPR-26" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Track</label>
                  <input className="input-base w-full" value={form.track} onChange={(e) => setForm((f) => ({ ...f, track: e.target.value }))} placeholder="Audit Fundamentals" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                  <select className="input-base w-full" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as CohortStatus }))} aria-label="Status">
                    {(["UPCOMING","ACTIVE","COMPLETED","PAUSED"] as CohortStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Capacity</label>
                  <input type="number" className="input-base w-full" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} placeholder="20" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Date</label>
                  <input type="date" aria-label="Start date" className="input-base w-full" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">End Date</label>
                  <input type="date" aria-label="End date" className="input-base w-full" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                  <textarea className="input-base w-full" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What will this cohort cover?" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost px-4 py-2 text-sm rounded-lg border border-border">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} className="btn-primary px-4 py-2 text-sm">
                {saving ? "Saving…" : editing ? "Save Changes" : "Create Cohort"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
