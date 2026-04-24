"use client";

import { useState, useEffect } from "react";
import { Star, Plus, X, Trash2, Heart, Lightbulb, Target, TrendingUp, Users, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface Recognition {
  id: string;
  toName: string;
  type: string;
  message: string;
  isPublic: boolean;
  createdAt: string;
  fromUser: { id: string; firstName: string; lastName: string; avatarUrl: string | null } | null;
}

const RECOGNITION_TYPES = [
  { type: "Star Performer",   icon: Star,       color: "text-gold",       bg: "bg-gold/10",       desc: "Exceptional work quality and impact" },
  { type: "Team Player",      icon: Users,      color: "text-blue-500",   bg: "bg-blue-500/10",   desc: "Outstanding collaboration and support" },
  { type: "Innovation Award", icon: Lightbulb,  color: "text-purple-500", bg: "bg-purple-500/10", desc: "Creative problem-solving" },
  { type: "Above & Beyond",   icon: Target,     color: "text-red-500",    bg: "bg-red-500/10",    desc: "Going the extra mile" },
  { type: "Growth Champion",  icon: TrendingUp, color: "text-green-500",  bg: "bg-green-500/10",  desc: "Remarkable personal development" },
  { type: "Client Champion",  icon: Trophy,     color: "text-amber-500",  bg: "bg-amber-500/10",  desc: "Exceptional client service" },
];

const TYPE_MAP = Object.fromEntries(RECOGNITION_TYPES.map((t) => [t.type, t]));
const EMPTY_FORM = { toName: "", type: "Star Performer", message: "" };

export default function RecognitionPage() {
  const [recognitions, setRecognitions] = useState<Recognition[]>([]);
  const [loading, setLoading]           = useState(true);
  const [modalOpen, setModalOpen]       = useState(false);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recognition");
      if (res.ok) setRecognitions(await res.json());
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  async function handleSend() {
    if (!form.toName.trim() || !form.message.trim()) { setError("Recipient and message are required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/recognition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toName: form.toName, type: form.type, message: form.message, isPublic: true }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.message ?? "Failed to send"); return; }
      setModalOpen(false); setForm(EMPTY_FORM); await load();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/recognition/${id}`, { method: "DELETE" });
    setRecognitions((prev) => prev.filter((r) => r.id !== id));
  }

  function timeAgo(dateStr: string): string {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7)  return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }

  const countsByType = Object.fromEntries(
    RECOGNITION_TYPES.map((t) => [t.type, recognitions.filter((r) => r.type === t.type).length])
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Star size={18} className="text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Recognition Wall</h1>
            <p className="text-xs text-muted-foreground">Celebrate teammates — recognitions are shared with the whole team</p>
          </div>
        </div>
        <button type="button" onClick={() => { setForm(EMPTY_FORM); setError(""); setModalOpen(true); }} className="btn-gold flex items-center gap-1.5 px-3 py-1.5 text-sm">
          <Plus size={14} /> Give Recognition
        </button>
      </div>

      {/* Award type summary */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {RECOGNITION_TYPES.map(({ type, icon: Icon, color, bg }) => (
          <div key={type} className={cn("section-card p-3 text-center", bg)}>
            <Icon size={20} className={cn("mx-auto mb-1", color)} />
            <p className="text-lg font-bold">{countsByType[type] ?? 0}</p>
            <p className="text-[9px] text-muted-foreground leading-tight">{type}</p>
          </div>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="section-card p-12 text-center text-sm text-muted-foreground">Loading…</div>
      ) : recognitions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Heart size={28} className="text-muted-foreground/40" /></div>
          <p className="text-sm font-medium">No recognitions yet</p>
          <p className="text-xs text-muted-foreground mt-1">Be the first to celebrate a teammate</p>
          <button type="button" onClick={() => setModalOpen(true)} className="btn-gold mt-4 text-sm px-4 py-2 flex items-center gap-1.5 mx-auto">
            <Plus size={14} /> Give Recognition
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
          {recognitions.map((rec) => {
            const cfg = TYPE_MAP[rec.type] ?? RECOGNITION_TYPES[0]!;
            const Icon = cfg.icon;
            return (
              <div key={rec.id} className={cn("section-card p-4 flex flex-col gap-3", cfg.bg)}>
                <div className="flex items-start justify-between">
                  <div className={cn("flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg", cfg.color)}>
                    <Icon size={12} />{rec.type}
                  </div>
                  <button type="button" onClick={() => handleDelete(rec.id)} aria-label="Delete" className="p-1 rounded hover:bg-red-500/10">
                    <Trash2 size={12} className="text-red-400" />
                  </button>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">🎉 {rec.toName}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rec.message}</p>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <p className="text-[10px] text-muted-foreground">
                    From: <span className="font-medium text-foreground">
                      {rec.fromUser ? `${rec.fromUser.firstName} ${rec.fromUser.lastName}` : "Leadership"}
                    </span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">{timeAgo(rec.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold">Give Recognition</h2>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close"><X size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <p className="text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Recognizing *</label>
                <input className="input-base w-full" value={form.toName} onChange={(e) => setForm((f) => ({ ...f, toName: e.target.value }))} placeholder="Team member&apos;s name" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Award Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {RECOGNITION_TYPES.map(({ type, icon: Icon, color, bg }) => (
                    <button key={type} type="button" onClick={() => setForm((f) => ({ ...f, type }))}
                      className={cn("flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all",
                        form.type === type ? `${bg} border-current ring-1 ring-current ${color}` : "border-border hover:bg-muted"
                      )}>
                      <Icon size={16} className={form.type === type ? color : "text-muted-foreground"} />
                      <span className="text-[9px] font-medium leading-tight">{type}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Message *</label>
                <textarea className="input-base w-full" rows={3} value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="What did they do that deserves recognition?" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost px-4 py-2 text-sm rounded-lg border border-border">Cancel</button>
              <button type="button" onClick={handleSend} disabled={saving} className="btn-gold px-4 py-2 text-sm">
                {saving ? "Sending…" : "Send Recognition 🎉"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
