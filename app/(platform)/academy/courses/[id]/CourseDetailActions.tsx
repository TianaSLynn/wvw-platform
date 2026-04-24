"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X, Loader2, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Employee = { id: string; firstName: string; lastName: string; title: string | null; department: string | null };

export function AssignEmployeesButton({ courseId, employees, assignedIds }: {
  courseId: string;
  employees: Employee[];
  assignedIds: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const unassigned = employees.filter((e) => !assignedIds.has(e.id));

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(unassigned.map((e) => e.id)));
  }

  async function handleAssign() {
    if (selected.size === 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/courses/${courseId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeIds: Array.from(selected),
          dueDate: dueDate || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        setError("Failed to assign course");
        return;
      }
      setOpen(false);
      setSelected(new Set());
      setDueDate("");
      setNotes("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
        <UserPlus size={15} /> Assign to Employees
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-sm font-semibold">Assign Course</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Due date & notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">Due Date <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <input type="date" className="input-base w-full" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <input className="input-base w-full" placeholder="Any instructions..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>

              {/* Employee list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium">Select Employees</label>
                  {unassigned.length > 0 && (
                    <button onClick={selectAll} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                      Select all ({unassigned.length})
                    </button>
                  )}
                </div>

                {unassigned.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">All employees are already assigned to this course.</p>
                ) : (
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {unassigned.map((emp) => (
                      <label key={emp.id} className={cn(
                        "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-xs",
                        selected.has(emp.id) ? "bg-purple-500/10 border border-purple-500/20" : "hover:bg-muted border border-transparent"
                      )}>
                        <input
                          type="checkbox"
                          checked={selected.has(emp.id)}
                          onChange={() => toggle(emp.id)}
                          className="rounded border-border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{emp.firstName} {emp.lastName}</p>
                          {(emp.title || emp.department) && (
                            <p className="text-[10px] text-muted-foreground">{[emp.title, emp.department].filter(Boolean).join(" · ")}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && <p className="px-5 text-xs text-red-500">{error}</p>}

            <div className="p-5 border-t border-border flex gap-3">
              <button onClick={() => setOpen(false)} className="btn-ghost flex-1 text-sm">Cancel</button>
              <button onClick={handleAssign} disabled={loading || selected.size === 0} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {loading ? <><Loader2 size={14} className="animate-spin" /> Assigning…</> : `Assign to ${selected.size || "…"} Employee${selected.size !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ASSIGNED:    { label: "Assigned",    color: "text-blue-600",   icon: Clock        },
  IN_PROGRESS: { label: "In Progress", color: "text-amber-600",  icon: Clock        },
  COMPLETED:   { label: "Completed",   color: "text-green-600",  icon: CheckCircle2 },
  FAILED:      { label: "Failed",      color: "text-red-600",    icon: AlertTriangle },
  EXEMPT:      { label: "Exempt",      color: "text-muted-foreground", icon: X      },
  OVERDUE:     { label: "Overdue",     color: "text-red-600",    icon: AlertTriangle },
};

export function UpdateStatusButton({ assignmentId, courseId, currentStatus }: {
  assignmentId: string;
  courseId: string;
  currentStatus: string;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [score, setScore] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleUpdate() {
    setLoading(true);
    try {
      await fetch(`/api/courses/${courseId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          status,
          score: score ? parseFloat(score) : undefined,
        }),
      });
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const cfg = STATUS_CONFIG[currentStatus] ?? STATUS_CONFIG.ASSIGNED!;
  const Icon = cfg.icon;

  return (
    <>
      <button onClick={() => setOpen(true)} className={cn("text-xs flex items-center gap-1 hover:underline", cfg.color)}>
        <Icon size={11} /> {cfg.label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Update Assignment</h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted"><X size={14} /></button>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Status</label>
              <select className="input-base w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
                {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                  <option key={val} value={val}>{cfg.label}</option>
                ))}
              </select>
            </div>
            {(status === "COMPLETED" || status === "FAILED") && (
              <div>
                <label className="text-xs font-medium block mb-1">Score (%)</label>
                <input className="input-base w-full" type="number" min="0" max="100" placeholder="0–100" value={score} onChange={(e) => setScore(e.target.value)} />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setOpen(false)} className="btn-ghost flex-1 text-sm">Cancel</button>
              <button onClick={handleUpdate} disabled={loading} className="btn-primary flex-1 text-sm">
                {loading ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
