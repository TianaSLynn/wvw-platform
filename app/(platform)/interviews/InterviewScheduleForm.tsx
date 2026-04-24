"use client";

import { useState } from "react";
import { Plus, CheckCircle2 } from "lucide-react";

interface Audit {
  id: string;
  name: string;
}

const INTERVIEW_TYPES = [
  "Management Walkthrough",
  "IT Controls",
  "Process Owner",
  "Financial Controls",
  "HR Controls",
  "Vendor Review",
  "General Walkthrough",
];

export default function InterviewScheduleForm({ audits }: { audits: Audit[] }) {
  const [subject,   setSubject]   = useState("");
  const [auditId,   setAuditId]   = useState("");
  const [datetime,  setDatetime]  = useState("");
  const [type,      setType]      = useState(INTERVIEW_TYPES[0]!);
  const [duration,  setDuration]  = useState("60");
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState("");

  async function handleSchedule() {
    if (!subject.trim() || !datetime) { setError("Subject and date/time are required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:       `Interview: ${subject}`,
          type:        "INTERVIEW",
          scheduledAt: new Date(datetime).toISOString(),
          duration: parseInt(duration) || 60,
          agenda:      type,
          ...(auditId ? { auditId } : {}),
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.message ?? "Failed to schedule"); return; }
      setSubject(""); setAuditId(""); setDatetime(""); setType(INTERVIEW_TYPES[0]!);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  }

  return (
    <div className="section-card">
      <div className="section-card-header flex items-center gap-2">
        <Plus size={15} className="text-muted-foreground" />
        <h2 className="text-sm font-semibold">Quick Schedule</h2>
      </div>
      <div className="p-4 space-y-3">
        {error && <p className="text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
        {saved && (
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-500/10 px-3 py-2 rounded-lg">
            <CheckCircle2 size={13} /> Interview scheduled successfully
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Interview Subject</label>
          <input className="input-base w-full" placeholder="e.g. IT Manager, CFO…" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Linked Audit</label>
          <select className="input-base w-full" value={auditId} onChange={(e) => setAuditId(e.target.value)} aria-label="Linked audit">
            <option value="">Select audit…</option>
            {audits.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Date &amp; Time</label>
          <input type="datetime-local" aria-label="Interview date and time" className="input-base w-full" value={datetime} onChange={(e) => setDatetime(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Type</label>
            <select className="input-base w-full" value={type} onChange={(e) => setType(e.target.value)} aria-label="Interview type">
              {INTERVIEW_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Duration (min)</label>
            <input type="number" aria-label="Duration in minutes" className="input-base w-full" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="60" />
          </div>
        </div>
        <button type="button" onClick={handleSchedule} disabled={saving} className="btn-primary w-full text-sm">
          {saving ? "Scheduling…" : "Schedule Interview"}
        </button>
      </div>
    </div>
  );
}
