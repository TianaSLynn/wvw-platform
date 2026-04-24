import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { FileText, Sparkles, ArrowRight, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { cn, riskScoreLabel, riskScoreColor } from "@/lib/utils";

export const metadata: Metadata = { title: "Reports" };

const STATUS_BADGE: Record<string, string> = {
  COMPLETED:  "bg-green-50 dark:bg-green-950/30 text-green-600 border-green-200 dark:border-green-800",
  REVIEW:     "bg-blue-50 dark:bg-blue-950/30 text-blue-600 border-blue-200 dark:border-blue-800",
  FIELDWORK:  "bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-200 dark:border-amber-800",
  REPORTING:  "bg-purple-50 dark:bg-purple-950/30 text-purple-600 border-purple-200 dark:border-purple-800",
  PLANNING:   "bg-gray-50 dark:bg-gray-900/50 text-gray-600 border-gray-200 dark:border-gray-700",
  DRAFT:      "bg-gray-50 dark:bg-gray-900/50 text-gray-600 border-gray-200 dark:border-gray-700",
  ARCHIVED:   "bg-gray-50 dark:bg-gray-900/50 text-gray-500 border-gray-200 dark:border-gray-700",
};

export default async function ReportsPage() {
  const user = await requireUser();

  const audits = await db.audit.findMany({
    where: {
      orgId: user.orgId,
      status: { in: ["FIELDWORK", "REVIEW", "REPORTING", "COMPLETED"] },
    },
    select: {
      id: true, name: true, code: true, type: true, status: true,
      overallRiskScore: true, updatedAt: true,
      client: { select: { name: true } },
      findings: {
        select: { severity: true, status: true },
      },
      _count: { select: { evidence: true } },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  const reportReady    = audits.filter((a) => ["REPORTING", "COMPLETED"].includes(a.status));
  const inProgress     = audits.filter((a) => ["FIELDWORK", "REVIEW"].includes(a.status));

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI-generated audit reports ready for export
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900 to-navy-700 border border-gold/20 flex items-center justify-center">
          <FileText size={18} className="text-gold" />
        </div>
      </div>

      {/* Ready for report */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle size={15} className="text-green-500" />
          <h2 className="font-semibold text-sm">Report Ready ({reportReady.length})</h2>
        </div>
        {reportReady.length === 0 ? (
          <div className="section-card p-8 text-center">
            <p className="text-muted-foreground text-sm">No audits in reporting or completed state.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reportReady.map((audit) => (
              <AuditReportCard key={audit.id} audit={audit} />
            ))}
          </div>
        )}
      </div>

      {/* In progress */}
      {inProgress.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={15} className="text-amber-500" />
            <h2 className="font-semibold text-sm">In Progress — Reports Available ({inProgress.length})</h2>
          </div>
          <div className="space-y-3">
            {inProgress.map((audit) => (
              <AuditReportCard key={audit.id} audit={audit} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {audits.length === 0 && (
        <div className="section-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={24} className="text-muted-foreground" />
            </div>
            <p className="font-semibold">No audits eligible for reporting</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
              Audits must be in Fieldwork, Review, Reporting, or Completed status.
            </p>
            <Link href="/audits/new" className="btn-primary text-xs">
              Start an Audit
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditReportCard({ audit }: {
  audit: {
    id: string; name: string; code: string | null; type: string; status: string;
    overallRiskScore: number | null; updatedAt: Date;
    client: { name: string };
    findings: Array<{ severity: string; status: string }>;
    _count: { evidence: number };
  };
}) {
  const openFindings    = audit.findings.filter((f) => ["OPEN", "IN_PROGRESS"].includes(f.status)).length;
  const criticalCount   = audit.findings.filter((f) => f.severity === "CRITICAL").length;
  const hasRiskScore    = audit.overallRiskScore !== null;

  return (
    <div className="stat-card group hover:border-gold/20 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", STATUS_BADGE[audit.status] ?? "border-border text-muted-foreground")}>
              {audit.status.charAt(0) + audit.status.slice(1).toLowerCase()}
            </span>
            <span className="text-xs text-muted-foreground font-mono">{audit.code}</span>
            <span className="text-xs text-muted-foreground">· {audit.type}</span>
          </div>
          <h3 className="font-semibold text-foreground truncate">{audit.name}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{audit.client.name}</p>
        </div>

        <Link
          href={`/audits/${audit.id}/report`}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-navy-900 to-navy-700 text-white text-xs font-medium hover:opacity-90 transition-opacity ml-4 flex-shrink-0 group-hover:gap-2"
        >
          <Sparkles size={12} /> Generate Report
          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
        <span>{audit.findings.length} findings</span>
        {openFindings > 0 && (
          <span className="flex items-center gap-1 text-amber-600">
            <AlertTriangle size={11} /> {openFindings} open
          </span>
        )}
        {criticalCount > 0 && (
          <span className="flex items-center gap-1 text-red-600">
            {criticalCount} critical
          </span>
        )}
        <span>{audit._count.evidence} evidence items</span>
        {hasRiskScore && (
          <span className={cn("font-medium", riskScoreColor(audit.overallRiskScore!))}>
            Risk: {audit.overallRiskScore} · {riskScoreLabel(audit.overallRiskScore!)}
          </span>
        )}
        <span className="ml-auto">
          Updated {new Date(audit.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
    </div>
  );
}
