import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { BookOpen, Plus, Tag, Layers, BarChart3, ArrowRight, Globe } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit Catalog" };

const TYPE_LABELS: Record<string, string> = {
  IT:          "IT Security",
  COMPLIANCE:  "Compliance",
  FINANCIAL:   "Financial",
  OPERATIONAL: "Operational",
  HR:          "HR",
  RISK:        "Risk",
  INTERNAL:    "Internal",
  EXTERNAL:    "External",
  CUSTOM:      "Custom",
};

const TYPE_COLORS: Record<string, string> = {
  IT:          "bg-blue-500/10 text-blue-500 border-blue-500/20",
  COMPLIANCE:  "bg-green-500/10 text-green-600 border-green-500/20",
  FINANCIAL:   "bg-amber-500/10 text-amber-600 border-amber-500/20",
  OPERATIONAL: "bg-red-500/10 text-red-500 border-red-500/20",
  HR:          "bg-sage/30 text-sage border-sage/30",
  RISK:        "bg-purple-500/10 text-purple-600 border-purple-500/20",
  INTERNAL:    "bg-slate-500/10 text-slate-600 border-slate-500/20",
  EXTERNAL:    "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  CUSTOM:      "bg-muted text-muted-foreground border-border",
};

export default async function AuditCatalogPage() {
  const user = await requireUser();

  const [globalTemplates, orgTemplates] = await Promise.all([
    db.auditTemplate.findMany({
      where: { isGlobal: true, isPublished: true },
      include: { _count: { select: { sections: true, audits: true } } },
      orderBy: { name: "asc" },
    }),
    db.auditTemplate.findMany({
      where: { orgId: user.orgId, isGlobal: false },
      include: { _count: { select: { sections: true, audits: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  // Count total items in each global template
  const globalWithItemCounts = await Promise.all(
    globalTemplates.map(async (tpl) => {
      const count = await db.auditTemplateItem.count({
        where: { section: { templateId: tpl.id } },
      });
      return { ...tpl, itemCount: count };
    })
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Audit Catalog"
        subtitle="Browse framework templates and your organization's custom audit templates"
        icon={BookOpen}
        iconBg="bg-blue-500/10 border-blue-500/20"
        iconColor="text-blue-500"
        actions={
          <Link href="/audits/new" className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Launch Audit
          </Link>
        }
      />

      {/* Global Framework Templates */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Globe size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Industry Framework Templates</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {globalWithItemCounts.length}
          </span>
        </div>

        {globalWithItemCounts.length === 0 ? (
          <div className="section-card p-8 text-center">
            <Globe size={28} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No framework templates seeded yet</p>
            {(user.role === "SUPER_ADMIN" || user.role === "ADMIN") && (
              <form action="/api/admin/seed-templates" method="POST" className="inline">
                <button type="submit" className="btn-primary mt-3 text-xs">
                  Seed Framework Templates
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
            {globalWithItemCounts.map((tpl) => {
              const colorClass = TYPE_COLORS[tpl.type] ?? TYPE_COLORS.CUSTOM!;
              return (
                <div key={tpl.id} className="section-card p-5 hover:shadow-lg transition-all group flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <span className={cn("text-xs font-medium px-2 py-1 rounded-md border", colorClass)}>
                      {TYPE_LABELS[tpl.type] ?? tpl.type}
                    </span>
                    <Tag size={14} className="text-muted-foreground/40" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-2">{tpl.name}</h3>
                  {tpl.description && (
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed flex-1">{tpl.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span>
                      <span className="font-medium text-foreground">{tpl._count.sections}</span> sections
                    </span>
                    <span>
                      <span className="font-medium text-foreground">{tpl.itemCount}</span> items
                    </span>
                    {tpl._count.audits > 0 && (
                      <span className="text-gold">
                        <span className="font-medium">{tpl._count.audits}</span>× used
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/audits/new?template=${tpl.id}`}
                    className="btn-gold w-full text-xs py-2 flex items-center justify-center gap-1.5 group-hover:gap-2 transition-all"
                  >
                    Launch Audit
                    <ArrowRight size={13} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Org Custom Templates */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Your Organization&apos;s Templates</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{orgTemplates.length}</span>
          </div>
        </div>

        {orgTemplates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <BookOpen size={28} className="text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-foreground">No custom templates yet</p>
            <p className="text-xs text-muted-foreground mt-1">Start from a framework template above or create one from scratch</p>
            <Link href="/audits/new" className="btn-primary mt-4 text-xs">Create Audit</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {orgTemplates.map((tpl) => {
              const colorClass = TYPE_COLORS[tpl.type] ?? TYPE_COLORS.CUSTOM!;
              return (
                <div key={tpl.id} className="section-card p-5 hover:shadow-lg transition-all group flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <span className={cn("text-xs font-medium px-2 py-1 rounded-md border", colorClass)}>
                      {TYPE_LABELS[tpl.type] ?? tpl.type}
                    </span>
                    {tpl.isPublished
                      ? <span className="text-[10px] text-green-500 font-medium">Published</span>
                      : <span className="text-[10px] text-muted-foreground font-medium">Draft</span>
                    }
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">{tpl.name}</h3>
                  {tpl.description && (
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed flex-1">{tpl.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span><span className="font-medium text-foreground">{tpl._count.sections}</span> sections</span>
                    <span><span className="font-medium text-foreground">{tpl._count.audits}</span>× used</span>
                  </div>
                  <Link
                    href={`/audits/new?template=${tpl.id}`}
                    className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-1.5"
                  >
                    Launch Audit
                    <ArrowRight size={13} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
