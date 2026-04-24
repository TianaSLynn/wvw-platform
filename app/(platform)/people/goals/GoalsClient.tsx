"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Target, CheckCircle2, Clock, Plus, X, Trash2, Edit2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type KeyResult = {
  id: string;
  title: string;
  current: string | null;
  target: string;
  progress: number;
};

type Goal = {
  id: string;
  title: string;
  description: string | null;
  owner: string | null;
  quarter: string | null;
  progress: number;
  status: string;
  keyResults: KeyResult[];
};

interface Props {
  goals: Goal[];
  canAdmin: boolean;
}

// ── Add Goal Modal ─────────────────────────────────────────────────────────────
function AddGoalModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");
  const [quarter, setQuarter] = useState(getCurrentQuarter());
  const [krs, setKrs] = useState([{ title: "", current: "", target: "", progress: 0 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getCurrentQuarter() {
    const m = new Date().getMonth();
    const q = Math.ceil((m + 1) / 3);
    return `Q${q} ${new Date().getFullYear()}`;
  }

  function addKR() {
    setKrs((prev) => [...prev, { title: "", current: "", target: "", progress: 0 }]);
  }

  function removeKR(i: number) {
    setKrs((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          owner: owner.trim() || undefined,
          quarter: quarter.trim() || undefined,
          keyResults: krs.filter((kr) => kr.title.trim()).map((kr) => ({
            title: kr.title.trim(),
            current: kr.current.trim() || undefined,
            target: kr.target.trim() || "—",
            progress: kr.progress,
          })),
        }),
      });
      if (!res.ok) {
        const b = await res.json();
        throw new Error(b.error ?? "Failed to save");
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">New Objective</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-xs px-3 py-2 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-foreground">Objective *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Achieve operational excellence in audit delivery"
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground">Owner / Team</label>
              <input
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g. Leadership Team"
                className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Quarter</label>
              <input
                value={quarter}
                onChange={(e) => setQuarter(e.target.value)}
                placeholder="Q1 2026"
                className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional context about this objective"
              className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-foreground">Key Results</label>
              <button type="button" onClick={addKR} className="text-xs text-gold hover:text-gold/80 flex items-center gap-1">
                <Plus size={12} /> Add KR
              </button>
            </div>
            <div className="space-y-2">
              {krs.map((kr, i) => (
                <div key={i} className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={kr.title}
                      onChange={(e) => setKrs((prev) => prev.map((k, idx) => idx === i ? { ...k, title: e.target.value } : k))}
                      placeholder="Key result description"
                      className="flex-1 h-8 px-2.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                    {krs.length > 1 && (
                      <button type="button" onClick={() => removeKR(i)} className="p-1 hover:text-destructive text-muted-foreground">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      value={kr.current}
                      onChange={(e) => setKrs((prev) => prev.map((k, idx) => idx === i ? { ...k, current: e.target.value } : k))}
                      placeholder="Current"
                      className="h-7 px-2 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                    <input
                      value={kr.target}
                      onChange={(e) => setKrs((prev) => prev.map((k, idx) => idx === i ? { ...k, target: e.target.value } : k))}
                      placeholder="Target"
                      className="h-7 px-2 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={kr.progress}
                        onChange={(e) => setKrs((prev) => prev.map((k, idx) => idx === i ? { ...k, progress: Number(e.target.value) } : k))}
                        className="w-full h-7 px-2 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
          <button type="button" onClick={onClose} className="px-4 h-9 rounded-lg text-sm border border-border hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="btn-primary px-6 h-9 text-sm disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create Objective"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Client Component ──────────────────────────────────────────────────────
export default function GoalsClient({ goals: initialGoals, canAdmin }: Props) {
  const router = useRouter();
  const [goals, setGoals] = useState(initialGoals);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(initialGoals.map((g) => g.id)));
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ACTIVE");

  function refresh() {
    router.refresh();
    setShowAddModal(false);
  }

  async function updateProgress(goalId: string, progress: number) {
    setGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, progress } : g));
    await fetch(`/api/goals/${goalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress }),
    });
  }

  async function markComplete(goalId: string) {
    setGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, status: "COMPLETED", progress: 100 } : g));
    await fetch(`/api/goals/${goalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED", progress: 100 }),
    });
  }

  async function archiveGoal(goalId: string) {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filteredGoals = goals.filter((g) => filterStatus === "ALL" || g.status === filterStatus);

  return (
    <>
      {showAddModal && (
        <AddGoalModal onClose={() => setShowAddModal(false)} onSaved={refresh} />
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {(["ALL", "ACTIVE", "COMPLETED"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilterStatus(s)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition-colors",
              filterStatus === s ? "bg-navy-900 text-white border-navy-900" : "border-border text-muted-foreground hover:border-foreground/30"
            )}
          >
            {s === "ALL" ? "All" : s === "ACTIVE" ? "Active" : "Completed"}
            <span className="ml-1.5 opacity-60">{goals.filter((g) => s === "ALL" || g.status === s).length}</span>
          </button>
        ))}
        {canAdmin && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-xs ml-auto flex items-center gap-1.5"
          >
            <Plus size={13} />
            Add Objective
          </button>
        )}
      </div>

      {filteredGoals.length === 0 ? (
        <div className="section-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No {filterStatus.toLowerCase()} objectives</p>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {filteredGoals.map((goal) => {
            const isExpanded = expandedIds.has(goal.id);
            return (
              <div key={goal.id} className="section-card">
                <div className="section-card-header">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      className="flex-1 text-left flex items-start gap-2"
                      onClick={() => toggleExpand(goal.id)}
                    >
                      <Target size={15} className={cn("flex-shrink-0 mt-0.5", goal.status === "COMPLETED" ? "text-green-500" : "text-green-500")} />
                      <div className="min-w-0">
                        <h3 className={cn("text-sm font-semibold", goal.status === "COMPLETED" && "line-through text-muted-foreground")}>
                          {goal.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {[goal.quarter, goal.owner].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-lg font-bold text-foreground">{goal.progress}%</span>
                      {canAdmin && goal.status === "ACTIVE" && (
                        <button
                          type="button"
                          onClick={() => markComplete(goal.id)}
                          className="text-xs text-green-600 hover:text-green-700 px-2 py-1 rounded-md hover:bg-green-500/10 transition-colors"
                        >
                          ✓ Complete
                        </button>
                      )}
                      {canAdmin && (
                        <button
                          type="button"
                          onClick={() => archiveGoal(goal.id)}
                          className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                      <button type="button" onClick={() => toggleExpand(goal.id)} className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {goal.description && (
                    <p className="text-xs text-muted-foreground mt-2 ml-5">{goal.description}</p>
                  )}

                  {/* Progress bar + inline slider for admins */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", goal.status === "COMPLETED" || goal.progress === 100 ? "bg-green-500" : goal.progress >= 50 ? "bg-gold" : "bg-amber-500")}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                    {canAdmin && goal.status === "ACTIVE" && (
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={goal.progress}
                        onChange={(e) => updateProgress(goal.id, Number(e.target.value))}
                        className="w-20 accent-gold"
                      />
                    )}
                  </div>
                </div>

                {isExpanded && goal.keyResults.length > 0 && (
                  <div className="divide-y divide-border">
                    {goal.keyResults.map((kr) => (
                      <div key={kr.id} className="flex items-start gap-3 px-4 py-3">
                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", kr.progress >= 100 ? "bg-green-500/20" : "bg-muted")}>
                          {kr.progress >= 100
                            ? <CheckCircle2 size={12} className="text-green-500" />
                            : <Clock size={12} className="text-muted-foreground" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">{kr.title}</p>
                          <div className="flex items-center gap-4 mt-1.5">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${kr.progress}%` }} />
                            </div>
                            {kr.current && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap">{kr.current} / {kr.target}</span>
                            )}
                          </div>
                        </div>
                        <span className={cn("text-xs font-semibold flex-shrink-0", kr.progress >= 100 ? "text-green-500" : "text-foreground")}>
                          {kr.progress}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && goal.keyResults.length === 0 && (
                  <div className="px-4 py-3 text-xs text-muted-foreground">No key results defined</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
