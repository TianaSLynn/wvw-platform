"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import {
  Briefcase, Plus, Search, Filter, Users, MapPin, Clock,
  DollarSign, ExternalLink, Eye, Pencil, Trash2, ChevronDown,
  Circle, CheckCircle2, PauseCircle, XCircle, Star, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type JobType   = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "VOLUNTEER" | "FREELANCE";
type JobStatus = "DRAFT" | "PUBLISHED" | "PAUSED" | "CLOSED" | "FILLED";

interface JobPosting {
  id: string;
  title: string;
  type: JobType;
  status: JobStatus;
  department: string | null;
  location: string | null;
  remote: boolean;
  description: string;
  requirements: string | null;
  benefits: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryUnit: string | null;
  duration: string | null;
  isPaid: boolean | null;
  closingDate: string | null;
  tags: string[];
  externalUrls: string[];
  publishedAt: string | null;
  createdAt: string;
  postedBy: { firstName: string; lastName: string } | null;
  _count: { applications: number };
}

const TYPE_LABELS: Record<JobType, string> = {
  FULL_TIME: "Full-Time", PART_TIME: "Part-Time", CONTRACT: "Contract",
  INTERNSHIP: "Internship", VOLUNTEER: "Volunteer", FREELANCE: "Freelance",
};

const TYPE_COLORS: Record<JobType, string> = {
  FULL_TIME:  "bg-blue-500/10 text-blue-500 border-blue-500/20",
  PART_TIME:  "bg-purple-500/10 text-purple-500 border-purple-500/20",
  CONTRACT:   "bg-orange-500/10 text-orange-500 border-orange-500/20",
  INTERNSHIP: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  VOLUNTEER:  "bg-pink-500/10 text-pink-500 border-pink-500/20",
  FREELANCE:  "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
};

// User-facing status labels mapped from DB values
const STATUS_CONFIG: Record<JobStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  DRAFT:     { label: "Not Ready",  icon: Circle,       color: "text-muted-foreground", bg: "bg-muted/60",        border: "border-border"        },
  PAUSED:    { label: "Ready",      icon: PauseCircle,  color: "text-blue-500",         bg: "bg-blue-500/10",     border: "border-blue-500/20"   },
  PUBLISHED: { label: "Open",       icon: CheckCircle2, color: "text-green-500",        bg: "bg-green-500/10",    border: "border-green-500/20"  },
  CLOSED:    { label: "Closed",     icon: XCircle,      color: "text-red-500",          bg: "bg-red-500/10",      border: "border-red-500/20"    },
  FILLED:    { label: "Filled",     icon: Star,         color: "text-gold",             bg: "bg-gold/10",         border: "border-gold/20"       },
};

const STATUS_ORDER: JobStatus[] = ["DRAFT", "PAUSED", "PUBLISHED", "CLOSED", "FILLED"];

const EMPTY_FORM = {
  title: "", type: "CONTRACT" as JobType, department: "", location: "",
  remote: false, description: "", requirements: "", benefits: "",
  salaryMin: "", salaryMax: "", salaryUnit: "annual", duration: "",
  isPaid: true, closingDate: "", tags: "", externalUrls: "",
  status: "DRAFT" as "DRAFT" | "PUBLISHED",
};

function StatusPicker({ posting, onUpdate }: { posting: JobPosting; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CONFIG[posting.status];
  const Icon = cfg.icon;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function pick(newStatus: JobStatus) {
    if (newStatus === posting.status) { setOpen(false); return; }
    setBusy(true);
    await fetch(`/api/jobs/${posting.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setBusy(false);
    setOpen(false);
    onUpdate();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer select-none",
          cfg.bg, cfg.border, cfg.color,
          busy && "opacity-50 cursor-not-allowed"
        )}
      >
        <Icon size={11} />
        {cfg.label}
        <ChevronDown size={10} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[140px]">
          {STATUS_ORDER.map((s) => {
            const c = STATUS_CONFIG[s];
            const SIcon = c.icon;
            const isCurrent = s === posting.status;
            return (
              <button
                key={s}
                type="button"
                onClick={() => pick(s)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-muted",
                  isCurrent ? "font-semibold bg-muted/60" : "text-muted-foreground"
                )}
              >
                <SIcon size={11} className={c.color} />
                <span className={isCurrent ? c.color : ""}>{c.label}</span>
                {isCurrent && <Lock size={9} className="ml-auto text-muted-foreground/50" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function JobsPage() {
  const [postings, setPostings]         = useState<JobPosting[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [filterType, setFilterType]     = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [showForm, setShowForm]         = useState(false);
  const [editPosting, setEditPosting]   = useState<JobPosting | null>(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [saving, startSave]             = useTransition();
  const [activeId, setActiveId]         = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/jobs");
    if (res.ok) setPostings((await res.json()).data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setEditPosting(null); setForm(EMPTY_FORM); setShowForm(true); }

  function openEdit(p: JobPosting) {
    setEditPosting(p);
    setForm({
      title: p.title, type: p.type, department: p.department ?? "",
      location: p.location ?? "", remote: p.remote, description: p.description,
      requirements: p.requirements ?? "", benefits: p.benefits ?? "",
      salaryMin: p.salaryMin?.toString() ?? "", salaryMax: p.salaryMax?.toString() ?? "",
      salaryUnit: p.salaryUnit ?? "annual", duration: p.duration ?? "",
      isPaid: p.isPaid ?? true,
      closingDate: p.closingDate ? (p.closingDate.split("T")[0] ?? "") : "",
      tags: p.tags.join(", "), externalUrls: p.externalUrls.join("\n"),
      status: ["DRAFT","PUBLISHED"].includes(p.status) ? p.status as "DRAFT" | "PUBLISHED" : "DRAFT",
    });
    setShowForm(true);
  }

  function handleSave() {
    startSave(async () => {
      const payload = {
        title: form.title, type: form.type, department: form.department || undefined,
        location: form.location || undefined, remote: form.remote,
        description: form.description, requirements: form.requirements || undefined,
        benefits: form.benefits || undefined,
        salaryMin: form.salaryMin ? parseFloat(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? parseFloat(form.salaryMax) : undefined,
        salaryUnit: form.salaryUnit || undefined, duration: form.duration || undefined,
        isPaid: form.isPaid,
        closingDate: form.closingDate ? new Date(form.closingDate).toISOString() : undefined,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        externalUrls: form.externalUrls ? form.externalUrls.split("\n").map((u) => u.trim()).filter(Boolean) : [],
        status: form.status,
      };
      const url    = editPosting ? `/api/jobs/${editPosting.id}` : "/api/jobs";
      const method = editPosting ? "PATCH" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { setShowForm(false); load(); }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this job posting? All applications will be removed.")) return;
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = postings.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = q === "" || p.title.toLowerCase().includes(q) || (p.department ?? "").toLowerCase().includes(q);
    const matchType   = filterType === "ALL"   || p.type   === filterType;
    const matchStatus = filterStatus === "ALL" || p.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const stats = {
    open:    postings.filter((p) => p.status === "PUBLISHED").length,
    ready:   postings.filter((p) => p.status === "PAUSED").length,
    total:   postings.length,
    apps:    postings.reduce((s, p) => s + p._count.applications, 0),
    interns: postings.filter((p) => p.type === "INTERNSHIP" && p.status === "PUBLISHED").length,
    volunteers: postings.filter((p) => p.type === "VOLUNTEER" && p.status === "PUBLISHED").length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Job Board</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage openings for employees, contractors, interns, and volunteers</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-gold flex items-center gap-2 text-sm px-4 py-2">
          <Plus size={15} /> Add Role
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "Open",         value: stats.open,       color: "text-green-500"  },
          { label: "Ready to Post",value: stats.ready,      color: "text-blue-500"   },
          { label: "Total Roles",  value: stats.total,      color: "text-foreground" },
          { label: "Applications", value: stats.apps,       color: "text-gold"       },
          { label: "Internships",  value: stats.interns,    color: "text-emerald-500"},
          { label: "Volunteer",    value: stats.volunteers, color: "text-pink-500"   },
        ].map((s) => (
          <div key={s.label} className="section-card p-3">
            <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles..." className="input-base pl-9 w-full text-sm" />
        </div>
        <div className="relative">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="input-base pr-8 text-sm appearance-none cursor-pointer">
            <option value="ALL">All Types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="input-base pr-8 text-sm appearance-none cursor-pointer">
            <option value="ALL">All Statuses</option>
            {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap items-center gap-3">
        {STATUS_ORDER.map((s) => {
          const c = STATUS_CONFIG[s];
          const SIcon = c.icon;
          const count = postings.filter((p) => p.status === s).length;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(filterStatus === s ? "ALL" : s)}
              className={cn(
                "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors",
                filterStatus === s ? cn(c.bg, c.border, c.color) : "border-border text-muted-foreground hover:border-border/60"
              )}
            >
              <SIcon size={10} className={filterStatus === s ? c.color : "text-muted-foreground"} />
              {c.label} · {count}
            </button>
          );
        })}
      </div>

      {/* Postings */}
      {loading ? (
        <div className="section-card p-12 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Briefcase size={22} className="text-muted-foreground" /></div>
          <p className="font-medium text-sm">No roles found</p>
          <p className="text-xs text-muted-foreground">Add your first role to start building your team pipeline</p>
          <button type="button" onClick={openCreate} className="btn-primary text-sm mt-3 px-4 py-2">Add Role</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const isExpanded = activeId === p.id;
            return (
              <div key={p.id} className="section-card overflow-hidden">
                <div className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {/* Type badge */}
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0", TYPE_COLORS[p.type])}>
                      {TYPE_LABELS[p.type]}
                    </span>

                    {/* Title + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate">{p.title}</p>
                        {p.department && (
                          <span className="text-xs text-muted-foreground hidden sm:inline">{p.department}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {(p.location || p.remote) && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin size={10} /> {p.remote ? "Remote / Hybrid" : p.location}
                          </span>
                        )}
                        {(p.salaryMin || p.salaryMax) && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <DollarSign size={10} />
                            {p.salaryMin && p.salaryMax
                              ? `$${p.salaryMin.toLocaleString()}–$${p.salaryMax.toLocaleString()}`
                              : p.salaryMin ? `From $${p.salaryMin.toLocaleString()}` : `Up to $${p.salaryMax!.toLocaleString()}`}
                            {p.salaryUnit === "annual" ? "/yr" : p.salaryUnit === "hourly" ? "/hr" : ""}
                          </span>
                        )}
                        {p.duration && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock size={10} /> {p.duration}
                          </span>
                        )}
                        {p.type === "VOLUNTEER" && (
                          <span className="text-xs text-pink-500 font-medium">Volunteer · Unpaid</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                        <Users size={11} /> {p._count.applications}
                      </span>

                      {/* Status toggle — the key new feature */}
                      <StatusPicker posting={p} onUpdate={load} />

                      <button type="button" onClick={() => setActiveId(isExpanded ? null : p.id)}
                        className="btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1">
                        <Eye size={12} />
                      </button>
                      <button type="button" onClick={() => openEdit(p)} className="btn-ghost text-xs px-2.5 py-1.5">
                        <Pencil size={12} />
                      </button>
                      <button type="button" onClick={() => handleDelete(p.id)} className="btn-ghost text-xs px-2.5 py-1.5 text-red-500 hover:bg-red-500/10">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Description</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{p.description}</p>
                      </div>
                      {p.requirements && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Requirements</p>
                          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{p.requirements}</p>
                        </div>
                      )}
                      {p.benefits && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Benefits & Perks</p>
                          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{p.benefits}</p>
                        </div>
                      )}
                      {p.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {p.tags.map((t) => (
                            <span key={t} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground border border-border">{t}</span>
                          ))}
                        </div>
                      )}
                      {p.externalUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {p.externalUrls.map((url) => (
                            <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                               className="flex items-center gap-1 text-xs text-gold hover:underline">
                              <ExternalLink size={11} /> {url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-lg">{editPosting ? "Edit Role" : "Add Role"}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost p-1.5"><XCircle size={16} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1.5">Job Title *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Psychological Safety Specialist" className="input-base w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5">Type *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as JobType })}
                    className="input-base w-full text-sm">
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5">Department</label>
                  <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="e.g. Consulting, Academy" className="input-base w-full text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5">Location</label>
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Maryland/DC area or Remote" className="input-base w-full text-sm" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.remote} onChange={(e) => setForm({ ...form, remote: e.target.checked })}
                      className="w-4 h-4 accent-gold" />
                    <span className="text-sm">Remote / Hybrid</span>
                  </label>
                </div>
              </div>

              {form.type !== "VOLUNTEER" && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5">
                      {form.type === "INTERNSHIP" ? "Min Pay" : "Min Salary"}
                    </label>
                    <input value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
                      type="number" placeholder="0" className="input-base w-full text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5">
                      {form.type === "INTERNSHIP" ? "Max Pay" : "Max Salary"}
                    </label>
                    <input value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
                      type="number" placeholder="0" className="input-base w-full text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5">Pay Period</label>
                    <select value={form.salaryUnit} onChange={(e) => setForm({ ...form, salaryUnit: e.target.value })}
                      className="input-base w-full text-sm">
                      <option value="annual">Annual</option>
                      <option value="hourly">Hourly</option>
                      <option value="stipend">Stipend (total)</option>
                    </select>
                  </div>
                </div>
              )}

              {(form.type === "INTERNSHIP" || form.type === "VOLUNTEER") && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5">Duration</label>
                    <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      placeholder="e.g. 3 months, Ongoing" className="input-base w-full text-sm" />
                  </div>
                  {form.type === "INTERNSHIP" && (
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.isPaid as boolean} onChange={(e) => setForm({ ...form, isPaid: e.target.checked })}
                          className="w-4 h-4 accent-gold" />
                        <span className="text-sm">Paid internship</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1.5">Description *</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4} placeholder="Describe the role and responsibilities..."
                  className="input-base w-full text-sm resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">Requirements & Qualifications</label>
                <textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  rows={3} placeholder="Experience, skills, certs, education..."
                  className="input-base w-full text-sm resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">Benefits & Perks</label>
                <textarea value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                  rows={2} placeholder="What do you offer?"
                  className="input-base w-full text-sm resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5">Closing Date</label>
                  <input type="date" value={form.closingDate} onChange={(e) => setForm({ ...form, closingDate: e.target.value })}
                    className="input-base w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5">Tags (comma-separated)</label>
                  <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="DEI, remote, OD, psych-safety" className="input-base w-full text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2">External Listing URLs (one per line)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[
                    { name: "LinkedIn",        url: "https://www.linkedin.com/talent/jobs/create" },
                    { name: "Indeed",          url: "https://employers.indeed.com/p/post-job" },
                    { name: "Handshake",       url: "https://app.joinhandshake.com/employer/jobs/new" },
                    { name: "VolunteerMatch",  url: "https://www.volunteermatch.org/org/postings/new" },
                    { name: "Idealist",        url: "https://www.idealist.org/en/post-a-job" },
                    { name: "WayUp",           url: "https://www.wayup.com/employers/post-a-job" },
                  ].map((board) => {
                    const added = form.externalUrls.includes(board.url);
                    return (
                      <button key={board.name} type="button"
                        onClick={() => {
                          if (added) {
                            setForm({ ...form, externalUrls: form.externalUrls.split("\n").filter((u) => u.trim() !== board.url).join("\n") });
                          } else {
                            setForm({ ...form, externalUrls: [form.externalUrls.trim(), board.url].filter(Boolean).join("\n") });
                          }
                        }}
                        className={cn(
                          "text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all",
                          added ? "bg-gold/10 border-gold/30 text-gold ring-1 ring-gold/20" : "border-border text-muted-foreground hover:border-gold/20"
                        )}
                      >
                        {added ? "✓ " : "+ "}{board.name}
                      </button>
                    );
                  })}
                </div>
                <textarea value={form.externalUrls} onChange={(e) => setForm({ ...form, externalUrls: e.target.value })}
                  rows={2} placeholder="Paste listing URLs here..." className="input-base w-full text-sm resize-none font-mono" />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5">Initial Status</label>
                <div className="flex gap-2 flex-wrap">
                  {(["DRAFT", "PAUSED", "PUBLISHED"] as const).map((s) => {
                    const c = STATUS_CONFIG[s];
                    const SIcon = c.icon;
                    return (
                      <label key={s} className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-xs transition-colors",
                        form.status === s ? cn(c.bg, c.border, c.color, "font-semibold") : "border-border text-muted-foreground hover:bg-muted"
                      )}>
                        <input type="radio" name="status" value={s}
                          checked={form.status === (s === "PAUSED" ? "DRAFT" : s) || form.status === s}
                          onChange={() => setForm({ ...form, status: s === "PAUSED" ? "DRAFT" : s })}
                          className="sr-only" />
                        <SIcon size={12} /> {c.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border flex items-center justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost text-sm px-4 py-2">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving || !form.title || !form.description}
                className="btn-gold text-sm px-6 py-2 disabled:opacity-50">
                {saving ? "Saving…" : editPosting ? "Update Role" : "Save Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
