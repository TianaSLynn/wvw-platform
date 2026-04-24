"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, Sparkles, Loader2, ChevronLeft, Brain,
  Target, Shield, Zap, Info, CheckCircle,
} from "lucide-react";

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"]),
  likelihood: z.coerce.number().min(1).max(5),
  category: z.string().optional(),
  rootCause: z.string().optional(),
  recommendation: z.string().optional(),
  managementResponse: z.string().optional(),
  regulatoryRef: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AIAnalysis {
  rootCauses: string[];
  impact: string;
  likelihood: number;
  riskScore: number;
  recommendation: string;
  quickWins: string[];
  controlRefs: string[];
  relatedRisks: string[];
  managementResponse: string;
}

interface Props {
  audit: {
    id: string; name: string; code: string | null; type: string;
    client: { name: string };
    members: Array<{ userId: string }>;
  };
  orgUsers: Array<{ id: string; firstName: string; lastName: string; title: string | null }>;
}

const SEVERITY_OPTIONS = [
  { value: "CRITICAL",      label: "Critical",      color: "text-red-600",    bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800" },
  { value: "HIGH",          label: "High",           color: "text-orange-600", bg: "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800" },
  { value: "MEDIUM",        label: "Medium",         color: "text-amber-600",  bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800" },
  { value: "LOW",           label: "Low",            color: "text-blue-600",   bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800" },
  { value: "INFORMATIONAL", label: "Informational",  color: "text-gray-600",   bg: "bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700" },
];

const CATEGORIES = [
  "Access Control", "Change Management", "Data Protection", "Encryption",
  "Incident Response", "Logging & Monitoring", "Network Security", "Physical Security",
  "Policy & Procedure", "Risk Management", "Third-Party Management", "Training & Awareness",
  "Vulnerability Management", "Business Continuity", "Compliance", "Other",
];

export default function NewFindingForm({ audit, orgUsers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { severity: "MEDIUM", likelihood: 3 },
  });

  const title = watch("title");
  const description = watch("description");
  const severity = watch("severity");

  const analyzeWithAI = async () => {
    if (!title || title.length < 5 || !description || description.length < 20) {
      setAnalysisError("Please fill in the title and description first (minimum lengths required).");
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError("");
    try {
      const res = await fetch("/api/ai/analyze-finding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, severity, auditType: audit.type }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json() as { data: AIAnalysis };
      const a = data.data;
      setAnalysis(a);

      // Auto-populate form fields
      if (a.rootCauses?.length) setValue("rootCause", a.rootCauses.join("\n\n"));
      if (a.recommendation) setValue("recommendation", a.recommendation);
      if (a.managementResponse) setValue("managementResponse", a.managementResponse);
      if (a.likelihood) setValue("likelihood", a.likelihood);
      if (a.controlRefs?.length) setValue("regulatoryRef", a.controlRefs.join(", "));
    } catch {
      setAnalysisError("AI analysis failed. You can still submit manually.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSubmitError("");
    try {
      const res = await fetch(`/api/audits/${audit.id}/findings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string };
        setSubmitError(json.error ?? "Failed to create finding. Please try again.");
        return;
      }
      startTransition(() => router.push(`/audits/${audit.id}?tab=findings`));
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    }
  };

  const selectedSeverity = SEVERITY_OPTIONS.find((s) => s.value === severity);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft size={16} /> Back to audit
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">New Finding</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {audit.code} · {audit.name} · {audit.client.name}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Core details */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <Target size={16} className="text-gold" /> Finding Details
          </h2>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Title <span className="text-red-500">*</span></label>
            <input
              {...register("title")}
              placeholder="e.g., Inadequate access control reviews for privileged accounts"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Description <span className="text-red-500">*</span></label>
            <textarea
              {...register("description")}
              rows={4}
              placeholder="Describe the finding in detail — what was observed, where it was found, and the evidence supporting it..."
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground resize-y"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Category</label>
              <select
                {...register("category")}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Assignee</label>
              <select
                {...register("assigneeId")}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="">Unassigned</option>
                {orgUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}{u.title ? ` · ${u.title}` : ""}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Due Date</label>
            <input
              type="date"
              {...register("dueDate")}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <Shield size={16} className="text-gold" /> Risk Assessment
          </h2>

          {/* Severity */}
          <div>
            <label className="text-sm font-medium mb-2 block">Severity <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-5 gap-2">
              {SEVERITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue("severity", opt.value as FormData["severity"])}
                  className={cn(
                    "py-2.5 rounded-xl border text-xs font-medium transition-all",
                    severity === opt.value ? `${opt.bg} ${opt.color}` : "border-border text-muted-foreground hover:border-gold/30"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Likelihood */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Likelihood <span className="text-muted-foreground font-normal">(1 = Rare · 5 = Almost Certain)</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setValue("likelihood", n)}
                  className={cn(
                    "flex-1 py-2 rounded-xl border text-sm font-medium transition-all",
                    watch("likelihood") === n
                      ? "bg-navy-900 text-white border-navy-700"
                      : "border-border text-muted-foreground hover:border-gold/30"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Regulatory ref */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Regulatory / Control References</label>
            <input
              {...register("regulatoryRef")}
              placeholder="e.g., SOC 2 CC6.1, ISO 27001 A.9.2, NIST AC-2"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* AI Analysis */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base flex items-center gap-2">
              <Brain size={16} className="text-gold" /> AI Analysis
            </h2>
            <button
              type="button"
              onClick={analyzeWithAI}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-navy-900 to-navy-700 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isAnalyzing ? (
                <><Loader2 size={14} className="animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles size={14} /> Analyze with AI</>
              )}
            </button>
          </div>

          {analysisError && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600">
              <Info size={14} className="flex-shrink-0" /> {analysisError}
            </div>
          )}

          {analysis && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <CheckCircle size={14} /> AI analysis complete — fields auto-populated below
              </div>

              {/* Quick wins & related risks */}
              <div className="grid grid-cols-2 gap-3">
                {analysis.quickWins?.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-3">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1.5">
                      <Zap size={11} /> Quick Wins
                    </p>
                    <ul className="space-y-1">
                      {analysis.quickWins.map((w, i) => (
                        <li key={i} className="text-xs text-green-700 dark:text-green-300">• {w}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.relatedRisks?.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                      <AlertTriangle size={11} /> Related Risks
                    </p>
                    <ul className="space-y-1">
                      {analysis.relatedRisks.map((r, i) => (
                        <li key={i} className="text-xs text-amber-700 dark:text-amber-300">• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/40 rounded-xl px-3 py-2">
                <Info size={12} /> Risk Score computed: <span className="font-semibold text-foreground">{analysis.riskScore}/25</span>
                · Impact: <span className="font-medium text-foreground">{analysis.impact}</span>
              </div>
            </div>
          )}

          {!analysis && !isAnalyzing && (
            <p className="text-sm text-muted-foreground">
              Click &ldquo;Analyze with AI&rdquo; after filling in the title and description to get AI-powered root cause analysis, recommendations, and management response.
            </p>
          )}
        </div>

        {/* Narrative fields */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h2 className="font-semibold text-base">Narrative</h2>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Root Cause</label>
            <textarea
              {...register("rootCause")}
              rows={4}
              placeholder="What is the underlying cause of this finding?"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground resize-y"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Recommendation</label>
            <textarea
              {...register("recommendation")}
              rows={4}
              placeholder="What actions should be taken to remediate this finding?"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground resize-y"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Draft Management Response</label>
            <textarea
              {...register("managementResponse")}
              rows={3}
              placeholder="Draft a management response acknowledging the finding and committing to remediation..."
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground resize-y"
            />
          </div>
        </div>

        {/* Actions */}
        {submitError && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600">
            <AlertTriangle size={13} className="flex-shrink-0" />
            {submitError}
          </div>
        )}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-xl border border-border text-sm hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-medium hover:bg-navy-800 disabled:opacity-60 transition-colors"
          >
            {(isSubmitting || isPending) && <Loader2 size={14} className="animate-spin" />}
            Create Finding
          </button>
        </div>
      </form>
    </div>
  );
}
