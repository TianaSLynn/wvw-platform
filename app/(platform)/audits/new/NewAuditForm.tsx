"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { auditSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { BookOpen, FileText, Zap } from "lucide-react";
import type { z } from "zod";

type FormData = z.infer<typeof auditSchema>;

const AUDIT_TYPES = [
  { value: "COMPLIANCE",   label: "Compliance",   desc: "Regulatory & framework compliance" },
  { value: "HR",           label: "HR",           desc: "Human resources & culture audit" },
  { value: "OPERATIONAL",  label: "Operational",  desc: "Process & operational efficiency" },
  { value: "IT",           label: "IT Security",  desc: "Technology & cybersecurity" },
  { value: "FINANCIAL",    label: "Financial",    desc: "Financial controls & accuracy" },
  { value: "RISK",         label: "Risk",         desc: "Risk assessment & management" },
  { value: "INTERNAL",     label: "Internal",     desc: "Internal audit & controls" },
  { value: "CUSTOM",       label: "Custom",       desc: "Build from scratch" },
];

interface Props {
  clients: Array<{ id: string; name: string }>;
  templates: Array<{ id: string; name: string; type: string; description: string | null; isGlobal: boolean }>;
  initialTemplateId?: string;
}

export default function NewAuditForm({ clients, templates, initialTemplateId }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(initialTemplateId ?? null);

  const preselectedTpl = initialTemplateId ? templates.find((t) => t.id === initialTemplateId) : null;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(auditSchema),
    defaultValues: {
      type: (preselectedTpl?.type as FormData["type"]) ?? "COMPLIANCE",
      tags: [],
      objectives: [],
    },
  });

  const selectedType = watch("type");

  const filteredTemplates = templates.filter(
    (t) => !selectedType || t.type === selectedType || t.type === "CUSTOM"
  );

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, templateId: selectedTemplate ?? undefined }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to create audit");
      }
      const { data: audit } = await res.json();
      router.push(`/audits/${audit.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      {/* Step 1: Basic Info */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">1. Basic Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-sm font-medium text-foreground">Audit Name *</label>
            <input
              {...register("name")}
              placeholder="e.g. Q1 2025 HR Compliance Audit"
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Client *</label>
            <select
              {...register("clientId")}
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.clientId && <p className="text-xs text-destructive mt-1">{errors.clientId.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Audit Code (optional)</label>
            <input
              {...register("code")}
              placeholder="AUD-2025-001"
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold font-mono"
            />
          </div>

          <div className="col-span-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              {...register("description")}
              rows={2}
              placeholder="Brief description of the audit objectives and context"
              className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold resize-none"
            />
          </div>

          <div className="col-span-2">
            <label className="text-sm font-medium text-foreground">Scope Statement</label>
            <textarea
              {...register("scope")}
              rows={2}
              placeholder="Define what is in scope and out of scope for this audit"
              className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold resize-none"
            />
          </div>
        </div>
      </div>

      {/* Step 2: Type */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">2. Audit Type</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {AUDIT_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setValue("type", type.value as FormData["type"])}
              className={cn(
                "p-3 rounded-lg border text-left transition-colors",
                selectedType === type.value
                  ? "bg-gold/10 border-gold/30 text-foreground"
                  : "border-border text-muted-foreground hover:border-border/60"
              )}
            >
              <p className="font-semibold text-xs">{type.label}</p>
              <p className="text-[10px] mt-0.5">{type.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: Template */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">3. Start From</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <button
            type="button"
            onClick={() => setSelectedTemplate(null)}
            className={cn(
              "p-4 rounded-lg border text-left transition-colors flex items-start gap-3",
              selectedTemplate === null
                ? "bg-gold/10 border-gold/30"
                : "border-border hover:border-border/60"
            )}
          >
            <FileText size={18} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Blank Audit</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Build from scratch with custom sections</p>
            </div>
          </button>

          {filteredTemplates.slice(0, 2).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTemplate(t.id)}
              className={cn(
                "p-4 rounded-lg border text-left transition-colors flex items-start gap-3",
                selectedTemplate === t.id
                  ? "bg-gold/10 border-gold/30"
                  : "border-border hover:border-border/60"
              )}
            >
              <BookOpen size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="font-semibold text-sm">{t.name}</p>
                  {t.isGlobal && (
                    <span className="text-[9px] font-medium bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full border border-blue-500/20">
                      Framework
                    </span>
                  )}
                </div>
                {t.description && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>}
              </div>
            </button>
          ))}
        </div>

        {filteredTemplates.length > 2 && (
          <div>
            <label className="text-sm font-medium text-foreground">All Templates</label>
            <select
              value={selectedTemplate ?? ""}
              onChange={(e) => setSelectedTemplate(e.target.value || null)}
              className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="">No template (blank)</option>
              {filteredTemplates.filter(t => t.isGlobal).length > 0 && (
                <optgroup label="Framework Templates">
                  {filteredTemplates.filter(t => t.isGlobal).map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </optgroup>
              )}
              {filteredTemplates.filter(t => !t.isGlobal).length > 0 && (
                <optgroup label="Your Templates">
                  {filteredTemplates.filter(t => !t.isGlobal).map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        )}
      </div>

      {/* Step 4: Timeline */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">4. Timeline (optional)</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { field: "planningStartDate", label: "Planning Start" },
            { field: "fieldworkStartDate", label: "Fieldwork Start" },
            { field: "fieldworkEndDate", label: "Fieldwork End" },
            { field: "reportDueDate", label: "Report Due" },
          ].map(({ field, label }) => (
            <div key={field}>
              <label className="text-sm font-medium text-foreground">{label}</label>
              <input
                type="date"
                {...register(field as keyof FormData)}
                className="mt-1 w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
          ))}
        </div>
      </div>

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
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 h-9 rounded-lg text-sm font-semibold bg-navy-900 text-white hover:bg-navy-800 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating…
            </>
          ) : (
            <>
              <Zap size={14} />
              Create Audit
            </>
          )}
        </button>
      </div>
    </form>
  );
}
