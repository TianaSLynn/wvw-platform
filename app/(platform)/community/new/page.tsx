"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Hash } from "lucide-react";
import Link from "next/link";

const SPACE_TYPES = [
  { value: "GENERAL",        label: "General",        desc: "Open discussion for any topic" },
  { value: "COHORT",         label: "Cohort",         desc: "Group space for programs or training cohorts" },
  { value: "IMPLEMENTATION", label: "Implementation", desc: "Focused on a specific project or engagement" },
  { value: "ANNOUNCEMENT",   label: "Announcements",  desc: "One-way broadcast space for important updates" },
  { value: "RESOURCE",       label: "Resources",      desc: "Shared guides, toolkits, and reference materials" },
  { value: "ACADEMY",        label: "Academy",        desc: "Learning and development content" },
];

export default function NewCommunitySpacePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", type: "GENERAL" });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json() as { error?: string };
        throw new Error(j.error ?? "Failed to create space");
      }
      const { data } = await res.json() as { data: { id: string } };
      router.push(`/community/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating space");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <Link href="/community" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft size={12} /> Back to Community
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Hash size={18} className="text-purple-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">New Community Space</h1>
            <p className="text-xs text-muted-foreground">Create a space for discussion, resources, or cohort collaboration</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="section-card p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Space Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="input-base w-full"
              placeholder="e.g. General Discussion"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="input-base w-full resize-none"
              rows={2}
              placeholder="What is this space for?"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Space Type *</label>
            <div className="space-y-2">
              {SPACE_TYPES.map((t) => (
                <label key={t.value} className="flex items-start gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-muted/40 transition-colors has-[:checked]:border-gold/60 has-[:checked]:bg-gold/5">
                  <input
                    type="radio"
                    name="type"
                    value={t.value}
                    checked={form.type === t.value}
                    onChange={() => set("type", t.value)}
                    className="mt-0.5 accent-gold"
                  />
                  <div>
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>
        )}

        <div className="flex items-center justify-end gap-2 pb-4">
          <Link href="/community" className="btn-ghost text-sm">Cancel</Link>
          <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? "Creating…" : "Create Space"}
          </button>
        </div>
      </form>
    </div>
  );
}
