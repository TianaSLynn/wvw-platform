"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ToggleRight, ToggleLeft, ChevronDown, Plus, Save, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Item {
  id: string; question: string; guidance: string | null; riskWeight: number;
  isRequired: boolean; evidenceRequired: boolean; sortOrder: number; isActive: boolean;
}
interface Section {
  id: string; title: string; description: string | null; sortOrder: number; items: Item[];
}
interface Template {
  id: string; name: string; type: string; isGlobal: boolean; isActive: boolean; isPublished: boolean;
  sections: Section[];
}

const RISK_WEIGHT_LABEL = (w: number) =>
  w >= 1.8 ? "Critical" : w >= 1.3 ? "High" : w >= 1.0 ? "Standard" : "Low";
const RISK_WEIGHT_COLOR = (w: number) =>
  w >= 1.8 ? "text-red-500" : w >= 1.3 ? "text-amber-600" : "text-muted-foreground";

export default function TemplateEditor({ template, userRole }: { template: Template; userRole: string }) {
  const canEdit = ["SUPER_ADMIN", "ADMIN", "PARTNER"].includes(userRole);

  const [sections,  setSections]  = useState<Section[]>(template.sections);
  const [expanded,  setExpanded]  = useState<string | null>(template.sections[0]?.id ?? null);
  const [saving,    setSaving]    = useState<string | null>(null);
  const [feedback,  setFeedback]  = useState<{ id: string; msg: string } | null>(null);

  // New question form per section
  const [newQ, setNewQ] = useState<Record<string, string>>({});
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const flash = (id: string, msg: string) => {
    setFeedback({ id, msg });
    setTimeout(() => setFeedback(null), 2500);
  };

  const patchItem = async (item: Item, changes: Partial<Item>) => {
    setSaving(item.id);
    const res = await fetch(`/api/audit-catalog/${template.id}/items`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ itemId: item.id, ...changes }),
    });
    if (res.ok) {
      setSections((prev) =>
        prev.map((sec) => ({
          ...sec,
          items: sec.items.map((i) => i.id === item.id ? { ...i, ...changes } : i),
        }))
      );
      flash(item.id, "Saved");
    }
    setSaving(null);
  };

  const addItem = async (sectionId: string) => {
    const q = (newQ[sectionId] ?? "").trim();
    if (!q) return;
    const res = await fetch(`/api/audit-catalog/${template.id}/items`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ sectionId, question: q }),
    });
    if (res.ok) {
      const { data } = await res.json();
      setSections((prev) =>
        prev.map((sec) =>
          sec.id === sectionId ? { ...sec, items: [...sec.items, data] } : sec
        )
      );
      setNewQ((prev) => ({ ...prev, [sectionId]: "" }));
      setAddingTo(null);
    }
  };

  const totalItems  = sections.reduce((s, sec) => s + sec.items.length, 0);
  const activeItems = sections.reduce((s, sec) => s + sec.items.filter((i) => i.isActive).length, 0);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="section-card p-4 flex items-center gap-6 text-sm">
        <div>
          <span className="text-muted-foreground text-xs">Sections</span>
          <p className="font-semibold">{sections.length}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Total Questions</span>
          <p className="font-semibold">{totalItems}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Active</span>
          <p className="font-semibold text-green-600">{activeItems}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Inactive</span>
          <p className="font-semibold text-muted-foreground">{totalItems - activeItems}</p>
        </div>
        <div className="ml-auto">
          <Link href="/audit-catalog" className="btn-ghost text-sm">← Back to Catalog</Link>
        </div>
      </div>

      {!canEdit && (
        <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
          <span>You have view-only access. Contact an admin to make changes.</span>
        </div>
      )}

      {/* Sections */}
      {sections.map((section) => {
        const isOpen = expanded === section.id;
        const activeCount = section.items.filter((i) => i.isActive).length;

        return (
          <div key={section.id} className="section-card overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : section.id)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
            >
              <div>
                <h3 className="font-semibold text-sm">{section.title}</h3>
                {section.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{activeCount}</span>/{section.items.length} active
                </span>
                <ChevronDown size={15} className={cn("text-muted-foreground transition-transform", isOpen && "rotate-180")} />
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-border">
                <div className="divide-y divide-border">
                  {section.items.map((item) => {
                    const isFeedback = feedback?.id === item.id;
                    return (
                      <div key={item.id} className={cn("px-5 py-3 flex items-start gap-3 transition-colors", !item.isActive && "bg-muted/30")}>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm leading-snug", !item.isActive && "line-through text-muted-foreground")}>
                            {item.question}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                            <span className={RISK_WEIGHT_COLOR(item.riskWeight)}>
                              {RISK_WEIGHT_LABEL(item.riskWeight)} weight
                            </span>
                            {item.evidenceRequired && <span className="text-amber-600">Evidence required</span>}
                            {item.isRequired && <span>Required</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isFeedback && (
                            <span className="text-[10px] text-green-600 flex items-center gap-1">
                              <Save size={10} /> {feedback.msg}
                            </span>
                          )}
                          {saving === item.id && (
                            <span className="text-[10px] text-muted-foreground">Saving…</span>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => patchItem(item, { isActive: !item.isActive })}
                              disabled={saving === item.id}
                              className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                            >
                              {item.isActive
                                ? <ToggleRight size={20} className="text-green-500" />
                                : <ToggleLeft size={20} />
                              }
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add question */}
                {canEdit && (
                  <div className="px-5 py-3 border-t border-border bg-muted/20">
                    {addingTo === section.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={newQ[section.id] ?? ""}
                          onChange={(e) => setNewQ((prev) => ({ ...prev, [section.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter") addItem(section.id); if (e.key === "Escape") setAddingTo(null); }}
                          placeholder="Type a question and press Enter…"
                          className="flex-1 h-8 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
                        />
                        <button onClick={() => addItem(section.id)} className="btn-primary text-xs py-1.5">Add</button>
                        <button onClick={() => setAddingTo(null)} className="btn-ghost text-xs py-1.5">Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingTo(section.id)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Plus size={13} /> Add question to this section
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
