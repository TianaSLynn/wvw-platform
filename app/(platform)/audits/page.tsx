import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/badge";
import { formatDate, cn } from "@/lib/utils";
import Link from "next/link";
import { Plus, ClipboardList, AlertOctagon } from "lucide-react";

export const metadata: Metadata = { title: "Audit Registry" };

const STATUS_BADGE: Record<string, Parameters<typeof Badge>[0]["variant"]> = {
  DRAFT:     "secondary",
  PLANNING:  "default",
  FIELDWORK: "default",
  REVIEW:    "warning",
  REPORTING: "warning",
  COMPLETED: "success",
  ARCHIVED:  "secondary",
};

const STATUS_DOT: Record<string, string> = {
  DRAFT:     "bg-slate-400",
  PLANNING:  "bg-purple-400",
  FIELDWORK: "bg-blue-400 animate-pulse",
  REVIEW:    "bg-amber-400",
  REPORTING: "bg-orange-400",
  COMPLETED: "bg-green-400",
  ARCHIVED:  "bg-slate-400",
};

export default async function AuditsPage() {
  const user = await requireUser();

  const audits = await db.audit.findMany({
    where: { orgId: user.orgId },
    include: {
      client: { select: { name: true } },
      members: { include: { user: { select: { firstName: true, lastName: true } } }, take: 4 },
      _count: { select: { findings: true, evidence: true } },
      findings: {
        where: { status: { in: ["OPEN", "IN_PROGRESS"] }, severity: "CRITICAL" },
        select: { id: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const active = audits.filter((a) => ["FIELDWORK", "REVIEW", "PLANNING"].includes(a.status)).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Audit Registry"
        subtitle={`${audits.length} audits · ${active} active`}
        icon={ClipboardList}
        iconColor="text-gold"
        iconBg="bg-gold/10 border-gold/20"
        actions={
          <Link href="/audits/new" className="btn-primary">
            <Plus size={14} />
            New Audit
          </Link>
        }
      />

      {audits.length === 0 ? (
        <div className="section-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <ClipboardList size={24} className="text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No audits yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first audit from a template or from scratch</p>
            <Link href="/audits/new" className="btn-gold text-xs px-3 py-2">
              <Plus size={13} /> Create Audit
            </Link>
          </div>
        </div>
      ) : (
        <div className="section-card">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Audit</th>
                  <th>Client</th>
                  <th className="hidden sm:table-cell">Type</th>
                  <th>Status</th>
                  <th>Findings</th>
                  <th className="hidden md:table-cell">Evidence</th>
                  <th className="hidden lg:table-cell">Team</th>
                  <th className="hidden lg:table-cell">Updated</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => {
                  const criticalFindings = audit.findings.length;
                  const dot = STATUS_DOT[audit.status] ?? "bg-slate-400";
                  return (
                    <tr key={audit.id}>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <Link href={`/audits/${audit.id}`} className="font-semibold text-foreground hover:text-gold transition-colors leading-tight">
                            {audit.name}
                          </Link>
                          {audit.code && (
                            <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded w-fit">
                              {audit.code}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-muted-foreground text-sm">{audit.client.name}</td>
                      <td className="hidden sm:table-cell">
                        <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-0.5 rounded-md">
                          {audit.type.toLowerCase().replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        <span className="flex items-center gap-1.5 text-xs font-medium whitespace-nowrap">
                          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dot)} />
                          <Badge variant={STATUS_BADGE[audit.status] ?? "secondary"} size="sm">
                            {audit.status.charAt(0) + audit.status.slice(1).toLowerCase().replace(/_/g, " ")}
                          </Badge>
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "font-semibold text-sm",
                            audit._count.findings > 0 ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {audit._count.findings}
                          </span>
                          {criticalFindings > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                              <AlertOctagon size={9} />
                              {criticalFindings}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-muted-foreground hidden md:table-cell">{audit._count.evidence}</td>
                      <td className="hidden lg:table-cell">
                        <div className="flex -space-x-1.5">
                          {audit.members.slice(0, 4).map((m) => (
                            <div
                              key={m.userId}
                              className="w-6 h-6 rounded-full bg-gradient-to-br from-navy-700 to-navy-900 border-2 border-card flex items-center justify-center"
                              title={`${m.user.firstName} ${m.user.lastName}`}
                            >
                              <span className="text-[9px] font-bold text-gold/80">
                                {m.user.firstName[0]}{m.user.lastName[0]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="text-xs text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                        {formatDate(audit.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
