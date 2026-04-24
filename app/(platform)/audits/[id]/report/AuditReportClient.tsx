"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  FileText, Sparkles, Loader2, ChevronLeft, Printer,
  CheckCircle, AlertTriangle, Shield, TrendingUp,
  Award, Target, Users, BarChart3, ClipboardCheck,
} from "lucide-react";

interface Finding {
  id: string; findingNumber: string | null; title: string;
  severity: string; status: string; riskScore: number | null;
}

interface Audit {
  id: string; name: string; code: string | null; type: string; status: string;
  scope: string | null; overallRiskScore: number | null;
  client: { name: string; industry: string | null };
  members: Array<{ role: string; user: { firstName: string; lastName: string; title: string | null } }>;
  frameworks: Array<{ framework: { name: string } }>;
  findings: Finding[];
}

interface ReportNarrative {
  executiveSummary: string;
  auditOpinion: string;
  opinionRationale: string;
  keyStrengths: string[];
  criticalObservations: string;
  riskRating: string;
  overallRiskScore: number;
  recommendationSummary: string;
  managementActionPlan: string;
  conclusion: string;
  disclaimers: string[];
}

interface GeneratedReport {
  audit: {
    name: string; code: string | null; type: string; status: string;
    client: { name: string; industry: string | null };
    scope: string | null;
    frameworks: string[];
    team: Array<{ name: string; title: string | null; role: string }>;
    fieldworkStart: string | null; fieldworkEnd: string | null;
    reportDate: string;
  };
  metrics: {
    checklistCompletion: number;
    findingsBySeverity: Record<string, number>;
    openFindings: number;
    remediatedFindings: number;
    evidenceCount: number;
  };
  findings: Finding[];
  narrative: ReportNarrative;
  generatedAt: string;
  generatedBy: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
  HIGH:     "text-orange-600 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
  MEDIUM:   "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
  LOW:      "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
  INFORMATIONAL: "text-gray-600 bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700",
};

const OPINION_COLORS: Record<string, string> = {
  Clean:      "text-green-600 bg-green-50 dark:bg-green-950/30 border-green-300",
  Qualified:  "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-300",
  Adverse:    "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-300",
  Disclaimer: "text-gray-600 bg-gray-50 dark:bg-gray-900/50 border-gray-300",
};

const RISK_RATING_COLORS: Record<string, string> = {
  Critical: "text-red-600",
  High:     "text-orange-600",
  Medium:   "text-amber-600",
  Low:      "text-green-600",
};

export default function AuditReportClient({ audit }: { audit: Audit }) {
  const router = useRouter();
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const generateReport = async () => {
    setIsGenerating(true);
    setError("");
    try {
      const res = await fetch(`/api/reports/${audit.id}`, { method: "POST" });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json() as { data: GeneratedReport };
      setReport(data.data);
    } catch {
      setError("Report generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const printReport = () => window.print();

  const narrative = report?.narrative;
  const metrics   = report?.metrics;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between print:hidden">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft size={16} /> Back to audit
          </button>
          <h1 className="text-2xl font-bold">Audit Report</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {audit.code} · {audit.name} · {audit.client.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {report && (
            <button
              onClick={printReport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted transition-colors"
            >
              <Printer size={15} /> Print / Export
            </button>
          )}
          <button
            onClick={generateReport}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-navy-900 to-navy-700 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {isGenerating ? (
              <><Loader2 size={15} className="animate-spin" /> Generating Report...</>
            ) : (
              <><Sparkles size={15} /> {report ? "Regenerate" : "Generate AI Report"}</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isGenerating && (
        <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-700 border border-gold/20 flex items-center justify-center">
            <Sparkles size={28} className="text-gold animate-pulse" />
          </div>
          <div className="text-center">
            <p className="font-semibold">Generating your audit report...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Claude is analyzing {audit.findings.length} findings and building the executive narrative.
            </p>
          </div>
          <div className="flex gap-1.5 mt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-gold/60 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!report && !isGenerating && (
        <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <FileText size={28} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-lg">No report generated yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Click &ldquo;Generate AI Report&rdquo; to produce a professional audit report with executive summary,
              risk ratings, findings analysis, and recommendations — powered by Claude Opus 4.6.
            </p>
          </div>
          {/* Audit snapshot */}
          <div className="grid grid-cols-3 gap-3 mt-2 w-full max-w-md">
            {[
              { label: "Findings",   value: audit.findings.length,                  color: "text-orange-500" },
              { label: "Critical",   value: audit.findings.filter((f) => f.severity === "CRITICAL").length, color: "text-red-500" },
              { label: "Open",       value: audit.findings.filter((f) => ["OPEN","IN_PROGRESS"].includes(f.status)).length, color: "text-amber-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-background rounded-xl border border-border p-3 text-center">
                <p className={cn("text-2xl font-bold", color)}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated report */}
      {report && narrative && metrics && (
        <div className="space-y-6 print:space-y-4" id="report-content">

          {/* Cover block */}
          <div className="bg-gradient-to-br from-navy-900 to-navy-700 rounded-2xl p-8 text-white print:rounded-none">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-2">Confidential · WVW Intelligence</p>
                <h2 className="text-3xl font-bold mb-1">{report.audit.name}</h2>
                <p className="text-white/70 text-sm">{report.audit.code} · {report.audit.type}</p>
              </div>
              <div className={cn(
                "px-4 py-2 rounded-xl border text-sm font-semibold",
                OPINION_COLORS[narrative.auditOpinion] ?? "text-white border-white/20"
              )}>
                {narrative.auditOpinion} Opinion
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Client",       value: report.audit.client.name },
                { label: "Industry",     value: report.audit.client.industry ?? "N/A" },
                { label: "Report Date",  value: new Date(report.audit.reportDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
                { label: "Prepared By",  value: report.generatedBy },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-white/50 text-xs mb-0.5">{label}</p>
                  <p className="text-white text-sm font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Opinion + Risk Rating strip */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Audit Opinion</p>
              <p className={cn("text-lg font-bold", OPINION_COLORS[narrative.auditOpinion]?.split(" ")[0] ?? "")}>{narrative.auditOpinion}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Risk Rating</p>
              <p className={cn("text-lg font-bold", RISK_RATING_COLORS[narrative.riskRating] ?? "text-foreground")}>{narrative.riskRating}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Risk Score</p>
              <p className="text-lg font-bold text-foreground">{narrative.overallRiskScore}<span className="text-xs text-muted-foreground">/100</span></p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Checklist</p>
              <p className="text-lg font-bold text-foreground">{metrics.checklistCompletion}<span className="text-xs text-muted-foreground">%</span></p>
            </div>
          </div>

          {/* Findings severity distribution */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-gold" /> Findings by Severity
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"].map((sev) => (
                <div key={sev} className={cn("rounded-xl border p-3 text-center", SEVERITY_COLORS[sev])}>
                  <p className="text-2xl font-bold">{metrics.findingsBySeverity[sev] ?? 0}</p>
                  <p className="text-xs mt-0.5 capitalize">{sev.toLowerCase()}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-6 mt-4 text-sm text-muted-foreground">
              <span>Open: <strong className="text-foreground">{metrics.openFindings}</strong></span>
              <span>Remediated: <strong className="text-foreground">{metrics.remediatedFindings}</strong></span>
              <span>Evidence Items: <strong className="text-foreground">{metrics.evidenceCount}</strong></span>
            </div>
          </div>

          {/* Executive Summary */}
          <Section icon={<FileText size={16} />} title="Executive Summary">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {narrative.executiveSummary.split("\n\n").map((p, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-3">{p}</p>
              ))}
            </div>
            <div className="mt-4 px-4 py-3 bg-muted/40 rounded-xl border border-border text-sm italic text-muted-foreground">
              <strong className="text-foreground not-italic">Opinion Rationale:</strong> {narrative.opinionRationale}
            </div>
          </Section>

          {/* Key Strengths */}
          {narrative.keyStrengths?.length > 0 && (
            <Section icon={<Award size={16} />} title="Key Strengths">
              <ul className="space-y-2">
                {narrative.keyStrengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" /> {s}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Critical Observations */}
          <Section icon={<AlertTriangle size={16} />} title="Critical Observations">
            <div>
              {narrative.criticalObservations.split("\n\n").map((p, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-3">{p}</p>
              ))}
            </div>
          </Section>

          {/* Findings Detail */}
          <Section icon={<Target size={16} />} title="Findings Detail">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">#</th>
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Finding</th>
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Severity</th>
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Status</th>
                    <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Risk Score</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.findings.map((f) => (
                    <tr key={f.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 text-muted-foreground font-mono text-xs">F-{String(f.findingNumber).padStart(3, "0")}</td>
                      <td className="py-2.5 px-3 font-medium text-foreground">{f.title}</td>
                      <td className="py-2.5 px-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", SEVERITY_COLORS[f.severity])}>
                          {f.severity.charAt(0) + f.severity.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground capitalize">
                        {f.status.replace(/_/g, " ").toLowerCase()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-sm">
                        {f.riskScore ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Recommendations */}
          <Section icon={<TrendingUp size={16} />} title="Recommendations">
            {narrative.recommendationSummary.split("\n\n").map((p, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-3">{p}</p>
            ))}
          </Section>

          {/* Management Action Plan */}
          <Section icon={<ClipboardCheck size={16} />} title="Management Action Plan">
            <p className="text-sm text-muted-foreground leading-relaxed">{narrative.managementActionPlan}</p>
          </Section>

          {/* Conclusion */}
          <Section icon={<Shield size={16} />} title="Conclusion">
            {narrative.conclusion.split("\n\n").map((p, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-3">{p}</p>
            ))}
          </Section>

          {/* Team */}
          {report.audit.team.length > 0 && (
            <Section icon={<Users size={16} />} title="Audit Team">
              <div className="grid grid-cols-3 gap-3">
                {report.audit.team.map((m, i) => (
                  <div key={i} className="bg-muted/40 rounded-xl border border-border p-3">
                    <p className="font-medium text-sm">{m.name}</p>
                    {m.title && <p className="text-xs text-muted-foreground">{m.title}</p>}
                    <p className="text-xs text-gold mt-1">{m.role}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Disclaimers */}
          {narrative.disclaimers?.length > 0 && (
            <div className="bg-muted/30 rounded-2xl border border-border p-6">
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Disclaimers</p>
              <ul className="space-y-2">
                {narrative.disclaimers.map((d, i) => (
                  <li key={i} className="text-xs text-muted-foreground leading-relaxed">• {d}</li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-4">
                Report generated {new Date(report.generatedAt).toLocaleString()} by {report.generatedBy} via WVW Intelligence AI.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
        <span className="text-gold">{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}
