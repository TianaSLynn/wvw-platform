import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Lightbulb, AlertTriangle, CheckCircle2, Clock, ChevronRight, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { formatDate, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Recommendations" };

const SEVERITY_STYLES: Record<string, { badge: string; dot: string }> = {
  CRITICAL: { badge: "bg-red-500/10 text-red-500 border-red-500/20",    dot: "bg-red-500"    },
  HIGH:     { badge: "bg-amber-500/10 text-amber-500 border-amber-500/20", dot: "bg-amber-500" },
  MEDIUM:   { badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",  dot: "bg-blue-500"   },
  LOW:      { badge: "bg-muted text-muted-foreground border-border",      dot: "bg-muted-foreground" },
};

const TRIGGER_STYLES: Record<string, { badge: string; icon: typeof TrendingUp }> = {
  "risk-band":    { badge: "bg-red-500/10 text-red-600 border-red-200",    icon: AlertTriangle },
  "pattern-flag": { badge: "bg-amber-500/10 text-amber-600 border-amber-200", icon: Zap },
  "low-score":    { badge: "bg-orange-500/10 text-orange-600 border-orange-200", icon: TrendingUp },
};

export default async function RecommendationsPage() {
  const user = await requireUser();

  const [findings, pathwayRecs, totalOpen, totalClosed, criticalCount, highCount] = await Promise.all([
    db.auditFinding.findMany({
      where: { audit: { orgId: user.orgId }, status: { in: ["OPEN", "IN_PROGRESS"] } },
      include: {
        audit: { select: { id: true, name: true, client: { select: { name: true } } } },
        assignee: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
      take: 50,
    }),
    db.generatedRecommendation.findMany({
      where: { audit: { orgId: user.orgId }, dismissedAt: null },
      include: {
        audit: { select: { id: true, name: true, client: { select: { name: true } } } },
        pathway: { select: { id: true, slug: true, name: true, pathwayNumber: true, priorityLevel: true } },
      },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      take: 30,
    }),
    db.auditFinding.count({ where: { audit: { orgId: user.orgId }, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    db.auditFinding.count({ where: { audit: { orgId: user.orgId }, status: "CLOSED" } }),
    db.auditFinding.count({ where: { audit: { orgId: user.orgId }, status: { in: ["OPEN", "IN_PROGRESS"] }, severity: "CRITICAL" } }),
    db.auditFinding.count({ where: { audit: { orgId: user.orgId }, status: { in: ["OPEN", "IN_PROGRESS"] }, severity: "HIGH" } }),
  ]);

  const totalFindings = totalOpen + totalClosed;
  const closeRate = totalFindings > 0 ? Math.round((totalClosed / totalFindings) * 100) : 0;

  // Group findings by category
  const byCategory: Record<string, typeof findings> = {};
  for (const f of findings) {
    const cat = f.category ?? "General";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(f);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Recommendations"
        subtitle="Pathway recommendations from scoring and open findings needing remediation"
        icon={Lightbulb}
        iconBg="bg-gold/10 border-gold/20"
        iconColor="text-gold"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard label="Pathway Recs" value={pathwayRecs.length} icon={TrendingUp} iconColor="text-gold" iconBg="bg-gold/10 border-gold/20" />
        <StatCard label="Open Findings" value={totalOpen} icon={AlertTriangle} iconColor="text-amber-500" iconBg="bg-amber-500/10 border-amber-500/20" />
        <StatCard label="Critical" value={criticalCount} icon={AlertTriangle} iconColor="text-red-500" iconBg="bg-red-500/10 border-red-500/20" />
        <StatCard label="Close Rate" value={`${closeRate}%`} icon={CheckCircle2} iconColor="text-green-500" iconBg="bg-green-500/10 border-green-500/20" />
      </div>

      {/* ─── Pathway Recommendations (from scoring) ─────────────────────────── */}
      {pathwayRecs.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
              <TrendingUp size={15} className="text-gold" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Pathway Recommendations</h2>
              <p className="text-xs text-muted-foreground">Generated from audit scoring and risk pattern detection</p>
            </div>
          </div>
          <div className="space-y-3">
            {pathwayRecs.map((rec) => {
              const style = TRIGGER_STYLES[rec.triggerType] ?? TRIGGER_STYLES["low-score"]!;
              const Icon = style.icon;
              const priorityLevel = rec.pathway?.priorityLevel;
              const bandColor = priorityLevel === "critical-intervention"
                ? "border-red-200 bg-red-50/50"
                : priorityLevel === "stabilization"
                ? "border-amber-200 bg-amber-50/50"
                : "border-green-200 bg-green-50/50";

              return (
                <div key={rec.id} className={cn("section-card p-5 border", bandColor)}>
                  <div className="flex items-start gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", style.badge)}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-foreground">{rec.title}</h3>
                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 capitalize", style.badge)}>
                          {rec.triggerType.replace("-", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        From{" "}
                        <Link href={`/audits/${rec.audit.id}`} className="text-foreground font-medium hover:text-gold transition-colors">
                          {rec.audit.name}
                        </Link>
                        {rec.audit.client && ` · ${rec.audit.client.name}`}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{rec.body}</p>
                      {rec.pathway && (
                        <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                          <div className="w-5 h-5 rounded bg-gold/10 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-gold">P{rec.pathway.pathwayNumber}</span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">{rec.pathway.name}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">
                              {rec.pathway.priorityLevel?.replace("-", " ")}
                            </p>
                          </div>
                          <Link
                            href="/pathways"
                            className="ml-auto text-xs text-gold flex items-center gap-0.5 hover:underline"
                          >
                            View pathway <ChevronRight size={11} />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Finding-Based Recommendations ──────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle size={15} className="text-amber-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Open Findings</h2>
            <p className="text-xs text-muted-foreground">Audit findings requiring remediation</p>
          </div>
        </div>

        {findings.length === 0 ? (
          <div className="section-card">
            <div className="empty-state py-12">
              <div className="empty-state-icon"><CheckCircle2 size={28} className="text-green-500/50" /></div>
              <p className="text-sm font-medium text-foreground">No open findings</p>
              <p className="text-xs text-muted-foreground mt-1">All audit findings have been addressed or closed</p>
            </div>
          </div>
        ) : (
          Object.entries(byCategory).map(([category, categoryFindings]) => (
            <section key={category} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{category}</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{categoryFindings.length}</span>
              </div>
              <div className="space-y-3">
                {categoryFindings.map((finding) => {
                  const style = (SEVERITY_STYLES[finding.severity] ?? SEVERITY_STYLES.LOW)!;
                  return (
                    <div key={finding.id} className="section-card p-4 hover:shadow-md transition-all">
                      <div className="flex items-start gap-3">
                        <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0", style.dot)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-foreground">{finding.title}</h4>
                            <span className={cn("text-xs px-2 py-0.5 rounded-md border flex-shrink-0", style.badge)}>
                              {finding.severity}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            From{" "}
                            <span className="text-foreground font-medium">{finding.audit.name}</span>
                            {finding.audit.client && ` · ${finding.audit.client.name}`}
                          </p>
                          {finding.description && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{finding.description}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-muted-foreground">
                              {finding.assignee
                                ? `${finding.assignee.firstName} ${finding.assignee.lastName}`
                                : "Unassigned"
                              }
                              {finding.dueDate && ` · Due ${formatDate(finding.dueDate)}`}
                            </p>
                            <Link
                              href={`/audits/${finding.audit.id}`}
                              className="text-xs text-muted-foreground hover:text-gold flex items-center gap-0.5 transition-colors"
                            >
                              View <ChevronRight size={12} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </section>
    </div>
  );
}
