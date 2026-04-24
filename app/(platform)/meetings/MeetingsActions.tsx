"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";

const MEETING_TYPES = [
  { value: "KICKOFF",   label: "Kickoff Meeting" },
  { value: "STATUS",    label: "Status Update" },
  { value: "FINDINGS",  label: "Findings Walkthrough" },
  { value: "EXIT",      label: "Exit Conference" },
  { value: "INTERVIEW", label: "Management Interview" },
  { value: "INTERNAL",  label: "Internal Meeting" },
  { value: "GENERAL",   label: "General" },
];

interface Client { id: string; name: string }
interface Audit  { id: string; name: string }

export function ScheduleMeetingButton({ clients, audits }: { clients: Client[]; audits: Audit[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    type: "GENERAL",
    scheduledAt: "",
    duration: "60",
    location: "",
    meetingUrl: "",
    clientId: "",
    auditId: "",
    description: "",
    notes: "",
  });

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:       form.title,
          type:        form.type,
          scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
          duration:    parseInt(form.duration) || 60,
          location:    form.location || undefined,
          meetingUrl:  form.meetingUrl || undefined,
          clientId:    form.clientId || undefined,
          auditId:     form.auditId || undefined,
          description: form.description || undefined,
          notes:       form.notes || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setError(d.error ?? "Failed to schedule meeting");
        return;
      }
      setOpen(false);
      setForm({ title: "", type: "GENERAL", scheduledAt: "", duration: "60", location: "", meetingUrl: "", clientId: "", auditId: "", description: "", notes: "" });
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
        <Plus size={16} /> Schedule Meeting
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="text-sm font-semibold">Schedule Meeting</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1">Title *</label>
                <input className="input-base w-full" placeholder="e.g. Q4 Audit Kickoff — Acme Corp" value={form.title} onChange={(e) => set("title", e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">Type</label>
                  <select className="input-base w-full" value={form.type} onChange={(e) => set("type", e.target.value)}>
                    {MEETING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Duration (min)</label>
                  <input className="input-base w-full" type="number" min="15" step="15" value={form.duration} onChange={(e) => set("duration", e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Date & Time *</label>
                <input className="input-base w-full" type="datetime-local" value={form.scheduledAt} onChange={(e) => set("scheduledAt", e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">Client</label>
                  <select className="input-base w-full" value={form.clientId} onChange={(e) => set("clientId", e.target.value)}>
                    <option value="">— None —</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Linked Audit</label>
                  <select className="input-base w-full" value={form.auditId} onChange={(e) => set("auditId", e.target.value)}>
                    <option value="">— None —</option>
                    {audits.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Location / Room</label>
                <input className="input-base w-full" placeholder="Conference Room A, Zoom, Teams…" value={form.location} onChange={(e) => set("location", e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Video Call URL</label>
                <input className="input-base w-full" type="url" placeholder="https://zoom.us/j/…" value={form.meetingUrl} onChange={(e) => set("meetingUrl", e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Description</label>
                <textarea className="input-base w-full resize-none" rows={2} placeholder="Agenda, objectives…" value={form.description} onChange={(e) => set("description", e.target.value)} />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1 text-sm">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Scheduling…</> : "Schedule Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function CompleteMeetingButton({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markComplete() {
    setLoading(true);
    await fetch(`/api/meetings/${meetingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    }).catch(() => {});
    setLoading(false);
    router.refresh();
  }

  return (
    <button type="button" onClick={markComplete} disabled={loading} className="btn-ghost text-xs text-green-600 hover:bg-green-500/10">
      {loading ? "…" : "Complete"}
    </button>
  );
}
