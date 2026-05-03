"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const AUDIT_TYPES = [
  { value: "COMPLIANCE",   label: "Compliance",   desc: "Regulatory & framework compliance" },
  { value: "HR",           label: "HR",           desc: "Human resources & culture" },
  { value: "OPERATIONAL",  label: "Operational",  desc: "Process & operational efficiency" },
  { value: "IT",           label: "IT Security",  desc: "Technology & cybersecurity" },
  { value: "FINANCIAL",    label: "Financial",    desc: "Financial controls & accuracy" },
  { value: "RISK",         label: "Risk",         desc: "Risk assessment & management" },
  { value: "INTERNAL",     label: "Internal",     desc: "Internal audit & controls" },
  { value: "CUSTOM",       label: "Custom",       desc: "General / other" },
];

export default function NewTemplateForm() {
  const router = useRouter();
  const [name, setName]           = useState("");
  const [description, setDesc]    = useState("");
  const [type, setType]           = useState("COMPLIANCE");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Template name is required"); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/audit-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, type }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to create template");
      }
      router.push("/audit-catalog");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      <div className="section-card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Template Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Organizational Health Assessment"
            className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            placeholder="Briefly describe what this audit covers and who it's for"
            className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold resize-none"
          />
        </div>
      </div>

      <div className="section-card p-6 space-y-3">
        <h2 className="text-sm font-semibold">Audit Type</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {AUDIT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={cn(
                "p-3 rounded-lg border text-left transition-colors",
                type === t.value
                  ? "bg-gold/10 border-gold/30 text-foreground"
                  : "border-border text-muted-foreground hover:border-border/60"
              )}
            >
              <p className="font-semibold text-xs">{t.label}</p>
              <p className="text-[10px] mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="px-4 h-9 rounded-lg text-sm border border-border hover:bg-muted transition-colors">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 h-9 rounded-lg text-sm font-semibold bg-navy-900 text-white hover:bg-navy-800 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Creating…" : "Create Template"}
        </button>
      </div>
    </form>
  );
}
