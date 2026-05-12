"use client";

import { useState, useEffect } from "react";
import { Radio, AlertTriangle, FileText, TrendingUp, Shield, Globe, Plus, X, Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface Signal {
  id: string;
  category: string;
  title: string;
  source: string | null;
  severity: Severity;
  summary: string | null;
  actionRequired: string | null;
  signalDate: string | null;
  url: string | null;
  createdAt: string;
}

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; border: string }> = {
  LOW:      { label: "Low",      color: "text-green-600",  bg: "bg-green-500/10",  border: "border-green-500/20" },
  MEDIUM:   { label: "Medium",   color: "text-amber-600",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
  HIGH:     { label: "High",     color: "text-red-600",    bg: "bg-red-500/10",    border: "border-red-500/20" },
  CRITICAL: { label: "Critical", color: "text-red-700",    bg: "bg-red-600/15",    border: "border-red-600/30" },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Regulatory Changes": FileText,
  "Industry Trends":    TrendingUp,
  "Threat Intelligence": Shield,
  "Client Intelligence": Globe,
  "Technology":         Radio,
  "Economic":           TrendingUp,
  "Other":              AlertTriangle,
};

const CURATED: Signal[] = [
  { id: "c1", category: "Regulatory Changes", title: "SEC Cybersecurity Disclosure Rules", source: "SEC", severity: "HIGH", summary: "New rules require material cybersecurity incident disclosure within 4 business days and annual cybersecurity risk management disclosures.", actionRequired: "Update IT audit procedures", signalDate: "2026-01-30", url: null, createdAt: "2026-01-30" },
  { id: "c2", category: "Regulatory Changes", title: "FTC Safeguards Rule Amendment", source: "FTC", severity: "MEDIUM", summary: "Expanded scope of entities covered by Safeguards Rule — financial institutions must verify compliance.", actionRequired: "Review client applicability", signalDate: "2026-01-15", url: null, createdAt: "2026-01-15" },
  { id: "c3", category: "Industry Trends", title: "AI Governance Frameworks — Emerging Standard", source: "NIST", severity: "MEDIUM", summary: "NIST AI RMF adoption accelerating among enterprise clients. Consider adding AI governance to audit scope.", actionRequired: "Develop AI audit checklist", signalDate: "2026-02-01", url: null, createdAt: "2026-02-01" },
  { id: "c4", category: "Threat Intelligence", title: "Social Engineering Attacks Targeting HR", source: "CISA", severity: "HIGH", summary: "Increase in vishing and email-based social engineering targeting HR and payroll departments. Warn clients.", actionRequired: "Brief client HR teams", signalDate: "2026-03-10", url: null, createdAt: "2026-03-10" },
];

const CATEGORIES = ["Regulatory Changes","Industry Trends","Threat Intelligence","Client Intelligence","Technology","Economic","Other"] as const;
const EMPTY_FORM = { category: "Regulatory Changes" as typeof CATEGORIES[number], title: "", source: "", severity: "MEDIUM" as Severity, summary: "", actionRequired: "", signalDate: "", url: "" };

export default function ExternalSignalsPage() {
  const [orgSignals, setOrgSignals] = useState<Signal[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modalOpen, setModalOpen]   = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [filterSeverity, setFilterSeverity] = useState<Severity | "all">("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/signals");
      if (res.ok) setOrgSignals((await res.json()).data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  async function handleSave() {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category, title: form.title,
          source: form.source || undefined, severity: form.severity,
          summary: form.summary || undefined,
          actionRequired: form.actionRequired || undefined,
          signalDate: form.signalDate || undefined,
          url: form.url || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.message ?? "Save failed"); return; }
      setModalOpen(false); setForm(EMPTY_FORM); await load();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/signals/${id}`, { method: "DELETE" });
    setOrgSignals((prev) => prev.filter((s) => s.id !== id));
  }

  const allSignals: (Signal & { isOrg?: boolean })[] = [
    ...CURATED.map((s) => ({ ...s, isOrg: false })),
    ...orgSignals.map((s) => ({ ...s, isOrg: true })),
  ].filter((s) => filterSeverity === "all" || s.severity === filterSeverity);

  const criticalCount = allSignals.filter((s) => s.severity === "CRITICAL" || s.severity === "HIGH").length;
  const actionCount   = allSignals.filter((s) => s.actionRequired).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Radio size={18} className="text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">External Signals</h1>
            <p className="text-xs text-muted-foreground">Regulatory changes, industry trends, and threat intelligence affecting your clients</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value as Severity | "all")} aria-label="Filter by severity" className="input-base text-sm">
            <option value="all">All Severity</option>
            {(["CRITICAL","HIGH","MEDIUM","LOW"] as Severity[]).map((s) => (
              <option key={s} value={s}>{SEVERITY_CONFIG[s].label}</option>
            ))}
          </select>
          <button type="button" onClick={() => { setForm(EMPTY_FORM); setError(""); setModalOpen(true); }} className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-sm">
            <Plus size={14} /> Add Signal
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="section-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center"><AlertTriangle size={16} className="text-red-500" /></div>
          <div><p className="text-lg font-bold">{criticalCount}</p><p className="text-xs text-muted-foreground">High/Critical</p></div>
        </div>
        <div className="section-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"><FileText size={16} className="text-amber-500" /></div>
          <div><p className="text-lg font-bold">{actionCount}</p><p className="text-xs text-muted-foreground">Action Items</p></div>
        </div>
        <div className="section-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><Radio size={16} className="text-blue-500" /></div>
          <div><p className="text-lg font-bold">{allSignals.length}</p><p className="text-xs text-muted-foreground">Total Signals</p></div>
        </div>
      </div>

      {/* Signals grouped by category */}
      {loading ? (
        <div className="section-card p-8 text-center text-sm text-muted-foreground">Loading signals…</div>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.map((cat) => {
            const catSignals = allSignals.filter((s) => s.category === cat);
            if (catSignals.length === 0) return null;
            const CatIcon = CATEGORY_ICONS[cat] ?? AlertTriangle;
            return (
              <div key={cat} className="section-card overflow-hidden">
                <div className="section-card-header flex items-center gap-2">
                  <CatIcon size={14} className="text-muted-foreground" />
                  <h2 className="text-sm font-semibold">{cat}</h2>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{catSignals.length}</span>
                </div>
                <div className="divide-y divide-border">
                  {catSignals.map((sig) => {
                    const sevCfg = SEVERITY_CONFIG[sig.severity];
                    return (
                      <div key={sig.id} className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 mt-0.5", sevCfg.color, sevCfg.bg, sevCfg.border)}>
                            {sevCfg.label}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-foreground">{sig.title}</p>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {sig.url && (
                                  <a href={sig.url} target="_blank" rel="noopener noreferrer" aria-label="Open source" className="p-1 rounded hover:bg-muted">
                                    <ExternalLink size={12} className="text-muted-foreground" />
                                  </a>
                                )}
                                {sig.isOrg && (
                                  <button type="button" onClick={() => handleDelete(sig.id)} aria-label="Delete signal" className="p-1 rounded hover:bg-red-500/10">
                                    <Trash2 size={12} className="text-red-400" />
                                  </button>
                                )}
                              </div>
                            </div>
                            {sig.source && <p className="text-[10px] text-muted-foreground mb-1">Source: {sig.source}</p>}
                            {sig.summary && <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{sig.summary}</p>}
                            {sig.actionRequired && (
                              <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-500/10 px-2 py-1 rounded-lg w-fit">
                                <AlertTriangle size={10} />
                                <span className="font-medium">Action:</span> {sig.actionRequired}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add signal modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold">Add External Signal</h2>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close"><X size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && <p className="text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</label>
                  <input className="input-base w-full" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Signal title" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                  <select className="input-base w-full" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as typeof CATEGORIES[number] }))} aria-label="Category">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Severity</label>
                  <select className="input-base w-full" value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as Severity }))} aria-label="Severity">
                    {(["LOW","MEDIUM","HIGH","CRITICAL"] as Severity[]).map((s) => (
                      <option key={s} value={s}>{SEVERITY_CONFIG[s].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Source</label>
                  <input className="input-base w-full" value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} placeholder="e.g. SEC, CISA, NIST" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
                  <input type="date" aria-label="Signal date" className="input-base w-full" value={form.signalDate} onChange={(e) => setForm((f) => ({ ...f, signalDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Summary</label>
                <textarea className="input-base w-full" rows={3} value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} placeholder="Describe the signal and its implications…" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Recommended Action</label>
                <input className="input-base w-full" value={form.actionRequired} onChange={(e) => setForm((f) => ({ ...f, actionRequired: e.target.value }))} placeholder="e.g. Update audit procedures, brief clients…" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Source URL</label>
                <input type="url" className="input-base w-full" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://…" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost px-4 py-2 text-sm rounded-lg border border-border">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} className="btn-primary px-4 py-2 text-sm">
                {saving ? "Saving…" : "Add Signal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
