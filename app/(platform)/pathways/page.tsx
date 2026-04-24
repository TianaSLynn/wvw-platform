import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { GitBranch, ArrowRight, Clock, AlertTriangle, TrendingUp, Zap, Shield } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "WVW Pathway Engine" };

const PRIORITY_CONFIG: Record<string, {
  color: string; bg: string; border: string; borderLeft: string; dot: string;
  icon: typeof AlertTriangle;
}> = {
  "critical-intervention": {
    color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/30",
    borderLeft: "border-l-red-500", dot: "bg-red-500", icon: AlertTriangle,
  },
  "stabilization": {
    color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/30",
    borderLeft: "border-l-amber-500", dot: "bg-amber-500", icon: Shield,
  },
  "growth": {
    color: "text-green-600", bg: "bg-green-500/10", border: "border-green-500/30",
    borderLeft: "border-l-green-500", dot: "bg-green-500", icon: TrendingUp,
  },
};

const PRIORITY_LABELS: Record<string, string> = {
  "critical-intervention": "Critical Intervention",
  "stabilization":         "Stabilization",
  "growth":                "Growth",
};

export default async function PathwaysPage() {
  const user = await requireUser();

  const [pathways, orgTemplates] = await Promise.all([
    db.pathway.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { pathwayNumber: "asc" }],
    }),
    db.auditTemplate.findMany({
      where: { orgId: user.orgId, isPublished: true },
      select: { name: true, id: true },
    }),
  ]);

  // Map template slug → template record
  const slugToTemplate = Object.fromEntries(
    orgTemplates.map((t) => [t.id.replace("wvw-tpl-", ""), t])
  );

  const groups = [
    { key: "critical-intervention", pathways: pathways.filter((p) => p.priorityLevel === "critical-intervention") },
    { key: "stabilization",         pathways: pathways.filter((p) => p.priorityLevel === "stabilization") },
    { key: "growth",                pathways: pathways.filter((p) => p.priorityLevel === "growth") },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="WVW Pathway Engine"
        subtitle="Evidence-based intervention pathways connecting audit findings to structured implementation plans"
        icon={GitBranch}
        iconBg="bg-gold/10 border-gold/20"
        iconColor="text-gold"
        actions={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{pathways.length}</span> pathways active
          </div>
        }
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(PRIORITY_LABELS).map(([key, label]) => {
          const cfg = PRIORITY_CONFIG[key]!;
          return (
            <div key={key} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border", cfg.bg, cfg.color, cfg.border)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
              {label}
            </div>
          );
        })}
      </div>

      {groups.map(({ key, pathways: groupPathways }) => {
        if (groupPathways.length === 0) return null;
        const cfg = PRIORITY_CONFIG[key]!;
        const Icon = cfg.icon;
        const label = PRIORITY_LABELS[key]!;

        return (
          <section key={key}>
            <div className="flex items-center gap-2 mb-4">
              <Icon size={15} className={cfg.color} />
              <h2 className={cn("text-sm font-bold", cfg.color)}>{label}</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {groupPathways.length} pathway{groupPathways.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-children">
              {groupPathways.map((pathway) => {
                const availableAudits = pathway.recommendedAuditSlugs.filter((s) => slugToTemplate[s]);
                const firstTpl = availableAudits[0] ? slugToTemplate[availableAudits[0]] : null;

                return (
                  <div key={pathway.id} className={cn("section-card border-l-4 hover:shadow-lg transition-all", cfg.borderLeft)}>
                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", cfg.bg, cfg.color, cfg.border)}>
                              P{pathway.pathwayNumber}
                            </span>
                            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", cfg.bg, cfg.color)}>
                              {label}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-foreground">{pathway.name}</h3>
                        </div>
                        {pathway.duration && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                            <Clock size={11} /> {pathway.duration}
                          </div>
                        )}
                      </div>

                      {pathway.description && (
                        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{pathway.description}</p>
                      )}

                      {/* Target Levels */}
                      {pathway.targetLevels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {pathway.targetLevels.map((lvl) => (
                            <span key={lvl} className="text-[10px] bg-muted text-foreground px-2 py-0.5 rounded-full border border-border capitalize">
                              {lvl.replace(/-/g, " ")}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Focus Areas */}
                      {pathway.focusAreas.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {pathway.focusAreas.map((area) => (
                            <span key={area} className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full capitalize">
                              {area.replace(/-/g, " ")}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Recommended Audits */}
                      {pathway.recommendedAuditSlugs.length > 0 && (
                        <div className="space-y-1.5 mb-4">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Recommended Audits</p>
                          {pathway.recommendedAuditSlugs.map((slug) => {
                            const tpl = slugToTemplate[slug];
                            return (
                              <div key={slug} className="flex items-center gap-2 text-xs">
                                <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", tpl ? "bg-green-500" : "bg-muted-foreground/30")} />
                                {tpl ? (
                                  <Link href={`/audits/new?template=${tpl.id}`} className="text-foreground hover:text-gold transition-colors">
                                    {tpl.name}
                                  </Link>
                                ) : (
                                  <span className="text-muted-foreground italic">{slug.replace(/-/g, " ")}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-3 border-t border-border">
                        <Link
                          href={firstTpl ? `/audits/new?template=${firstTpl.id}` : "/audits/new"}
                          className="btn-primary flex items-center gap-1.5 text-xs"
                        >
                          Start First Audit <ArrowRight size={12} />
                        </Link>
                        <Link href="/audit-catalog" className="btn-ghost text-xs">
                          View All Templates
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {pathways.length === 0 && (
        <div className="empty-state py-16">
          <div className="empty-state-icon"><GitBranch size={22} className="text-muted-foreground" /></div>
          <p className="font-semibold text-sm">No pathways found</p>
          <p className="text-xs text-muted-foreground mt-1">Run the pathway seed to populate WVW pathways.</p>
        </div>
      )}
    </div>
  );
}
