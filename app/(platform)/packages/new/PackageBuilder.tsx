"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, BookOpen, ExternalLink, Plus, X, Tag, Layers, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type Template = { id: string; name: string; type: string; isGlobal: boolean };
type Course   = { id: string; title: string; category: string; duration: string | null; level: string };

const CATEGORIES = [
  "Culture Audit", "HR Compliance", "Leadership", "DEI & Inclusion",
  "Wellness", "IT & Cybersecurity", "Risk Management", "Custom",
];

const AUDIENCES = [
  "All Staff", "Managers", "HR Teams", "Executives", "Leadership Team", "All Levels",
];

interface Props {
  templates: Template[];
  courses: Course[];
}

export default function PackageBuilder({ templates, courses }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [audience, setAudience] = useState("");
  const [duration, setDuration] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [notionUrl, setNotionUrl] = useState("");
  const [notionLabel, setNotionLabel] = useState("Notion Tracker");
  const [pricePerUse, setPricePerUse] = useState("");
  const [priceMonthly, setPriceMonthly] = useState("");
  const [deliverables, setDeliverables] = useState<string[]>(["", "", ""]);
  const [isFeatured, setIsFeatured] = useState(false);

  function autoSlug(val: string) {
    return val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function handleNameChange(val: string) {
    setName(val);
    if (!slug || slug === autoSlug(name)) {
      setSlug(autoSlug(val));
    }
  }

  function toggleCourse(id: string) {
    setSelectedCourses((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleSubmit() {
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          tagline: tagline.trim() || undefined,
          description: description.trim() || undefined,
          category: category || undefined,
          audience: audience || undefined,
          duration: duration.trim() || undefined,
          auditTemplateId: selectedTemplate || undefined,
          courseIds: selectedCourses,
          notionUrl: notionUrl.trim() || undefined,
          notionLabel: notionLabel.trim() || undefined,
          pricePerUse: pricePerUse ? parseFloat(pricePerUse) : undefined,
          priceMonthly: priceMonthly ? parseFloat(priceMonthly) : undefined,
          deliverables: deliverables.filter((d) => d.trim()),
          isFeatured,
        }),
      });
      if (!res.ok) {
        const b = await res.json();
        throw new Error(b.error ?? "Failed to create package");
      }
      const { data } = await res.json();
      router.push(`/packages/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSaving(false);
    }
  }

  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate);
  const selectedCoursesData = courses.filter((c) => selectedCourses.includes(c.id));
  const hasContent = selectedTemplate || selectedCourses.length > 0 || notionUrl;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      {/* Step 1: Identity */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">1. Package Identity</h2>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">Package Name *</label>
            <input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Culture & Inclusion Audit Bundle"
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground">Slug *</label>
              <div className="mt-1 flex items-center gap-1">
                <span className="text-xs text-muted-foreground px-2">packages/</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(autoSlug(e.target.value))}
                  placeholder="culture-audit-bundle"
                  className="flex-1 h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="">Select…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Tagline</label>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="A short, compelling phrase (shown on the card)"
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What does this package address? Who is it for? What outcomes does it drive?"
              className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground">Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="">Select…</option>
                {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Duration</label>
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 3 weeks"
                className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded accent-gold"
                />
                Featured
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Audit Template */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardList size={16} className="text-blue-500" />
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">2. Audit Template</h2>
          <span className="text-xs text-muted-foreground">(optional)</span>
        </div>

        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
        >
          <option value="">No audit template</option>
          {templates.filter((t) => t.isGlobal).length > 0 && (
            <optgroup label="Framework Templates">
              {templates.filter((t) => t.isGlobal).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </optgroup>
          )}
          {templates.filter((t) => !t.isGlobal).length > 0 && (
            <optgroup label="Your Templates">
              {templates.filter((t) => !t.isGlobal).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </optgroup>
          )}
        </select>

        {selectedTemplateData && (
          <div className="flex items-center gap-2 text-xs bg-blue-500/10 border border-blue-500/20 px-3 py-2 rounded-lg">
            <ClipboardList size={12} className="text-blue-500" />
            <span className="font-medium text-blue-700">{selectedTemplateData.name}</span>
            {selectedTemplateData.isGlobal && (
              <span className="ml-auto text-[10px] text-blue-500/70">Framework</span>
            )}
          </div>
        )}
      </div>

      {/* Step 3: Training Courses */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-sage" />
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">3. Training Courses</h2>
          <span className="text-xs text-muted-foreground">(select one or more)</span>
        </div>

        {courses.length === 0 ? (
          <div className="text-xs text-muted-foreground py-4 text-center">
            No courses yet — <a href="/academy/courses" className="text-gold hover:underline">create courses in Academy</a> first
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
            {courses.map((c) => {
              const isSelected = selectedCourses.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCourse(c.id)}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-colors",
                    isSelected ? "bg-sage/10 border-sage/30" : "border-border hover:border-border/60"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground truncate">{c.title}</p>
                    {isSelected && <BookOpen size={11} className="text-sage flex-shrink-0 ml-2" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{c.category}{c.duration ? ` · ${c.duration}` : ""}</p>
                </button>
              );
            })}
          </div>
        )}

        {selectedCoursesData.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{selectedCoursesData.length}</span> course{selectedCoursesData.length !== 1 ? "s" : ""} selected
          </div>
        )}
      </div>

      {/* Step 4: Notion Tracker */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-purple-500" />
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">4. Notion Tracker</h2>
          <span className="text-xs text-muted-foreground">(optional)</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Link the Notion template or tracker that clients will use to implement the audit recommendations.
        </p>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="text-sm font-medium text-foreground">Notion URL</label>
            <div className="mt-1 relative">
              <ExternalLink size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                value={notionUrl}
                onChange={(e) => setNotionUrl(e.target.value)}
                placeholder="https://notion.so/your-tracker-template"
                className="w-full h-9 pl-9 pr-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Tracker Label</label>
            <input
              value={notionLabel}
              onChange={(e) => setNotionLabel(e.target.value)}
              placeholder="Notion Tracker"
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
        </div>
      </div>

      {/* Step 5: Pricing */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">5. Pricing (optional)</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">Price per Use ($)</label>
            <div className="mt-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                min="0"
                value={pricePerUse}
                onChange={(e) => setPricePerUse(e.target.value)}
                placeholder="0.00"
                className="w-full h-9 pl-7 pr-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Monthly License ($)</label>
            <div className="mt-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                min="0"
                value={priceMonthly}
                onChange={(e) => setPriceMonthly(e.target.value)}
                placeholder="0.00"
                className="w-full h-9 pl-7 pr-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step 6: Deliverables */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">6. Deliverables</h2>
        <p className="text-xs text-muted-foreground">List what the client receives with this package</p>
        <div className="space-y-2">
          {deliverables.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}.</span>
              <input
                value={d}
                onChange={(e) => setDeliverables((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))}
                placeholder={`Deliverable ${i + 1}`}
                className="flex-1 h-8 px-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
              />
              <button
                type="button"
                onClick={() => setDeliverables((prev) => prev.filter((_, idx) => idx !== i))}
                className="p-1 text-muted-foreground hover:text-destructive"
              >
                <X size={13} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setDeliverables((prev) => [...prev, ""])}
            className="text-xs text-gold hover:text-gold/80 flex items-center gap-1 mt-1"
          >
            <Plus size={12} /> Add deliverable
          </button>
        </div>
      </div>

      {/* Preview summary */}
      {hasContent && (
        <div className="bg-navy-900/5 border border-navy-900/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Layers size={14} className="text-navy-900 dark:text-white/60" />
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Package Preview</h3>
          </div>
          <div className="space-y-1.5 text-xs">
            <p className="font-semibold text-foreground">{name || "Untitled Package"}</p>
            {tagline && <p className="text-gold">{tagline}</p>}
            {selectedTemplateData && (
              <p className="text-muted-foreground flex items-center gap-1.5">
                <ClipboardList size={10} className="text-blue-500" />
                Audit: {selectedTemplateData.name}
              </p>
            )}
            {selectedCoursesData.map((c) => (
              <p key={c.id} className="text-muted-foreground flex items-center gap-1.5">
                <BookOpen size={10} className="text-sage" />
                Course: {c.title}
              </p>
            ))}
            {notionUrl && (
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Tag size={10} className="text-purple-500" />
                Tracker: {notionLabel || "Notion Tracker"}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 h-9 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !name.trim() || !slug.trim()}
          className="flex items-center gap-2 px-6 h-9 rounded-lg text-sm font-semibold bg-navy-900 text-white hover:bg-navy-800 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating…
            </>
          ) : (
            <>
              <Zap size={14} />
              Create Package
            </>
          )}
        </button>
      </div>
    </div>
  );
}
