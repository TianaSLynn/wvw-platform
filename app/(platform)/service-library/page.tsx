"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BookOpen, Plus, Search, Star, Edit2, Trash2, X,
  CheckCircle, Clock, Users, DollarSign, Tag, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceCategory =
  | "AUDIT" | "TRAINING" | "CONSULTING" | "COACHING"
  | "ASSESSMENT" | "WORKSHOP" | "RETAINER" | "OTHER";

type ServiceOffering = {
  id: string;
  name: string;
  slug: string;
  category: ServiceCategory;
  description: string;
  deliverables?: string | null;
  duration?: string | null;
  format?: string | null;
  audience?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  priceUnit?: string | null;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  createdAt: string;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORIES: { value: ServiceCategory; label: string; color: string; bg: string; border: string }[] = [
  { value: "AUDIT",      label: "Culture Audit",  color: "text-blue-600",    bg: "bg-blue-500/10",    border: "border-blue-500/20" },
  { value: "TRAINING",   label: "Training",        color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { value: "CONSULTING", label: "Consulting",      color: "text-amber-600",   bg: "bg-amber-500/10",   border: "border-amber-500/20" },
  { value: "COACHING",   label: "Coaching",        color: "text-purple-600",  bg: "bg-purple-500/10",  border: "border-purple-500/20" },
  { value: "ASSESSMENT", label: "Assessment",      color: "text-sky-600",     bg: "bg-sky-500/10",     border: "border-sky-500/20" },
  { value: "WORKSHOP",   label: "Workshop",        color: "text-rose-600",    bg: "bg-rose-500/10",    border: "border-rose-500/20" },
  { value: "RETAINER",   label: "Retainer",        color: "text-gold",        bg: "bg-gold/10",        border: "border-gold/20" },
  { value: "OTHER",      label: "Other",           color: "text-slate-600",   bg: "bg-slate-500/10",   border: "border-slate-500/20" },
];

const WVW_SEED_SERVICES = [
  {
    name: "Workplace Culture Audit",
    category: "AUDIT" as ServiceCategory,
    description: "A comprehensive assessment of your organization's workplace culture, examining psychological safety, DEI practices, communication patterns, and leadership effectiveness. Includes anonymous employee surveys, leadership interviews, and a full findings report.",
    deliverables: "• Pre-audit survey (all staff)\n• Leadership interviews\n• Culture Assessment Report\n• Executive Presentation\n• 90-Day Action Plan",
    duration: "4–6 weeks", format: "Hybrid (Virtual + On-site available)",
    audience: "Organizations 10–500 employees", priceMin: 3500, priceMax: 12000,
    priceUnit: "per engagement", isActive: true, isFeatured: true,
    tags: ["culture","dei","audit","flagship"],
  },
  {
    name: "Manager Upskills Training",
    category: "TRAINING" as ServiceCategory,
    description: "A targeted training series for managers on leading diverse, neurodivergent, and distributed teams. Covers emotional intelligence, inclusive communication, bias recognition, and psychological safety practices.",
    deliverables: "• 4 live sessions (90 min each)\n• Manager Workbook\n• Post-training assessment\n• Certificate of completion\n• 30-day follow-up check-in",
    duration: "4 weeks (1 session/week)", format: "Virtual (Zoom) or On-site",
    audience: "People managers, team leads, supervisors", priceMin: 1200, priceMax: 4000,
    priceUnit: "per cohort", isActive: true, isFeatured: true,
    tags: ["managers","training","leadership","dei"],
  },
  {
    name: "Neurodiversity in the Workplace Workshop",
    category: "WORKSHOP" as ServiceCategory,
    description: "A half-day or full-day workshop building organizational awareness around ADHD, autism, dyslexia, and other neurodivergent profiles. Focuses on accommodation practices, strengths-based management, and inclusive design.",
    deliverables: "• Pre-workshop needs assessment\n• Facilitated workshop (half or full day)\n• Resource guide for managers & HR\n• Accommodation policy template",
    duration: "Half-day or Full-day", format: "Virtual or On-site",
    audience: "All staff or managers only", priceMin: 800, priceMax: 2500,
    priceUnit: "per session", isActive: true, isFeatured: false,
    tags: ["neurodiversity","workshop","accommodations","inclusion"],
  },
  {
    name: "Intersectional Leadership Coaching",
    category: "COACHING" as ServiceCategory,
    description: "1:1 or small-group coaching for leaders navigating identity, power, and workplace dynamics. Designed for Black women, women of color, and underrepresented leaders building sustainable impact.",
    deliverables: "• Initial intake session\n• Weekly 1:1 coaching sessions\n• Leadership development plan\n• Monthly progress review\n• Resource library access",
    duration: "3–6 months", format: "Virtual (weekly sessions)",
    audience: "Individual contributors to senior leaders", priceMin: 2400, priceMax: 7200,
    priceUnit: "per person / 3 months", isActive: true, isFeatured: true,
    tags: ["coaching","leadership","women of color","1:1"],
  },
  {
    name: "DEI Strategy Assessment",
    category: "ASSESSMENT" as ServiceCategory,
    description: "A diagnostic review of your current DEI initiatives, policies, and outcomes. Benchmarks against industry standards, identifies gaps, and delivers a prioritized roadmap for meaningful, measurable change.",
    deliverables: "• Document and policy review\n• Stakeholder interviews\n• DEI Maturity Score\n• Gap Analysis Report\n• Prioritized Roadmap (12 months)",
    duration: "2–3 weeks", format: "Virtual",
    audience: "HR, DEI leads, Executive teams", priceMin: 1800, priceMax: 5500,
    priceUnit: "per engagement", isActive: true, isFeatured: false,
    tags: ["dei","assessment","strategy","roadmap"],
  },
  {
    name: "Culture & Compliance Retainer",
    category: "RETAINER" as ServiceCategory,
    description: "Ongoing advisory support for organizations committed to sustained culture transformation. Includes monthly check-ins, on-demand consulting hours, policy review, and quarterly culture pulse surveys.",
    deliverables: "• Monthly strategy call (60 min)\n• Up to 8 advisory hours/month\n• Quarterly pulse survey\n• Policy review (as needed)\n• Priority response SLA",
    duration: "Ongoing (minimum 3 months)", format: "Virtual",
    audience: "HR, People Ops, Leadership", priceMin: 2000, priceMax: 5000,
    priceUnit: "per month", isActive: true, isFeatured: false,
    tags: ["retainer","advisory","ongoing","culture"],
  },
  {
    name: "Burnout Recovery & Prevention Program",
    category: "CONSULTING" as ServiceCategory,
    description: "A structured program to diagnose organizational burnout drivers and implement recovery practices. Combines data collection, system analysis, and team-level interventions to rebuild sustainable work culture.",
    deliverables: "• Burnout Risk Assessment (all staff)\n• Root Cause Analysis Report\n• Recovery Roadmap\n• Manager toolkit\n• 60-day follow-up session",
    duration: "6–8 weeks", format: "Hybrid",
    audience: "Teams experiencing high turnover or low engagement", priceMin: 2800, priceMax: 8500,
    priceUnit: "per engagement", isActive: true, isFeatured: false,
    tags: ["burnout","wellbeing","retention","consulting"],
  },
];

const EMPTY_FORM = {
  name: "", category: "TRAINING" as ServiceCategory, description: "",
  deliverables: "", duration: "", format: "", audience: "",
  priceMin: "", priceMax: "", priceUnit: "per engagement",
  isActive: true, isFeatured: false, tags: "",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ServiceLibraryPage() {
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [loading, setLoading]   = useState(true);
  const [seeding, setSeeding]   = useState(false);
  const [search, setSearch]     = useState("");
  const [filterCat, setFilterCat] = useState<ServiceCategory | "all">("all");
  const [showInactive, setShowInactive] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]   = useState<ServiceOffering | null>(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/services?active=${showInactive ? "false" : "true"}`);
      if (res.ok) setServices(await res.json());
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [showInactive]); // eslint-disable-line

  const handleSeed = async () => {
    setSeeding(true);
    for (const svc of WVW_SEED_SERVICES) {
      await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(svc),
      });
    }
    await load();
    setSeeding(false);
  };

  const filtered = useMemo(() => services.filter((s) => {
    if (filterCat !== "all" && s.category !== filterCat) return false;
    if (search && !`${s.name} ${s.description} ${s.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [services, filterCat, search]);

  const catConfig = (cat: ServiceCategory) => CATEGORIES.find((c) => c.value === cat) ?? CATEGORIES[CATEGORIES.length - 1]!;

  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setError(""); setModalOpen(true); }
  function openEdit(svc: ServiceOffering) {
    setEditing(svc);
    setForm({
      name: svc.name, category: svc.category, description: svc.description,
      deliverables: svc.deliverables ?? "", duration: svc.duration ?? "",
      format: svc.format ?? "", audience: svc.audience ?? "",
      priceMin: svc.priceMin != null ? String(svc.priceMin) : "",
      priceMax: svc.priceMax != null ? String(svc.priceMax) : "",
      priceUnit: svc.priceUnit ?? "per engagement",
      isActive: svc.isActive, isFeatured: svc.isFeatured,
      tags: svc.tags.join(", "),
    });
    setError(""); setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.description.trim()) { setError("Name and description are required."); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        name: form.name, category: form.category, description: form.description,
        deliverables: form.deliverables || null, duration: form.duration || null,
        format: form.format || null, audience: form.audience || null,
        priceMin: form.priceMin ? parseFloat(form.priceMin) : null,
        priceMax: form.priceMax ? parseFloat(form.priceMax) : null,
        priceUnit: form.priceUnit || null,
        isActive: form.isActive, isFeatured: form.isFeatured,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      const res = editing
        ? await fetch(`/api/services/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); setError(d.message ?? "Save failed"); return; }
      setModalOpen(false);
      await load();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this service offering?")) return;
    await fetch(`/api/services/${id}`, { method: "DELETE" });
    await load();
  }

  async function toggleFeatured(svc: ServiceOffering) {
    await fetch(`/api/services/${svc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: !svc.isFeatured }),
    });
    await load();
  }

  const featured  = filtered.filter((s) => s.isFeatured);
  const regular   = filtered.filter((s) => !s.isFeatured);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
            <BookOpen size={18} className="text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Service Library</h1>
            <p className="text-xs text-muted-foreground">WVW's full catalog of consulting and training offerings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {services.length === 0 && !loading && (
            <button type="button" onClick={handleSeed} disabled={seeding} className="btn-ghost text-xs px-3 py-1.5 border border-border rounded-lg">
              {seeding ? "Adding WVW services…" : "Seed WVW Default Services"}
            </button>
          )}
          <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-sm">
            <Plus size={14} /> Add Service
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: BookOpen, color: "text-gold", bg: "bg-gold/10", border: "border-gold/20", val: services.length, label: "Total Services" },
          { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20", val: services.filter((s) => s.isActive).length, label: "Active" },
          { icon: Star, color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/20", val: services.filter((s) => s.isFeatured).length, label: "Featured" },
        ].map(({ icon: Icon, color, bg, border, val, label }) => (
          <div key={label} className="section-card p-4 flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center border", bg, border)}>
              <Icon size={16} className={color} />
            </div>
            <div><p className="text-xl font-bold">{val}</p><p className="text-xs text-muted-foreground">{label}</p></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="input-base pl-8 text-sm w-full" placeholder="Search services…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value as ServiceCategory | "all")} aria-label="Filter by category" className="input-base text-sm">
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="accent-gold w-3.5 h-3.5" />
          Show inactive
        </label>
      </div>

      {/* List */}
      {loading ? (
        <div className="section-card p-12 text-center text-sm text-muted-foreground">Loading service library…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><BookOpen size={28} className="text-muted-foreground/40" /></div>
          <p className="text-sm font-medium">No services yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your first service or seed the WVW default catalog</p>
          <button type="button" onClick={openCreate} className="btn-primary mt-4 text-sm px-4 py-2 flex items-center gap-1.5 mx-auto">
            <Plus size={14} /> Add Service
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {featured.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3"><Star size={14} className="text-gold" /><h2 className="text-sm font-semibold gradient-text-gold">Featured Services</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featured.map((svc) => <ServiceCard key={svc.id} svc={svc} expanded={expanded === svc.id} onToggle={() => setExpanded(expanded === svc.id ? null : svc.id)} onEdit={() => openEdit(svc)} onDelete={() => handleDelete(svc.id)} onToggleFeatured={() => toggleFeatured(svc)} catConfig={catConfig(svc.category)} />)}
              </div>
            </div>
          )}
          {regular.length > 0 && (
            <div>
              {featured.length > 0 && <h2 className="text-sm font-semibold text-muted-foreground mb-3">All Services</h2>}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {regular.map((svc) => <ServiceCard key={svc.id} svc={svc} expanded={expanded === svc.id} onToggle={() => setExpanded(expanded === svc.id ? null : svc.id)} onEdit={() => openEdit(svc)} onDelete={() => handleDelete(svc.id)} onToggleFeatured={() => toggleFeatured(svc)} catConfig={catConfig(svc.category)} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold">{editing ? "Edit Service" : "Add Service Offering"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close"><X size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && <p className="text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Service Name *</label>
                  <input className="input-base w-full" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Workplace Culture Audit" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Category *</label>
                  <select className="input-base w-full" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ServiceCategory }))} aria-label="Service category">
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Duration</label>
                  <input className="input-base w-full" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} placeholder="e.g. 4–6 weeks" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Description *</label>
                <textarea className="input-base w-full" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What does this service include and who is it for?" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Deliverables (one per line)</label>
                <textarea className="input-base w-full font-mono text-xs" rows={4} value={form.deliverables} onChange={(e) => setForm((f) => ({ ...f, deliverables: e.target.value }))} placeholder="• Culture Assessment Report&#10;• Executive Presentation&#10;• 90-Day Action Plan" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Format</label>
                  <input className="input-base w-full" value={form.format} onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))} placeholder="Virtual / On-site / Hybrid" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Audience</label>
                  <input className="input-base w-full" value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))} placeholder="e.g. All staff, Managers, HR" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Price From ($)</label>
                  <input type="number" className="input-base w-full" value={form.priceMin} onChange={(e) => setForm((f) => ({ ...f, priceMin: e.target.value }))} placeholder="1500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Price To ($)</label>
                  <input type="number" className="input-base w-full" value={form.priceMax} onChange={(e) => setForm((f) => ({ ...f, priceMax: e.target.value }))} placeholder="5000" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Unit</label>
                  <input className="input-base w-full" value={form.priceUnit} onChange={(e) => setForm((f) => ({ ...f, priceUnit: e.target.value }))} placeholder="per engagement" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Tags (comma-separated)</label>
                <input className="input-base w-full" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="dei, audit, leadership" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="accent-gold w-4 h-4" />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} className="accent-gold w-4 h-4" />
                  Featured
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost px-4 py-2 text-sm rounded-lg border border-border">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} className="btn-primary px-4 py-2 text-sm">
                {saving ? "Saving…" : editing ? "Save Changes" : "Add Service"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Service Card ─────────────────────────────────────────────────────────────

function ServiceCard({
  svc, expanded, onToggle, onEdit, onDelete, onToggleFeatured, catConfig,
}: {
  svc: ServiceOffering;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFeatured: () => void;
  catConfig: typeof CATEGORIES[number];
}) {
  const priceLabel = svc.priceMin != null
    ? svc.priceMax != null
      ? `$${svc.priceMin.toLocaleString()} – $${svc.priceMax.toLocaleString()}${svc.priceUnit ? ` / ${svc.priceUnit}` : ""}`
      : `From $${svc.priceMin.toLocaleString()}`
    : svc.priceMax != null ? `Up to $${svc.priceMax.toLocaleString()}` : null;

  return (
    <div className={cn("section-card flex flex-col transition-all", !svc.isActive && "opacity-60")}>
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", catConfig.color, catConfig.bg, catConfig.border)}>
                {catConfig.label}
              </span>
              {svc.isFeatured && <span className="text-[10px] font-bold text-gold bg-gold/10 px-1.5 py-0.5 rounded-full border border-gold/20 flex items-center gap-0.5"><Star size={8} />Featured</span>}
              {!svc.isActive && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">Inactive</span>}
            </div>
            <h3 className="text-sm font-semibold leading-tight">{svc.name}</h3>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button type="button" onClick={onToggleFeatured} aria-label={svc.isFeatured ? "Remove from featured" : "Mark as featured"} className="p-1.5 rounded hover:bg-muted transition-colors">
              <Star size={13} className={svc.isFeatured ? "text-gold fill-gold" : "text-muted-foreground"} />
            </button>
            <button type="button" onClick={onEdit} aria-label="Edit service" className="p-1.5 rounded hover:bg-muted transition-colors">
              <Edit2 size={13} className="text-muted-foreground" />
            </button>
            <button type="button" onClick={onDelete} aria-label="Delete service" className="p-1.5 rounded hover:bg-red-500/10 transition-colors">
              <Trash2 size={13} className="text-red-500/70" />
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">{svc.description}</p>

        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
          {svc.duration && <span className="flex items-center gap-0.5"><Clock size={9} />{svc.duration}</span>}
          {svc.format   && <span className="flex items-center gap-0.5"><Users size={9} />{svc.format}</span>}
          {priceLabel   && <span className="flex items-center gap-0.5"><DollarSign size={9} />{priceLabel}</span>}
        </div>

        {svc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {svc.tags.map((t) => (
              <span key={t} className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Tag size={7} />{t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border">
        <button type="button" onClick={onToggle} className="w-full flex items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:bg-muted/30 transition-colors">
          <span>{expanded ? "Hide details" : "View deliverables"}</span>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {expanded && svc.deliverables && (
          <div className="px-4 pb-4">
            <pre className="text-[11px] text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed">{svc.deliverables}</pre>
            {svc.audience && (
              <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1"><Users size={10} />For: {svc.audience}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
