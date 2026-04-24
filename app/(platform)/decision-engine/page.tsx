import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Brain, ChevronRight, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Decision Engine" };

const DECISION_FRAMEWORKS = [
  { name: "Finding Escalation Matrix", desc: "Determine when to escalate a finding to management or the board", trigger: "Audit finding identified", icon: "⬆️" },
  { name: "Scope Change Decision Tree", desc: "Navigate scope additions and change order approvals", trigger: "Client requests additional work", icon: "🔀" },
  { name: "Materiality Assessment", desc: "Determine if a finding is material to the audit opinion", trigger: "Evaluating finding significance", icon: "⚖️" },
  { name: "Remediation Priority Framework", desc: "Prioritize which findings to remediate first using risk scoring", trigger: "Multiple open findings", icon: "📊" },
  { name: "Independence Assessment", desc: "Evaluate auditor independence for a given engagement", trigger: "New client or service consideration", icon: "🛡️" },
];

export default async function DecisionEnginePage() {
  const user = await requireUser();

  const [openFindings, criticalFindings] = await Promise.all([
    db.auditFinding.findMany({
      where: {
        audit: { orgId: user.orgId },
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
      include: {
        audit: { select: { name: true, client: { select: { name: true } } } },
      },
      orderBy: { severity: "asc" },
      take: 10,
    }),
    db.auditFinding.count({
      where: {
        audit: { orgId: user.orgId },
        status: { in: ["OPEN", "IN_PROGRESS"] },
        severity: { in: ["CRITICAL", "HIGH"] },
      },
    }),
  ]);

  const SEVERITY_RECOMMENDATIONS: Record<string, { action: string; escalate: boolean; timeline: string }> = {
    CRITICAL: { action: "Immediate notification to management — do not wait for report", escalate: true, timeline: "Within 24 hours" },
    HIGH: { action: "Prioritize in next audit status update — management attention required", escalate: true, timeline: "Within 1 week" },
    MEDIUM: { action: "Document and include in draft report — standard remediation timeline", escalate: false, timeline: "Within 90 days" },
    LOW: { action: "Include in management letter — recommend next review cycle", escalate: false, timeline: "Next audit cycle" },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Decision Engine"
        subtitle="Structured decision support for audit determinations, escalations, and risk assessments"
        icon={Brain}
        iconBg="bg-purple-500/10 border-purple-500/20"
        iconColor="text-purple-500"
      />

      {criticalFindings > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-foreground">
            <span className="font-semibold text-red-500">{criticalFindings} critical/high findings</span> require escalation decisions
          </p>
          <Link href="/recommendations" className="ml-auto text-xs text-red-500 hover:underline">Review →</Link>
        </div>
      )}

      {/* Decision frameworks */}
      <div className="section-card">
        <div className="section-card-header flex items-center gap-2">
          <Brain size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">Decision Frameworks</h2>
        </div>
        <div className="divide-y divide-border">
          {DECISION_FRAMEWORKS.map((fw) => (
            <div key={fw.name} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group cursor-pointer">
              <span className="text-xl flex-shrink-0">{fw.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{fw.name}</p>
                <p className="text-xs text-muted-foreground">{fw.desc}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Trigger: <em>{fw.trigger}</em></p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 mt-0.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Open findings needing decisions */}
      {openFindings.length > 0 && (
        <div className="section-card">
          <div className="section-card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb size={15} className="text-gold" />
              <h2 className="text-sm font-semibold">Findings Awaiting Decisions</h2>
            </div>
          </div>
          <div className="divide-y divide-border">
            {openFindings.map((finding) => {
              const rec = SEVERITY_RECOMMENDATIONS[finding.severity];
              return (
                <div key={finding.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{finding.title}</p>
                      <p className="text-xs text-muted-foreground">{finding.audit.name} · {finding.audit.client?.name}</p>
                    </div>
                    <span className={cn("text-xs px-2 py-0.5 rounded-md border flex-shrink-0 font-medium",
                      finding.severity === "CRITICAL" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                      finding.severity === "HIGH" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                      "bg-blue-500/10 text-blue-500 border-blue-500/20"
                    )}>
                      {finding.severity}
                    </span>
                  </div>
                  {rec && (
                    <div className={cn("flex items-start gap-2 text-xs p-2 rounded-lg", rec.escalate ? "bg-amber-500/10" : "bg-muted/50")}>
                      {rec.escalate
                        ? <AlertTriangle size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        : <CheckCircle2 size={12} className="text-green-500 flex-shrink-0 mt-0.5" />
                      }
                      <span className="text-foreground">{rec.action} <span className="text-muted-foreground">— Target: {rec.timeline}</span></span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
