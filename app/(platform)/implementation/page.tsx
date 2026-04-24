import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Wrench, CheckCircle2, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatDate, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Implementation Center" };

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-amber-500/10 text-amber-500",
  IN_PROGRESS: "bg-blue-500/10 text-blue-500",
  CLOSED: "bg-green-500/10 text-green-500",
};

const SEV_STYLES: Record<string, string> = {
  CRITICAL: "text-red-500",
  HIGH: "text-amber-500",
  MEDIUM: "text-blue-500",
  LOW: "text-muted-foreground",
};

export default async function ImplementationPage() {
  const user = await requireUser();

  const [openFindings, inProgressFindings, closedFindings, allFindings] = await Promise.all([
    db.auditFinding.count({ where: { audit: { orgId: user.orgId }, status: "OPEN" } }),
    db.auditFinding.count({ where: { audit: { orgId: user.orgId }, status: "IN_PROGRESS" } }),
    db.auditFinding.count({ where: { audit: { orgId: user.orgId }, status: "CLOSED" } }),
    db.auditFinding.findMany({
      where: {
        audit: { orgId: user.orgId },
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
      include: {
        audit: { select: { name: true, client: { select: { name: true } } } },
        assignee: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ severity: "asc" }, { createdAt: "asc" }],
      take: 30,
    }),
  ]);

  const total = openFindings + inProgressFindings + closedFindings;
  const completionPct = total > 0 ? Math.round((closedFindings / total) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Implementation Center"
        subtitle="Track remediation progress across all open audit findings"
        icon={Wrench}
        iconBg="bg-amber-500/10 border-amber-500/20"
        iconColor="text-amber-500"
      />

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard label="Open" value={openFindings} icon={AlertTriangle} iconColor="text-amber-500" />
        <StatCard label="In Progress" value={inProgressFindings} icon={Clock} iconColor="text-blue-500" />
        <StatCard label="Closed" value={closedFindings} icon={CheckCircle2} iconColor="text-green-500" />
        <StatCard label="Completion Rate" value={`${completionPct}%`} icon={CheckCircle2} iconColor={completionPct >= 80 ? "text-green-500" : "text-amber-500"} />
      </div>

      {/* Progress bar */}
      <div className="section-card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground">Overall Remediation Progress</p>
          <p className="text-sm font-bold text-foreground">{completionPct}%</p>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", completionPct >= 80 ? "bg-green-500" : completionPct >= 50 ? "bg-gold" : "bg-amber-500")}
            style={{ width: `${completionPct}%` }} />
        </div>
        <div className="flex items-center gap-6 mt-2 text-xs text-muted-foreground">
          <span>{closedFindings} closed</span>
          <span>{inProgressFindings} in progress</span>
          <span>{openFindings} open</span>
          <span>{total} total</span>
        </div>
      </div>

      {/* Findings table */}
      <div className="section-card">
        <div className="section-card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">Active Remediation Items</h2>
          </div>
          <Link href="/recommendations" className="text-xs text-muted-foreground hover:text-foreground">View All →</Link>
        </div>
        {allFindings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><CheckCircle2 size={28} className="text-green-500/50" /></div>
            <p className="text-sm font-medium text-foreground">All findings remediated</p>
            <p className="text-xs text-muted-foreground">No open findings requiring implementation</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Finding</th>
                  <th>Audit</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Due Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {allFindings.map((f) => (
                  <tr key={f.id}>
                    <td className="font-medium text-foreground max-w-[200px] truncate">{f.title}</td>
                    <td className="text-muted-foreground text-xs">{f.audit.name}</td>
                    <td>
                      <span className={cn("text-xs font-semibold", SEV_STYLES[f.severity] ?? "text-muted-foreground")}>
                        {f.severity}
                      </span>
                    </td>
                    <td>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_STYLES[f.status] ?? "bg-muted text-muted-foreground")}>
                        {f.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="text-muted-foreground text-xs">
                      {f.assignee ? `${f.assignee.firstName} ${f.assignee.lastName}` : "Unassigned"}
                    </td>
                    <td className="text-muted-foreground text-xs">
                      {f.dueDate ? formatDate(f.dueDate) : "—"}
                    </td>
                    <td>
                      <Link href={`/audits/${f.auditId}`} className="btn-ghost text-xs flex items-center gap-1">
                        View <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
