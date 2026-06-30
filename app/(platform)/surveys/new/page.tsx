"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Loader2 } from "lucide-react";

export default function NewSurveyPage() {
  const router = useRouter();
  const [title, setTitle]       = useState("");
  const [description, setDesc]  = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function create() {
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(d?.error ?? "Failed to create survey"); return; }
    router.push(`/surveys/${d.data.id}/builder`);
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
          <ClipboardList size={18} className="text-gold" />
        </div>
        <div>
          <h1 className="text-xl font-bold">New Survey</h1>
          <p className="text-sm text-muted-foreground">Give your survey a name to get started</p>
        </div>
      </div>

      <div className="section-card p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Survey Title <span className="text-red-400">*</span></label>
          <input
            autoFocus
            className="input-base w-full"
            placeholder="e.g. Client Satisfaction Survey Q2 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
          <textarea
            className="input-base w-full resize-none"
            rows={3}
            placeholder="Brief description shown to respondents"
            value={description}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button onClick={() => router.back()} className="btn-ghost flex-1">Cancel</button>
          <button onClick={create} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : "Create & Open Builder"}
          </button>
        </div>
      </div>
    </div>
  );
}
