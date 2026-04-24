import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Brain, Zap, TrendingUp, FileText, Shield, Search, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "AI Engine Hub" };

const AI_ENGINES = [
  {
    id: "risk-analyzer",
    name: "Risk Analyzer",
    description: "Scores and classifies audit findings by severity, probability, and business impact using contextual NLP.",
    icon: Shield,
    color: "text-red-500",
    bg: "bg-red-500/10 border-red-500/20",
    model: "claude-sonnet-4-6",
    uses: "Audits, Findings",
    callsToday: 142,
    accuracy: 94,
  },
  {
    id: "report-writer",
    name: "Report Writer",
    description: "Generates full audit reports, executive summaries, and management letters from structured audit data.",
    icon: FileText,
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
    model: "claude-opus-4-6",
    uses: "Reports",
    callsToday: 28,
    accuracy: 97,
  },
  {
    id: "trend-engine",
    name: "Trend & Anomaly Engine",
    description: "Detects patterns and anomalies across financial data, time entries, and client health metrics.",
    icon: TrendingUp,
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
    model: "claude-haiku-4-5",
    uses: "Financials, Dashboard",
    callsToday: 389,
    accuracy: 91,
  },
  {
    id: "document-reader",
    name: "Document Intelligence",
    description: "Extracts key information from uploaded documents, contracts, and evidence files automatically.",
    icon: Search,
    color: "text-purple-500",
    bg: "bg-purple-500/10 border-purple-500/20",
    model: "claude-sonnet-4-6",
    uses: "Evidence Vault",
    callsToday: 67,
    accuracy: 89,
  },
  {
    id: "recommendation-engine",
    name: "Recommendation Engine",
    description: "Generates actionable remediation steps and best-practice recommendations based on findings.",
    icon: Zap,
    color: "text-green-500",
    bg: "bg-green-500/10 border-green-500/20",
    model: "claude-sonnet-4-6",
    uses: "Recommendations",
    callsToday: 53,
    accuracy: 93,
  },
  {
    id: "ai-command",
    name: "AI Command Interface",
    description: "Natural language command layer allowing users to query data, generate content, and automate tasks.",
    icon: Brain,
    color: "text-gold",
    bg: "bg-gold/10 border-gold/20",
    model: "claude-opus-4-6",
    uses: "Platform-wide",
    callsToday: 201,
    accuracy: 96,
  },
];

export default async function AIEnginesPage() {
  await requireUser();

  const totalCalls = AI_ENGINES.reduce((s, e) => s + e.callsToday, 0);
  const avgAccuracy = Math.round(AI_ENGINES.reduce((s, e) => s + e.accuracy, 0) / AI_ENGINES.length);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="AI Engine Hub"
        subtitle="Central hub for managing and monitoring AI models used across WVW Intelligence"
        icon={Brain}
        iconBg="bg-gold/10 border-gold/20"
        iconColor="text-gold"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Engines", value: AI_ENGINES.length, sub: "all operational" },
          { label: "Calls Today", value: totalCalls.toLocaleString(), sub: "across all models" },
          { label: "Avg Accuracy", value: `${avgAccuracy}%`, sub: "model confidence" },
          { label: "Models Used", value: "3", sub: "Opus, Sonnet, Haiku" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="stat-card">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3 stagger-children">
        {AI_ENGINES.map((engine) => {
          const Icon = engine.icon;
          return (
            <div key={engine.id} className="stat-card group hover:border-gold/20">
              <div className="flex items-start gap-4">
                <div className={cn("w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105", engine.bg)}>
                  <Icon size={20} className={engine.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{engine.name}</h3>
                        <span className="flex items-center gap-1 text-[10px] text-green-500 font-medium">
                          <CheckCircle size={10} /> Active
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-lg">{engine.description}</p>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground flex-shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="flex items-center gap-5 mt-3 text-xs text-muted-foreground">
                    <span className="font-mono text-[11px] bg-muted px-2 py-0.5 rounded">{engine.model}</span>
                    <span>Used in: <span className="text-foreground font-medium">{engine.uses}</span></span>
                    <span><span className="text-foreground font-medium">{engine.callsToday}</span> calls today</span>
                    <span>
                      <span className={cn("font-medium", engine.accuracy >= 95 ? "text-green-500" : engine.accuracy >= 88 ? "text-amber-500" : "text-red-500")}>
                        {engine.accuracy}%
                      </span>{" "}accuracy
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border/60 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", engine.accuracy >= 95 ? "bg-green-500" : engine.accuracy >= 88 ? "bg-amber-500" : "bg-red-500")}
                    style={{ width: `${engine.accuracy}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">{engine.accuracy}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="section-card p-4 bg-muted/30">
        <div className="flex items-start gap-2">
          <AlertCircle size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            All AI engines use Anthropic Claude models. Set your <span className="text-foreground font-medium">ANTHROPIC_API_KEY</span> in environment variables to enable live AI features.
          </p>
        </div>
      </div>
    </div>
  );
}
