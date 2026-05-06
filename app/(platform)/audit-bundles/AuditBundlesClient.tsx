"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Layers, X, ChevronRight, ToggleRight, ToggleLeft, BookOpen } from "lucide-react";
import Link from "next/link";

const TYPE_COLORS: Record<string, string> = {
  HR:          "bg-sage/20 text-sage border-sage/30",
  COMPLIANCE:  "bg-green-500/10 text-green-600 border-green-500/20",
  RISK:        "bg-purple-500/10 text-purple-600 border-purple-500/20",
  OPERATIONAL: "bg-red-500/10 text-red-500 border-red-500/20",
  CUSTOM:      "bg-muted text-muted-foreground border-border",
};

interface Template {
  id: string; name: string; type: string; isGlobal?: boolean; isActive?: boolean;
}
interface BundleItem {
  id: string; sortOrder: number; templateId: string;
  template: Template;
}
interface Bundle {
  id: string; name: string; description: string | null; isActive: boolean;
  items: BundleItem[];
  _count: { audits: number };
}

interface Props {
  initialBundles: Bundle[];
  templates:      Template[];
  userRole:       string;
}

export default function AuditBundlesClient({ initialBundles, templates, userRole }: Props) {
  const canManage = ["SUPER_ADMIN", "ADMIN", "PARTNER"].includes(userRole);

  const [bundles,    setBundles]    = useState<Bundle[]>(initialBundles);
  const [showForm,   setShowForm]   = useState(false);
  const [expanded,   setExpanded]   = useState<string | null>(null);

  // New bundle form
  const [name,       setName]       = useState("");
  const [desc,       setDesc]       = useState("");
  const [selected,   setSelected]   = useState<string[]>([]);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const toggleTemplate = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selected.length === 0) {
      setError("Bundle name and at least one template are required.");
      return;
    }
    setSaving(true); setError(null);
    const res = await fetch("/api/audit-bundles", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name: name.trim(), description: desc.trim() || undefined, templateIds: selected }),
    });
    if (res.ok) {
      const { data } = await res.json();
      setBundles((prev) => [data, ...prev]);
      setName(""); setDesc(""); setSelected([]); setShowForm(false);
    } else {
      const { error: e } = await res.json();
      setError(e ?? "Failed to create bundle");
    }
    setSaving(false);
  };

  const toggleActive = async (bundle: Bundle) => {
    const res = await fetch(`/api/audit-bundles/${bundle.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isActive: !bundle.isActive }),
    });
    if (res.ok) {
      setBundles((prev) => prev.map((b) => b.id === bundle.id ? { ...b, isActive: !b.isActive } : b));
    }
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={15} /> New Bundle
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="section-card p-6 space-y-5 border-gold/30">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">New Audit Bundle</h3>
            <button type="button" onClick={() => setShowForm(false)}><X size={16} className="text-muted-foreground" /></button>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-4 py-2 rounded-lg">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Bundle Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Culture Deep Dive" className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Brief description…" className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Select Templates ({selected.length} selected)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
              {templates.map((tpl) => {
                const isSel = selected.includes(tpl.id);
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => toggleTemplate(tpl.id)}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-colors text-xs",
                      isSel ? "bg-gold/10 border-gold/40 text-foreground" : "border-border text-muted-foreground hover:border-border/60"
                    )}
                  >
                    <div className="font-medium leading-tight">{tpl.name}</div>
                    <div className={cn("mt-1 text-[10px] px-1.5 py-0.5 rounded border inline-block", TYPE_COLORS[tpl.type] ?? TYPE_COLORS.CUSTOM)}>
                      {tpl.type}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? "Creating…" : "Create Bundle"}
            </button>
          </div>
        </form>
      )}

      {/* Bundle list */}
      {bundles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Layers size={28} className="text-muted-foreground/40" /></div>
          <p className="text-sm font-medium">No audit bundles yet</p>
          <p className="text-xs text-muted-foreground mt-1">Group audit templates to launch comprehensive assessments in one step</p>
          {canManage && (
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4 text-xs">Create First Bundle</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
          {bundles.map((bundle) => {
            const isOpen = expanded === bundle.id;
            return (
              <div
                key={bundle.id}
                className={cn("section-card p-5 transition-all", !bundle.isActive && "opacity-60")}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Layers size={14} className="text-sage flex-shrink-0" />
                      <h3 className="font-semibold text-sm truncate">{bundle.name}</h3>
                    </div>
                    {bundle.description && (
                      <p className="text-xs text-muted-foreground">{bundle.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {canManage && (
                      <button onClick={() => toggleActive(bundle)} className="text-muted-foreground hover:text-foreground">
                        {bundle.isActive
                          ? <ToggleRight size={18} className="text-green-500" />
                          : <ToggleLeft size={18} />
                        }
                      </button>
                    )}
                  </div>
                </div>

                {/* Template chips */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {bundle.items.map((item) => (
                    <span
                      key={item.id}
                      className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", TYPE_COLORS[item.template.type] ?? TYPE_COLORS.CUSTOM)}
                    >
                      {item.template.name}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    <span className="font-medium text-foreground">{bundle.items.length}</span> templates ·{" "}
                    <span className="font-medium text-foreground">{bundle._count.audits}</span>× used
                  </span>
                  <button
                    onClick={() => setExpanded(isOpen ? null : bundle.id)}
                    className="flex items-center gap-1 text-gold hover:underline"
                  >
                    {isOpen ? "Collapse" : "Details"}
                    <ChevronRight size={12} className={cn("transition-transform", isOpen && "rotate-90")} />
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-border space-y-2">
                    {bundle.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-xs">
                        <BookOpen size={11} className="text-muted-foreground" />
                        <span className="flex-1">{item.template.name}</span>
                        <span className={cn("px-1.5 py-0.5 rounded border text-[10px]", TYPE_COLORS[item.template.type] ?? TYPE_COLORS.CUSTOM)}>
                          {item.template.type}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2">
                      <Link
                        href={`/audits/new?bundle=${bundle.id}`}
                        className="btn-gold w-full text-xs py-2 flex items-center justify-center gap-1.5"
                      >
                        Launch Bundle Audit
                        <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
