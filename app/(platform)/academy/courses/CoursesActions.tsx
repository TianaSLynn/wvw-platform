"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "ONBOARDING",  label: "Onboarding" },
  { value: "ANNUAL",      label: "Annual" },
  { value: "QUARTERLY",   label: "Quarterly" },
  { value: "MANDATORY",   label: "Mandatory" },
  { value: "COMPLIANCE",  label: "Compliance" },
  { value: "LEADERSHIP",  label: "Leadership" },
  { value: "DEI",         label: "DEI" },
  { value: "WELLBEING",   label: "Wellbeing" },
  { value: "SKILLS",      label: "Skills" },
  { value: "ELECTIVE",    label: "Elective" },
] as const;

const LEVELS = [
  { value: "BEGINNER",     label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED",     label: "Advanced" },
  { value: "EXPERT",       label: "Expert" },
] as const;

export function NewCourseButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "ELECTIVE" as string,
    level: "BEGINNER" as string,
    duration: "",
    format: "",
    audience: "",
    modules: "1",
    passingScore: "70",
    contentUrl: "",
    tags: "",
    isPublished: false,
  });

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          level: form.level,
          duration: form.duration || undefined,
          format: form.format || undefined,
          audience: form.audience || undefined,
          modules: parseInt(form.modules) || 1,
          passingScore: parseInt(form.passingScore) || 70,
          contentUrl: form.contentUrl || undefined,
          tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          isPublished: form.isPublished,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create course");
        return;
      }
      setOpen(false);
      setForm({ title: "", description: "", category: "ELECTIVE", level: "BEGINNER", duration: "", format: "", audience: "", modules: "1", passingScore: "70", contentUrl: "", tags: "", isPublished: false });
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
        <Plus size={16} /> New Course
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="text-sm font-semibold">New Course</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Title *</label>
                <input
                  className="input-base w-full"
                  placeholder="e.g. Audit Fundamentals Bootcamp"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Description *</label>
                <textarea
                  className="input-base w-full resize-none"
                  rows={3}
                  placeholder="Describe the course objectives and content..."
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Category</label>
                  <select className="input-base w-full" value={form.category} onChange={(e) => set("category", e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Level</label>
                  <select className="input-base w-full" value={form.level} onChange={(e) => set("level", e.target.value)}>
                    {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Duration</label>
                  <input className="input-base w-full" placeholder="e.g. 4 weeks, 90 min" value={form.duration} onChange={(e) => set("duration", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Format</label>
                  <input className="input-base w-full" placeholder="e.g. Self-paced, Live, Hybrid" value={form.format} onChange={(e) => set("format", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Audience</label>
                  <input className="input-base w-full" placeholder="e.g. All staff, Managers" value={form.audience} onChange={(e) => set("audience", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Modules</label>
                  <input className="input-base w-full" type="number" min="1" value={form.modules} onChange={(e) => set("modules", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Passing Score (%)</label>
                  <input className="input-base w-full" type="number" min="0" max="100" value={form.passingScore} onChange={(e) => set("passingScore", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Content URL</label>
                  <input className="input-base w-full" placeholder="Link to course content" value={form.contentUrl} onChange={(e) => set("contentUrl", e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Tags <span className="text-muted-foreground font-normal">(comma separated)</span></label>
                <input className="input-base w-full" placeholder="e.g. HIPAA, compliance, onboarding" value={form.tags} onChange={(e) => set("tags", e.target.value)} />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={form.isPublished}
                  onChange={(e) => set("isPublished", e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="isPublished" className="text-xs text-foreground">Publish immediately</label>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1 text-sm">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function DeleteCourseButton({ courseId, title }: { courseId: string; title: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        <button type="button" onClick={handleDelete} disabled={loading}
          className="text-[10px] text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 hover:bg-red-500/20 transition-colors">
          {loading ? "…" : "Delete"}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="p-0.5 rounded hover:bg-muted">
          <X size={10} className="text-muted-foreground" />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={`Delete ${title}`}
      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
    >
      <X size={12} className="text-red-500/70" />
    </button>
  );
}

export function CategoryFilter({ current }: { current: string }) {
  const router = useRouter();
  const ALL = [{ value: "", label: "All" }, ...CATEGORIES];

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {ALL.map((cat) => (
        <button
          key={cat.value}
          onClick={() => {
            const url = new URL(window.location.href);
            if (cat.value) url.searchParams.set("category", cat.value);
            else url.searchParams.delete("category");
            router.push(url.pathname + url.search);
          }}
          className={cn(
            "text-xs px-2.5 py-1 rounded-full border transition-colors",
            current === cat.value
              ? "bg-navy-900 text-white border-navy-900 dark:bg-gold dark:border-gold dark:text-navy-900"
              : "bg-muted text-muted-foreground border-border hover:border-foreground/30"
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
