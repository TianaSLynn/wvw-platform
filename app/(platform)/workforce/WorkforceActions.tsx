"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeleteEmployeeButton({ employeeId, name }: { employeeId: string; name: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await fetch(`/api/workforce/${employeeId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        <button type="button" onClick={handleDelete} disabled={loading} aria-label="Confirm delete"
          className="text-[10px] text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 hover:bg-red-500/20 transition-colors">
          {loading ? "…" : "Delete"}
        </button>
        <button type="button" onClick={() => setConfirming(false)} aria-label="Cancel" className="p-0.5 rounded hover:bg-muted">
          <X size={10} className="text-muted-foreground" />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={`Delete ${name}`}
      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
    >
      <Trash2 size={12} className="text-red-500/70" />
    </button>
  );
}

export function ClearDemoDataButton() {
  const router = useRouter();
  const [open, setOpen]       = useState(false);
  const [target, setTarget]   = useState<"employees" | "clients" | "both">("employees");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState<string | null>(null);

  async function handleClear() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/clear-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, confirm: true }),
      });
      if (res.ok) {
        const { data } = await res.json();
        const d = data.deleted as Record<string, number>;
        setDone(`Cleared: ${Object.entries(d).map(([k, v]) => `${v} ${k}`).join(", ")}`);
        router.refresh();
        setTimeout(() => { setOpen(false); setDone(null); }, 2000);
      }
    } finally { setLoading(false); }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors"
      >
        <Trash2 size={12} /> Clear Placeholder Data
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-red-500" />
                <h2 className="text-sm font-semibold">Clear Placeholder Data</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close"><X size={16} className="text-muted-foreground" /></button>
            </div>
            <div className="p-5 space-y-4">
              {done ? (
                <p className="text-sm text-emerald-600 text-center py-2">{done}</p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    This permanently deletes placeholder records so you can add your real crew. Choose what to clear:
                  </p>
                  <div className="space-y-2">
                    {(["employees", "clients", "both"] as const).map((t) => (
                      <label key={t} className={cn("flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all", target === t ? "border-red-500/30 bg-red-500/5" : "border-border hover:bg-muted")}>
                        <input type="radio" name="target" value={t} checked={target === t} onChange={() => setTarget(t)} className="accent-red-500" />
                        <span className="text-xs font-medium capitalize">{t === "both" ? "Employees & Clients" : t}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[11px] text-red-600 bg-red-500/10 px-3 py-2 rounded-lg">
                    ⚠ This cannot be undone. All selected records will be permanently removed.
                  </p>
                </>
              )}
            </div>
            {!done && (
              <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
                <button type="button" onClick={() => setOpen(false)} className="btn-ghost text-sm px-4 py-2 rounded-lg border border-border">Cancel</button>
                <button type="button" onClick={handleClear} disabled={loading}
                  className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium">
                  {loading ? "Clearing…" : "Clear Data"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
