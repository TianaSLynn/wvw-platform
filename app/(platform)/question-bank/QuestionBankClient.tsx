"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Search, Plus, Tag, ToggleLeft, ToggleRight, ChevronDown, X, Library } from "lucide-react";

interface Category {
  id: string; name: string; color: string; sortOrder: number;
  _count?: { items: number };
}
interface Item {
  id: string; question: string; guidance: string | null; responseType: string;
  riskWeight: number; tags: string[]; isActive: boolean; orgId: string | null;
  categoryId: string | null;
  category: (Omit<Category, "_count"> & { _count?: { items: number } }) | null;
}

interface Props {
  initialCategories: Category[];
  initialItems:      Item[];
  userRole:          string;
  orgId:             string;
}

const RESPONSE_LABELS: Record<string, string> = {
  yes_no:   "Yes / No",
  likert_5: "1–5 Scale",
  text:     "Free Text",
};

const RESPONSE_COLORS: Record<string, string> = {
  yes_no:   "bg-blue-500/10 text-blue-600 border-blue-500/20",
  likert_5: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  text:     "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

const RISK_WEIGHT_LABEL = (w: number) =>
  w >= 1.8 ? "High" : w >= 1.3 ? "Medium" : "Standard";
const RISK_WEIGHT_COLOR = (w: number) =>
  w >= 1.8 ? "text-red-500" : w >= 1.3 ? "text-amber-600" : "text-muted-foreground";

// Maps a hex color to a closest Tailwind bg class for category dots
function colorDotClass(color: string): string {
  const map: Record<string, string> = {
    "#6B8F71": "bg-sage",
    "#708090": "bg-slate-500",
    "#A0522D": "bg-terracotta",
    "#C9A84C": "bg-gold",
    "#0F1C3F": "bg-navy-900",
    "#ef4444": "bg-red-500",
    "#f97316": "bg-orange-500",
    "#22c55e": "bg-green-500",
    "#3b82f6": "bg-blue-500",
    "#8b5cf6": "bg-violet-500",
  };
  return map[color] ?? "bg-muted-foreground";
}

export default function QuestionBankClient({ initialCategories, initialItems, userRole }: Props) {
  const canManage = ["SUPER_ADMIN", "ADMIN", "PARTNER"].includes(userRole);

  const [items,      setItems]      = useState<Item[]>(initialItems);
  const [categories]               = useState<Category[]>(initialCategories);
  const [search,     setSearch]     = useState("");
  const [activecat,  setActiveCat]  = useState<string | null>(null);
  const [showActive, setShowActive] = useState<"all" | "active" | "inactive">("active");
  const [expanded,   setExpanded]   = useState<string | null>(null);

  const [showNewForm, setShowNewForm] = useState(false);
  const [newQ,        setNewQ]        = useState("");
  const [newGuidance, setNewGuidance] = useState("");
  const [newType,     setNewType]     = useState("yes_no");
  const [newWeight,   setNewWeight]   = useState(1.0);
  const [newCatId,    setNewCatId]    = useState("");
  const [saving,      setSaving]      = useState(false);

  const filtered = useMemo(() => items.filter((item) => {
    if (activecat && item.categoryId !== activecat) return false;
    if (showActive === "active"   && !item.isActive) return false;
    if (showActive === "inactive" &&  item.isActive) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.question.toLowerCase().includes(q) ||
        (item.guidance ?? "").toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  }), [items, activecat, showActive, search]);

  const toggleActive = async (item: Item) => {
    const res = await fetch(`/api/question-bank/${item.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isActive: !item.isActive }),
    });
    if (res.ok) {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isActive: !i.isActive } : i));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQ.trim()) return;
    setSaving(true);
    const res = await fetch("/api/question-bank", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        question:     newQ.trim(),
        guidance:     newGuidance.trim() || undefined,
        responseType: newType,
        riskWeight:   newWeight,
        categoryId:   newCatId || undefined,
      }),
    });
    if (res.ok) {
      const { data: newItem } = await res.json();
      setItems((prev) => [newItem, ...prev]);
      setNewQ(""); setNewGuidance(""); setNewType("yes_no"); setNewWeight(1.0); setNewCatId("");
      setShowNewForm(false);
    }
    setSaving(false);
  };

  const uncategorized = filtered.filter((i) => !i.categoryId);
  const byCat = categories
    .map((cat) => ({ cat, items: filtered.filter((i) => i.categoryId === cat.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 space-y-3">
        <div className="section-card p-3 space-y-1">
          <button
            type="button"
            onClick={() => setActiveCat(null)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
              !activecat ? "bg-navy-900 text-white" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <span className="flex items-center gap-2"><Library size={13} /> All Questions</span>
            <span className="text-xs opacity-70">{items.length}</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCat(activecat === cat.id ? null : cat.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                activecat === cat.id ? "bg-navy-900 text-white" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <span className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full flex-shrink-0", colorDotClass(cat.color))} />
                {cat.name}
              </span>
              <span className="text-xs opacity-70">{cat._count?.items ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="section-card p-3 space-y-1">
          {(["all", "active", "inactive"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setShowActive(v)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors capitalize",
                showActive === v ? "bg-navy-900 text-white" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {v === "all" ? "All Status" : v}
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              aria-label="Search questions"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions, tags, or guidance…"
              className="w-full pl-9 pr-4 h-9 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowNewForm(!showNewForm)}
              className="btn-primary flex items-center gap-1.5 text-sm"
            >
              <Plus size={15} /> Add Question
            </button>
          )}
        </div>

        {showNewForm && (
          <form onSubmit={handleCreate} className="section-card p-5 space-y-4 border-gold/30">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">New Question</h3>
              <button
                type="button"
                aria-label="Close form"
                onClick={() => setShowNewForm(false)}
              >
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
            <textarea
              aria-label="Question text"
              value={newQ}
              onChange={(e) => setNewQ(e.target.value)}
              rows={2}
              placeholder="Question text…"
              required
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold resize-none"
            />
            <textarea
              aria-label="Auditor guidance"
              value={newGuidance}
              onChange={(e) => setNewGuidance(e.target.value)}
              rows={2}
              placeholder="Guidance for auditor (optional)…"
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold resize-none"
            />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="new-response-type" className="text-xs font-medium text-muted-foreground mb-1 block">Response Type</label>
                <select
                  id="new-response-type"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full h-8 px-2 text-sm bg-background border border-border rounded-lg focus:outline-none"
                >
                  <option value="yes_no">Yes / No</option>
                  <option value="likert_5">1–5 Scale</option>
                  <option value="text">Free Text</option>
                </select>
              </div>
              <div>
                <label htmlFor="new-risk-weight" className="text-xs font-medium text-muted-foreground mb-1 block">Risk Weight</label>
                <select
                  id="new-risk-weight"
                  value={newWeight}
                  onChange={(e) => setNewWeight(parseFloat(e.target.value))}
                  className="w-full h-8 px-2 text-sm bg-background border border-border rounded-lg focus:outline-none"
                >
                  <option value="0.5">Low (0.5×)</option>
                  <option value="1.0">Standard (1.0×)</option>
                  <option value="1.3">Medium (1.3×)</option>
                  <option value="1.8">High (1.8×)</option>
                  <option value="2.0">Critical (2.0×)</option>
                </select>
              </div>
              <div>
                <label htmlFor="new-category" className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                <select
                  id="new-category"
                  value={newCatId}
                  onChange={(e) => setNewCatId(e.target.value)}
                  className="w-full h-8 px-2 text-sm bg-background border border-border rounded-lg focus:outline-none"
                >
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowNewForm(false)} className="btn-ghost text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary text-sm">
                {saving ? "Saving…" : "Add Question"}
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
          <span><span className="font-semibold text-foreground">{filtered.length}</span> questions</span>
          <span><span className="font-semibold text-foreground">{filtered.filter((i) => i.isActive).length}</span> active</span>
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="flex items-center gap-1 text-gold hover:underline"
            >
              <X size={11} /> Clear search
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Library size={28} className="text-muted-foreground/40" /></div>
            <p className="text-sm font-medium">No questions found</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or add a new question</p>
          </div>
        ) : (
          <div className="space-y-6">
            {byCat.map(({ cat, items: catItems }) => (
              <div key={cat.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("w-2.5 h-2.5 rounded-full", colorDotClass(cat.color))} />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{cat.name}</h3>
                  <span className="text-xs text-muted-foreground">({catItems.length})</span>
                </div>
                <div className="space-y-2">
                  {catItems.map((item) => (
                    <QuestionCard
                      key={item.id}
                      item={item}
                      expanded={expanded === item.id}
                      onToggleExpand={() => setExpanded(expanded === item.id ? null : item.id)}
                      onToggleActive={canManage ? () => toggleActive(item) : undefined}
                    />
                  ))}
                </div>
              </div>
            ))}
            {uncategorized.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag size={12} className="text-muted-foreground" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Uncategorized</h3>
                  <span className="text-xs text-muted-foreground">({uncategorized.length})</span>
                </div>
                <div className="space-y-2">
                  {uncategorized.map((item) => (
                    <QuestionCard
                      key={item.id}
                      item={item}
                      expanded={expanded === item.id}
                      onToggleExpand={() => setExpanded(expanded === item.id ? null : item.id)}
                      onToggleActive={canManage ? () => toggleActive(item) : undefined}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionCard({
  item, expanded, onToggleExpand, onToggleActive,
}: {
  item: Item;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleActive?: () => void;
}) {
  const isGlobal = item.orgId === null;

  return (
    <div className={cn("section-card p-4 transition-all", !item.isActive && "opacity-50")}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded ? "true" : "false"}
          aria-label={expanded ? "Collapse question" : "Expand question"}
          className="flex-1 text-left"
        >
          <div className="flex items-start gap-2">
            <ChevronDown size={14} className={cn("text-muted-foreground mt-0.5 flex-shrink-0 transition-transform", expanded && "rotate-180")} />
            <p className="text-sm font-medium leading-snug">{item.question}</p>
          </div>
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded border", RESPONSE_COLORS[item.responseType] ?? "border-border text-muted-foreground")}>
            {RESPONSE_LABELS[item.responseType] ?? item.responseType}
          </span>
          <span className={cn("text-[10px] font-medium", RISK_WEIGHT_COLOR(item.riskWeight))}>
            {RISK_WEIGHT_LABEL(item.riskWeight)}
          </span>
          {isGlobal && (
            <span className="text-[10px] text-blue-500 font-medium">WVW</span>
          )}
          {onToggleActive && !isGlobal && (
            <button
              type="button"
              onClick={onToggleActive}
              aria-label={item.isActive ? "Deactivate question" : "Activate question"}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.isActive
                ? <ToggleRight size={18} className="text-green-500" />
                : <ToggleLeft size={18} />
              }
            </button>
          )}
        </div>
      </div>

      {expanded && item.guidance && (
        <div className="mt-3 ml-5 p-3 bg-muted/50 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground font-medium mb-1">Auditor Guidance</p>
          <p className="text-xs leading-relaxed">{item.guidance}</p>
        </div>
      )}

      {expanded && item.tags.length > 0 && (
        <div className="mt-2 ml-5 flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
